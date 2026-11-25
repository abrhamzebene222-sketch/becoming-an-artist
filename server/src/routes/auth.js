import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/index.js';
import { signUser, requireAuth } from '../auth.js';
import { config } from '../config.js';
import { cleanDeviceId, hashDevice, hashOtp, newOtp, safeEqual, isLockedRole } from '../device.js';
import { sendMail } from '../mailer.js';
import { fail, msg } from '../i18n.js';
import { ah } from '../lib.js';
import { recordWebReferral } from '../telegram.js';

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: msg(req, 'tooMany') }),
});

// Stricter limit for anything that sends an email
const mailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: msg(req, 'tooMany'), code: 'tooMany' }),
});
const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_SECONDS = 60;
const noDevice = { $or: [{ deviceHash: '' }, { deviceHash: null }, { deviceHash: { $exists: false } }] };

const publicUser = (u) => ({
  id: String(u._id), name: u.name, email: u.email, phone: u.phone, role: String(u.role || 'student').toLowerCase(),
  telegramUsername: u.telegramUsername || '', telegramLinked: !!u.telegramId, creditEtb: u.creditEtb || 0,
});

router.post('/register', limiter, ah(async (req, res) => {
  const { name, email, phone, password, ref, refCampaign } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password || password.length < 8) return fail(req, res, 400, 'registerFields');
  if (await User.exists({ email: email.trim().toLowerCase() })) return fail(req, res, 409, 'emailTaken');
  const devId = cleanDeviceId(req.body?.deviceId);
  if (config.deviceLock && !devId) return fail(req, res, 400, 'deviceRequired');
  const user = await User.create({
    name: name.trim(), email: email.trim(), phone: phone?.trim() || undefined,
    passwordHash: await bcrypt.hash(password, 12), role: 'student', // new sign-ups are always students
    ...(config.deviceLock ? { deviceHash: hashDevice(devId), deviceBoundAt: new Date() } : {}),
  });
  // Signed up through someone's shared web link (?ref=CODE&c=CAMPAIGN) → counts toward their milestone
  if (ref && refCampaign) await recordWebReferral(user, ref, refCampaign).catch((e) => console.warn('referral', e.message));
  res.json({ token: signUser(user), user: publicUser(user) });
}));

router.post('/login', limiter, ah(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return fail(req, res, 401, 'badLogin');

  // Device lock: a student account works on one device only (admins are exempt)
  if (config.deviceLock && isLockedRole(user)) {
    const devId = cleanDeviceId(req.body?.deviceId);
    if (!devId) return fail(req, res, 400, 'deviceRequired');
    const h = hashDevice(devId);
    let bound = user.deviceHash;
    if (!bound) {
      // first sign-in on any device → link it (atomic, so two phones signing in at once can't both win)
      const r = await User.updateOne({ _id: user._id, ...noDevice }, { $set: { deviceHash: h, deviceBoundAt: new Date() } });
      bound = r.modifiedCount ? h : (await User.findById(user._id, 'deviceHash').lean())?.deviceHash;
    }
    if (!bound || !safeEqual(h, bound)) return fail(req, res, 403, 'deviceMismatch');
  }
  res.json({ token: signUser(user), user: publicUser(user) });
}));

// ---------- Move the account to a new device (password + one-time code sent to the account's email) ----------
async function checkPasswordAndDevice(req, res) {
  const { email, password, deviceId } = req.body || {};
  const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) { fail(req, res, 401, 'badLogin'); return null; }
  if (!isLockedRole(user)) { fail(req, res, 400, 'adminNoDevice'); return null; }
  const devId = cleanDeviceId(deviceId);
  if (!devId) { fail(req, res, 400, 'deviceRequired'); return null; }
  return { user, h: hashDevice(devId) };
}

function changeBlockedUntil(user) {
  if (!user.deviceChangedAt) return null;
  const next = new Date(user.deviceChangedAt.getTime() + config.deviceChangeDays * 864e5);
  return next > new Date() ? next : null;
}

const maskEmail = (e) => e.replace(/^(.).*(@.*)$/, '$1***$2');

router.post('/device/request-change', mailLimiter, ah(async (req, res) => {
  const ok = await checkPasswordAndDevice(req, res);
  if (!ok) return;
  const { user, h } = ok;
  if (!user.deviceHash || safeEqual(h, user.deviceHash)) return fail(req, res, 400, 'deviceSame');
  const blocked = changeBlockedUntil(user);
  if (blocked) return res.status(429).json({ error: msg(req, 'deviceChangeLimit'), code: 'deviceChangeLimit', nextAllowedAt: blocked });
  if (user.deviceOtpSentAt && Date.now() - user.deviceOtpSentAt.getTime() < OTP_RESEND_SECONDS * 1000) return fail(req, res, 429, 'deviceWait');

  const code = newOtp();
  await User.updateOne({ _id: user._id }, { $set: {
    pendingDeviceHash: h, deviceOtpHash: hashOtp(String(user._id), code),
    deviceOtpExpires: new Date(Date.now() + OTP_MINUTES * 60 * 1000), deviceOtpAttempts: 0, deviceOtpSentAt: new Date(),
  } });
  try {
    await sendMail({
      to: user.email,
      subject: `${code} — Becoming an Artist`,
      text: `የመሣሪያ መቀየሪያ ኮድዎ፦ ${code}\nኮዱ ለ${OTP_MINUTES} ደቂቃ ብቻ ያገለግላል። እርስዎ ካልጠየቁ ይህን ኢሜይል ችላ ይበሉ እና የይለፍ ቃልዎን ይቀይሩ።\n\nYour device-change code: ${code}\nIt is valid for ${OTP_MINUTES} minutes. If you did not ask for it, ignore this email and change your password.`,
      html: `<p>የመሣሪያ መቀየሪያ ኮድዎ / Your device-change code:</p><p style="font-size:28px;letter-spacing:6px"><b>${code}</b></p><p>ኮዱ ለ${OTP_MINUTES} ደቂቃ ብቻ ያገለግላል። / Valid for ${OTP_MINUTES} minutes.</p><p>እርስዎ ካልጠየቁ ይህን ኢሜይል ችላ ይበሉ። / If you did not ask for this, ignore this email.</p>`,
    });
  } catch (e) {
    console.error('device OTP email failed:', e.message);
    await User.updateOne({ _id: user._id }, { $set: { deviceOtpHash: '', pendingDeviceHash: '' }, $unset: { deviceOtpExpires: 1, deviceOtpSentAt: 1 } });
    return fail(req, res, e.code === 'mailNotConfigured' ? 503 : 502, e.code === 'mailNotConfigured' ? 'mailNotConfigured' : 'mailFailed');
  }
  res.json({ ok: true, expiresInMinutes: OTP_MINUTES, emailHint: maskEmail(user.email) });
}));

router.post('/device/verify-change', limiter, ah(async (req, res) => {
  const ok = await checkPasswordAndDevice(req, res);
  if (!ok) return;
  const { user, h } = ok;
  const blocked = changeBlockedUntil(user);
  if (blocked) return res.status(429).json({ error: msg(req, 'deviceChangeLimit'), code: 'deviceChangeLimit', nextAllowedAt: blocked });
  if (!user.deviceOtpHash || !user.pendingDeviceHash || !safeEqual(h, user.pendingDeviceHash)) return fail(req, res, 400, 'deviceCodeExpired');
  if (!user.deviceOtpExpires || user.deviceOtpExpires < new Date()) return fail(req, res, 400, 'deviceCodeExpired');
  if ((user.deviceOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) return fail(req, res, 429, 'deviceCodeTooMany');

  const code = String(req.body?.code || '').replace(/\D/g, '');
  if (code.length !== 6 || !safeEqual(hashOtp(String(user._id), code), user.deviceOtpHash)) {
    const left = OTP_MAX_ATTEMPTS - ((user.deviceOtpAttempts || 0) + 1);
    await User.updateOne({ _id: user._id }, left <= 0
      ? { $set: { deviceOtpHash: '', pendingDeviceHash: '', deviceOtpAttempts: 0 } }
      : { $inc: { deviceOtpAttempts: 1 } });
    return fail(req, res, left <= 0 ? 429 : 400, left <= 0 ? 'deviceCodeTooMany' : 'deviceCodeBad');
  }

  // Success: swap the device, revoke every old token (tokenVersion + 1). The filter on the code hash makes the code single-use.
  const updated = await User.findOneAndUpdate(
    { _id: user._id, deviceOtpHash: user.deviceOtpHash },
    {
      $set: { deviceHash: h, deviceBoundAt: new Date(), deviceChangedAt: new Date(), pendingDeviceHash: '', deviceOtpHash: '', deviceOtpAttempts: 0 },
      $unset: { deviceOtpExpires: 1 },
      $inc: { tokenVersion: 1 },
    },
    { new: true },
  );
  if (!updated) return fail(req, res, 400, 'deviceCodeExpired');
  res.json({ token: signUser(updated), user: publicUser(updated) });
}));

// Always returns the CURRENT role from the database
router.get('/me', requireAuth, ah(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return fail(req, res, 401, 'accountMissing');
  res.json(publicUser(user));
}));

export default router;
