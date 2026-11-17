// Student side of: Telegram linking (username guard), referral progress, reward credits (unlock courses/groups),
// plus the Telegram webhook endpoint.
import { Router } from 'express';
import mongoose from 'mongoose';
import {
  User, Course, Category, Enrollment, GroupEnrollment, ReferralCampaign, ReferralShare, RewardTicket, CreditTransaction,
} from '../models/index.js';
import { requireAuth } from '../auth.js';
import { fail } from '../i18n.js';
import { ah, hasCourseAccess, hasGroupAccess, groupPrice } from '../lib.js';
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
      .populate('course', 'title titleAm slug').populate('category', 'title titleAm'),
  });
}));

/** Spend reward credit to unlock a premium course or a whole group: body { type: 'course'|'group', id } */
router.post('/credits/redeem', requireAuth, ah(async (req, res) => {
  const { type, id } = req.body || {};
  if (!['course', 'group'].includes(type) || !mongoose.isValidObjectId(id)) return fail(req, res, 400, 'notFound');
  let price = 0;
  if (type === 'course') {
    const course = await Course.findOne({ _id: id, isPublished: true }).lean();
    if (!course) return fail(req, res, 404, 'courseNotFound');
    if (course.isFree) return fail(req, res, 400, 'freeCourse');
    if (await hasCourseAccess(req.user, course)) return fail(req, res, 400, 'alreadyUnlocked');
    price = course.priceEtb || 0;
  } else {
    const cat = await Category.findById(id).lean();
    if (!cat) return fail(req, res, 404, 'groupNotFound');
    if (await hasGroupAccess(req.user, id)) return fail(req, res, 400, 'alreadyUnlocked');
    price = groupPrice(cat);
    if (!price) return fail(req, res, 400, 'noGroupPrice');
  }
  if (!price) return fail(req, res, 400, 'nothingToPay');
  // Atomic: only deducts when the balance is enough
  const u = await User.findOneAndUpdate({ _id: req.user.id, creditEtb: { $gte: price } }, { $inc: { creditEtb: -price } }, { new: true });
  if (!u) return fail(req, res, 400, 'notEnoughCredit');
  try {
    if (type === 'course') {
      await Enrollment.updateOne({ user: u._id, course: id }, { $setOnInsert: { user: u._id, course: id } }, { upsert: true });
    } else {
      await GroupEnrollment.updateOne({ user: u._id, category: id }, { $setOnInsert: { user: u._id, category: id, source: 'credit' } }, { upsert: true });
    }
    await CreditTransaction.create({
      user: u._id, amountEtb: -price, reason: type === 'course' ? 'unlock_course' : 'unlock_group',
      ...(type === 'course' ? { course: id } : { category: id }),
    });
  } catch (e) {
    await User.updateOne({ _id: u._id }, { $inc: { creditEtb: price } }); // refund on failure
    throw e;
  }
  res.json({ ok: true, creditEtb: u.creditEtb });
}));

export default router;
