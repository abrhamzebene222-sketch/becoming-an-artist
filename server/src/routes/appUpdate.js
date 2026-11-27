// App update notice.
//  • Public:  GET /api/app-version?code=<installed versionCode>  → the newest active version (or null). No login needed.
//  • Admin:   /api/admin/app-versions  → publish a new version (optionally send the APK to the Telegram channel), edit, hide, delete.
import { Router } from 'express';
import mongoose from 'mongoose';
import { AppVersion } from '../models/index.js';
import { requireAdmin } from '../auth.js';
import { fail, msg } from '../i18n.js';
import { ah } from '../lib.js';
import { apkUpload } from '../upload.js';
import { botConfig, channelUrl, sendChannelDocument } from '../telegram.js';

const router = Router();
const validId = (id) => mongoose.isValidObjectId(id);
const str = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const flag = (v) => v === true || v === 'true' || v === '1' || v === 'on';
const TG_LINK = /^https?:\/\/(t\.me|telegram\.me)\//i;

// ======================= Public =======================
router.get('/app-version', ah(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const cfg = await botConfig();
  const fallback = channelUrl(cfg); // no post link on the version → open the channel itself
  const list = await AppVersion.find({ isActive: true }).sort({ versionCode: -1 }).lean();
  const latest = list.find((v) => v.telegramUrl || fallback);
  if (!latest) return res.json(null);
  // Mandatory when the newest version is mandatory, or when any version newer than the installed one is
  // (so skipping a required release is not possible by installing a later optional one).
  const installed = parseInt(req.query.code, 10);
  const mandatory = Number.isFinite(installed)
    ? list.some((v) => v.mandatory && v.versionCode > installed)
    : !!latest.mandatory;
  res.json({
    versionName: latest.versionName,
    versionCode: latest.versionCode,
    notes: latest.notes || '',
    notesAm: latest.notesAm || '',
    mandatory,
    url: latest.telegramUrl || fallback,
    publishedAt: latest.createdAt,
  });
}));

// ======================= Admin =======================
const adminView = (v, fallback) => ({
  id: v.id, versionName: v.versionName, versionCode: v.versionCode, notes: v.notes, notesAm: v.notesAm,
  mandatory: !!v.mandatory, telegramUrl: v.telegramUrl || '', isActive: !!v.isActive,
  apkName: v.apkName || '', apkSize: v.apkSize || 0, channelStatus: v.channelStatus || '', channelError: v.channelError || '',
  needsLink: !v.telegramUrl && !fallback, createdAt: v.createdAt,
});

router.get('/admin/app-versions', requireAdmin, ah(async (_req, res) => {
  const fallback = channelUrl(await botConfig());
  const list = await AppVersion.find().sort({ versionCode: -1 });
  res.json(list.map((v) => adminView(v, fallback)));
}));

// multipart/form-data: versionName, versionCode, notes, notesAm, mandatory, telegramUrl, sendToChannel, apk (file)
const withApk = (req, res, next) => apkUpload(req, res, (err) => {
  if (err) return fail(req, res, 400, err.code === 'LIMIT_FILE_SIZE' ? 'apkTooBig' : 'apkInvalid');
  next();
});

router.post('/admin/app-versions', requireAdmin, withApk, ah(async (req, res) => {
  const b = req.body || {};
  const versionName = str(b.versionName, 40);
  const versionCode = Math.round(Number(b.versionCode));
  if (!versionName || !Number.isFinite(versionCode) || versionCode < 1) return fail(req, res, 400, 'appVersionFields');
  if (await AppVersion.exists({ versionCode })) return fail(req, res, 409, 'appVersionExists');

  let telegramUrl = str(b.telegramUrl, 500);
  if (telegramUrl && !TG_LINK.test(telegramUrl)) return fail(req, res, 400, 'appVersionLinkBad');
  const file = req.file;
  if (file && !/\.apk$/i.test(file.originalname || '')) return fail(req, res, 400, 'apkInvalid');
  const send = !!file && flag(b.sendToChannel);
  if (!telegramUrl && !send && !channelUrl(await botConfig())) return fail(req, res, 400, 'appVersionLink');

  const data = {
    versionName, versionCode, notes: str(b.notes), notesAm: str(b.notesAm),
    mandatory: flag(b.mandatory), telegramUrl, isActive: true,
  };

  if (send) {
    const caption = [
      `🎨 Becoming an Artist ${versionName} (${versionCode})${data.mandatory ? ' · ⚠️ Required update / የግድ ማዘመን' : ''}`,
      data.notes, data.notesAm,
    ].filter(Boolean).join('\n\n');
    const r = await sendChannelDocument(file.buffer, file.originalname, caption);
    Object.assign(data, { apkName: file.originalname, apkSize: file.size, channelStatus: r.status, channelError: r.error || '' });
    if (r.ok) {
      data.channelMessageId = r.messageId;
      if (!telegramUrl) data.telegramUrl = r.url || '';
    } else if (!telegramUrl) {
      // Nothing was posted and there is no link to fall back on: save nothing, tell the admin why.
      const key = r.status === 'too_big' ? 'apkTooBig' : 'appSendFailed';
      return res.status(r.status === 'too_big' ? 400 : 502).json({ error: `${msg(req, key)}${r.error ? ` (${r.error})` : ''}`, code: key });
    }
  }

  const v = await AppVersion.create(data);
  res.json({ ok: true, id: v.id, channelStatus: v.channelStatus, needsLink: !v.telegramUrl && !channelUrl(await botConfig()) });
}));

router.put('/admin/app-versions/:id', requireAdmin, ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'appVersionNotFound');
  const v = await AppVersion.findById(req.params.id);
  if (!v) return fail(req, res, 404, 'appVersionNotFound');
  const b = req.body || {};
  if (b.versionName !== undefined) {
    const name = str(b.versionName, 40);
    if (!name) return fail(req, res, 400, 'appVersionFields');
    v.versionName = name;
  }
  if (b.notes !== undefined) v.notes = str(b.notes);
  if (b.notesAm !== undefined) v.notesAm = str(b.notesAm);
  if (b.mandatory !== undefined) v.mandatory = flag(b.mandatory);
  if (b.isActive !== undefined) v.isActive = flag(b.isActive);
  if (b.telegramUrl !== undefined) {
    const url = str(b.telegramUrl, 500);
    if (url && !TG_LINK.test(url)) return fail(req, res, 400, 'appVersionLinkBad');
    v.telegramUrl = url;
  }
  await v.save();
  res.json({ ok: true });
}));

router.delete('/admin/app-versions/:id', requireAdmin, ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'appVersionNotFound');
  await AppVersion.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
}));

export default router;
