// Admin API for the advanced features: Cloudinary accounts, promo boards, Telegram bot, referral campaigns,
// reward tickets, credits and assignment submissions. Every route requires role "admin".
import { Router } from 'express';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import {
  CloudinaryAccount, Promo, ReferralCampaign, ReferralShare, RewardTicket, CreditTransaction, User, Assignment,
  Lesson, Category, Payment,
} from '../models/index.js';
import { requireAdmin } from '../auth.js';
import { fail } from '../i18n.js';
import { ah } from '../lib.js';
import { encrypt, decrypt, mask } from '../secret.js';
import { listAccounts, invalidateAccounts, pingAccount, syncMedia, receiptUrl, accountFor } from '../cloudinary.js';
import { configureBot, botStatus, decideTicket } from '../telegram.js';

const router = Router();
router.use(requireAdmin);
const validId = (id) => mongoose.isValidObjectId(id);
const str = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// ======================= Cloudinary accounts =======================
const publicAccount = (a) => ({
  id: a.id, label: a.label, cloudName: a.cloudName, apiKey: a.apiKey, apiSecret: mask(a.apiSecret),
  role: a.role, folder: a.folder, isActive: a.isActive, fromEnv: !!a.fromEnv,
});

router.get('/cloudinary-accounts', ah(async (_req, res) => {
  res.json((await listAccounts()).map(publicAccount));
}));

async function setRole(id, role) {
  if (role === 'primary' || role === 'secondary') {
    await CloudinaryAccount.updateMany({ role, _id: { $ne: id } }, { role: 'extra' });
  }
}

router.post('/cloudinary-accounts', ah(async (req, res) => {
  const b = req.body || {};
  const data = { label: str(b.label, 80), cloudName: str(b.cloudName, 80), apiKey: str(b.apiKey, 80), apiSecret: str(b.apiSecret, 120) };
  if (!data.label || !data.cloudName || !data.apiKey || !data.apiSecret) return fail(req, res, 400, 'cloudAccountFields');
  const test = await pingAccount(data);
  if (!test.ok) return res.status(400).json({ error: test.error, code: 'cloudAccountFailed' });
  const role = ['primary', 'secondary'].includes(b.role) ? b.role : 'extra';
  const acc = await CloudinaryAccount.create({
    label: data.label, cloudName: data.cloudName, apiKey: data.apiKey, apiSecretEnc: encrypt(data.apiSecret),
    role, folder: str(b.folder, 80), isActive: b.isActive !== false,
  });
  await setRole(acc._id, role);
  invalidateAccounts();
  res.json({ id: acc.id });
}));

router.put('/cloudinary-accounts/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'notFound');
  const acc = await CloudinaryAccount.findById(req.params.id);
  if (!acc) return fail(req, res, 404, 'notFound');
  const b = req.body || {};
  const secret = str(b.apiSecret, 120);
  const changedCreds = (b.cloudName && b.cloudName !== acc.cloudName) || (b.apiKey && b.apiKey !== acc.apiKey) || (secret && !secret.includes('…'));
  if (b.label !== undefined) acc.label = str(b.label, 80) || acc.label;
  if (b.cloudName) acc.cloudName = str(b.cloudName, 80);
  if (b.apiKey) acc.apiKey = str(b.apiKey, 80);
  if (secret && !secret.includes('…') && secret !== '••••') acc.apiSecretEnc = encrypt(secret);
  if (b.folder !== undefined) acc.folder = str(b.folder, 80);
  if (b.isActive !== undefined) acc.isActive = !!b.isActive;
  if (['primary', 'secondary', 'extra'].includes(b.role)) acc.role = b.role;
  if (changedCreds) {
    const test = await pingAccount({ cloudName: acc.cloudName, apiKey: acc.apiKey, apiSecret: decrypt(acc.apiSecretEnc) });
    if (!test.ok) return res.status(400).json({ error: test.error, code: 'cloudAccountFailed' });
  }
  await acc.save();
  await setRole(acc._id, acc.role);
  invalidateAccounts();
  res.json({ ok: true });
}));

router.post('/cloudinary-accounts/:id/test', ah(async (req, res) => {
  const acc = (await listAccounts()).find((a) => a.id === req.params.id);
  if (!acc) return fail(req, res, 404, 'notFound');
  res.json(await pingAccount(acc));
}));

router.delete('/cloudinary-accounts/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'notFound');
  const id = req.params.id;
  const inUse = await Promise.all([
    Lesson.exists({ $or: [{ cloudAccount: id }, { 'blocks.image.account': id }] }),
    Category.exists({ 'slides.account': id }),
    Promo.exists({ 'image.account': id }),
    Payment.exists({ receiptAccount: id, status: 'pending' }),
  ]);
  if (inUse.some(Boolean)) return fail(req, res, 409, 'accountInUse');
  await CloudinaryAccount.deleteOne({ _id: id });
  invalidateAccounts();
  res.json({ ok: true });
}));

// ======================= Promo / announcement boards =======================
router.get('/promos', ah(async (_req, res) => {
  res.json(await Promo.find().sort({ board: 1, slot: 1 }));
}));

const cleanMedia = (m) => (m?.url && m?.publicId
  ? { url: String(m.url), publicId: String(m.publicId), account: String(m.account || 'env'), resourceType: 'image' } : null);

router.put('/promos/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'notFound');
  const promo = await Promo.findById(req.params.id);
  if (!promo) return fail(req, res, 404, 'notFound');
  const b = req.body || {};
  const before = promo.image?.publicId ? [promo.image.toObject()] : [];
  for (const k of ['title', 'titleAm', 'description', 'descriptionAm', 'linkUrl', 'linkLabel', 'linkLabelAm']) {
    if (b[k] !== undefined) promo[k] = str(b[k], k.startsWith('description') ? 1500 : 300);
  }
  if (b.isActive !== undefined) promo.isActive = !!b.isActive;
  if ('image' in b) promo.image = cleanMedia(b.image) || undefined;
  await promo.save();
  await syncMedia(before, promo.image?.publicId ? [promo.image.toObject()] : []); // old news/promo image → deleted
  res.json({ ok: true });
}));

// ======================= Telegram bot =======================
router.get('/telegram', ah(async (_req, res) => res.json(await botStatus())));

router.put('/telegram', ah(async (req, res) => {
  const b = req.body || {};
  try {
    const origin = `${req.protocol}://${req.get('host')}`;
    const r = await configureBot({ token: str(b.token, 200), channel: b.channel, webUrl: b.webUrl, origin });
    res.json({ ok: true, ...r, status: await botStatus() });
  } catch (e) {
    if (e.code) return fail(req, res, 400, e.code);
    throw e;
  }
}));

// ---------- Referral / sponsored campaigns ----------
const cleanMilestones = (list) => (Array.isArray(list) ? list : [])
  .map((m) => ({ shares: Math.round(Number(m.shares) || 0), rewardEtb: Math.max(0, Number(m.rewardEtb) || 0), rewardText: str(m.rewardText, 200) }))
  .filter((m) => m.shares > 0 && (m.rewardEtb > 0 || m.rewardText))
  .sort((a, b) => a.shares - b.shares);

const campaignFields = (b) => ({
  kind: b.kind === 'sponsored' ? 'sponsored' : 'app',
  title: str(b.title, 120),
  titleAm: str(b.titleAm, 120),
  description: str(b.description, 1000),
  sponsorName: str(b.sponsorName, 120),
  sponsorUrl: str(b.sponsorUrl, 500),
  milestones: cleanMilestones(b.milestones),
  isActive: b.isActive !== false,
});

router.get('/campaigns', ah(async (_req, res) => {
  const list = await ReferralCampaign.find().sort({ createdAt: 1 });
  const counts = await ReferralShare.aggregate([{ $group: { _id: '$campaign', n: { $sum: 1 } } }]);
  const by = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(list.map((c) => ({ ...c.toJSON(), shareCount: by[c.id] || 0, apkUploaded: !!c.apkFileId })));
}));

router.post('/campaigns', ah(async (req, res) => {
  const data = campaignFields(req.body || {});
  if (!data.title || !data.milestones.length) return fail(req, res, 400, 'campaignFields');
  const c = await ReferralCampaign.create({ ...data, code: crypto.randomBytes(4).toString('hex').slice(0, 6) });
  res.json({ id: c.id, code: c.code });
}));

router.put('/campaigns/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'notFound');
  const data = campaignFields(req.body || {});
  if (!data.title || !data.milestones.length) return fail(req, res, 400, 'campaignFields');
  await ReferralCampaign.updateOne({ _id: req.params.id }, data);
  res.json({ ok: true });
}));

router.delete('/campaigns/:id', ah(async (req, res) => {
  // Deactivate instead of deleting when people already shared it (keeps history and pending tickets)
  if (await ReferralShare.exists({ campaign: req.params.id })) {
    await ReferralCampaign.updateOne({ _id: req.params.id }, { isActive: false });
    return res.json({ ok: true, deactivated: true });
  }
  await ReferralCampaign.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
}));

// ---------- Reward tickets (same decision as the Telegram [Approve]/[Reject] buttons) ----------
router.get('/reward-tickets', ah(async (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
  res.json(await RewardTicket.find({ status }).sort({ createdAt: -1 }).limit(200)
    .populate('user', 'name email telegramUsername creditEtb').populate('campaign', 'title sponsorName'));
}));

router.post('/reward-tickets/:id/decide', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'ticketReviewed');
  const t = await decideTicket(req.params.id, req.body?.decision, 'web');
  if (!t) return fail(req, res, 404, 'ticketReviewed');
  res.json({ ok: true });
}));

// Manual credit adjustment (e.g. sponsored reward converted to credit)
router.post('/users/:id/credit', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'notFound');
  const amount = Math.round(Number(req.body?.amountEtb) || 0);
  if (!amount) return fail(req, res, 400, 'applicationFields');
  const u = await User.findOneAndUpdate(
    { _id: req.params.id, ...(amount < 0 ? { creditEtb: { $gte: -amount } } : {}) }, { $inc: { creditEtb: amount } }, { new: true },
  );
  if (!u) return fail(req, res, 400, 'notEnoughCredit');
  await CreditTransaction.create({ user: u._id, amountEtb: amount, reason: 'admin' });
  res.json({ ok: true, creditEtb: u.creditEtb });
}));

// ======================= Assignment submissions =======================
router.get('/assignments', ah(async (_req, res) => {
  const list = await Assignment.find().sort({ createdAt: -1 }).limit(200)
    .populate('user', 'name email').populate('course', 'title titleAm').populate('payment');
  const out = [];
  for (const a of list) {
    const j = a.toJSON();
    const pay = a.payment;
    j.payment = pay ? { id: pay.id, status: pay.status, method: pay.method, referenceId: pay.referenceId, amountEtb: pay.amountEtb,
      receiptUrl: pay.receiptPublicId ? receiptUrl(pay.receiptPublicId, await accountFor(pay.receiptAccount)) : null } : null;
    out.push(j);
  }
  res.json(out);
}));

export default router;
