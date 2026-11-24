// Student side of: Telegram linking (username guard), referral progress, reward credits (unlock courses/groups),
// plus the Telegram webhook endpoint.
import { Router } from 'express';
import mongoose from 'mongoose';
import {
  User, Course, Category, Lesson, LessonUnlock, Enrollment, GroupEnrollment, ReferralCampaign, ReferralShare, RewardTicket, CreditTransaction,
} from '../models/index.js';
import { requireAuth } from '../auth.js';
import { fail } from '../i18n.js';
import {
  ah, hasCourseAccess, hasLessonAccess, hasGroupAccess, groupPrice, courseTokenInfo, spendTokens,
} from '../lib.js';
import {
  botConfig, handleUpdate, createLinkUrl, ensureReferralCode, referralBotLink, referralWebLink, isBotReady,
} from '../telegram.js';

const router = Router();
const USERNAME = /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/;

// ---------- Telegram webhook (Telegram → our server) ----------
// Updates are answered at once (Telegram retries slow webhooks) and then processed one at a time, in order.
let queue = Promise.resolve();
router.post('/telegram/webhook', async (req, res) => {
  const cfg = await botConfig();
  if (!cfg.webhookSecret || req.get('x-telegram-bot-api-secret-token') !== cfg.webhookSecret) return res.sendStatus(401);
  res.sendStatus(200);
  const update = req.body || {};
  queue = queue.then(() => handleUpdate(update)).catch((e) => console.error('Telegram update failed:', e.message));
});

// ---------- Profile: Telegram username (mandatory before sharing from Board 3) ----------
router.get('/me/profile', requireAuth, ah(async (req, res) => {
  const u = await User.findById(req.user.id).lean();
  res.json({
    telegramUsername: u.telegramUsername || '',
    telegramLinked: !!u.telegramId,
    referralCode: u.referralCode || '',
    creditEtb: u.creditEtb || 0,
    botReady: await isBotReady(),
  });
}));

router.put('/me/telegram', requireAuth, ah(async (req, res) => {
  const raw = String(req.body?.telegramUsername || '').trim();
  if (!USERNAME.test(raw)) return fail(req, res, 400, 'telegramUsername');
  const username = `@${raw.replace(/^@/, '')}`;
  await User.updateOne({ _id: req.user.id }, { telegramUsername: username });
  res.json({ ok: true, telegramUsername: username });
}));

/** Returns the bot deep link that links this account, then the bot shows the share menu. */
router.post('/telegram/link', requireAuth, ah(async (req, res) => {
  if (!(await isBotReady())) return fail(req, res, 503, 'telegramNotConfigured');
  const u = await User.findById(req.user.id);
  if (!u.telegramUsername) return fail(req, res, 400, 'telegramUsername');
  await ensureReferralCode(u);
  res.json({ url: await createLinkUrl(u._id), linked: !!u.telegramId });
}));

// ---------- Referral progress ----------
router.get('/me/referrals', requireAuth, ah(async (req, res) => {
  const cfg = await botConfig();
  const u = await User.findById(req.user.id);
  if (cfg.username) await ensureReferralCode(u);
  const [campaigns, tickets] = await Promise.all([
    ReferralCampaign.find({ isActive: true }).sort({ createdAt: 1 }),
    RewardTicket.find({ user: u._id }).sort({ createdAt: -1 }).populate('campaign', 'title titleAm'),
  ]);
  const list = await Promise.all(campaigns.map(async (c) => ({
    id: c.id, code: c.code, kind: c.kind, title: c.title, titleAm: c.titleAm, description: c.description,
    sponsorName: c.sponsorName, milestones: c.milestones,
    shares: await ReferralShare.countDocuments({ referrer: u._id, campaign: c._id }),
    botLink: cfg.username && u.referralCode ? referralBotLink(cfg, u, c) : '',
    webLink: u.referralCode ? referralWebLink(cfg, u, c) : '',
  })));
  res.json({
    telegramUsername: u.telegramUsername || '', telegramLinked: !!u.telegramId, creditEtb: u.creditEtb || 0,
    botUsername: cfg.username || '', campaigns: list, tickets,
  });
}));

router.get('/me/credits', requireAuth, ah(async (req, res) => {
  const u = await User.findById(req.user.id, 'creditEtb').lean();
  res.json({
    creditEtb: u?.creditEtb || 0,
    transactions: await CreditTransaction.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50)
      .populate('course', 'title titleAm slug').populate('category', 'title titleAm').populate('lesson', 'title titleAm'),
  });
}));

/**
 * Spend tokens (1 token = 1 ETB) to unlock a lesson, a course or a whole group: body { type: 'lesson'|'course'|'group', id }.
 * The server decides the price; the browser never sends one. See spendTokens() in lib.js for the safety rules.
 */
router.post('/credits/redeem', requireAuth, ah(async (req, res) => {
  const { type, id } = req.body || {};
  if (!['lesson', 'course', 'group'].includes(type) || !mongoose.isValidObjectId(id)) return fail(req, res, 400, 'notFound');
  let price = 0;
  let entry;
  let grant;
  const uid = req.user.id;

  if (type === 'group') {
    const cat = await Category.findById(id).lean();
    if (!cat) return fail(req, res, 404, 'groupNotFound');
    if (await hasGroupAccess(req.user, id)) return fail(req, res, 400, 'alreadyUnlocked');
    price = groupPrice(cat);
    if (!price) return fail(req, res, 400, 'noGroupPrice');
    entry = { reason: 'unlock_group', category: id };
    grant = async () => (await GroupEnrollment.updateOne({ user: uid, category: id },
      { $setOnInsert: { user: uid, category: id, source: 'credit' } }, { upsert: true })).upsertedCount === 1;
  } else {
    let course; let lesson = null;
    if (type === 'lesson') {
      lesson = await Lesson.findById(id).lean();
      if (!lesson) return fail(req, res, 404, 'lessonNotFound');
      course = await Course.findOne({ _id: lesson.course, isPublished: true }).lean();
    } else {
      course = await Course.findOne({ _id: id, isPublished: true }).lean();
    }
    if (!course) return fail(req, res, 404, 'courseNotFound');
    if (course.isFree) return fail(req, res, 400, 'freeCourse');
    if (await hasCourseAccess(req.user, course)) return fail(req, res, 400, 'alreadyUnlocked');
    if (type === 'lesson') {
      if (await hasLessonAccess(req.user, lesson, course)) return fail(req, res, 400, 'alreadyUnlocked');
      const info = await courseTokenInfo(uid, course, await Lesson.countDocuments({ course: course._id }));
      price = info.lessonPrice;
      entry = { reason: 'unlock_lesson', lesson: id, course: course._id };
      grant = async () => (await LessonUnlock.updateOne({ user: uid, lesson: id },
        { $setOnInsert: { user: uid, lesson: id, course: course._id, paidEtb: price } }, { upsert: true })).upsertedCount === 1;
    } else {
      // Whole course: price minus the tokens already spent on its single lessons (never pay twice)
      const info = await courseTokenInfo(uid, course, await Lesson.countDocuments({ course: course._id }));
      price = info.courseRemaining;
      entry = { reason: 'unlock_course', course: id };
      grant = async () => (await Enrollment.updateOne({ user: uid, course: id },
        { $setOnInsert: { user: uid, course: id } }, { upsert: true })).upsertedCount === 1;
    }
  }
  if (!(price > 0)) return fail(req, res, 400, 'nothingToPay');
  const r = await spendTokens(uid, price, entry, grant);
  if (r.error) return fail(req, res, 400, r.error);
  res.json({ ok: true, creditEtb: r.balance, spent: price });
}));

export default router;
