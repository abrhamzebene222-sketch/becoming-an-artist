// Admin: export one lesson (text + images) as PDF or HTML and send it to the admin through the Telegram bot.
// File name = position code + slug, e.g. M1-G2-S1-C1-L2_line-quality.pdf  (see lessonExport.js).
import { Router } from 'express';
import mongoose from 'mongoose';
import { Lesson } from '../models/index.js';
import { requireAdmin } from '../auth.js';
import { fail, msg } from '../i18n.js';
import { ah } from '../lib.js';
import { botConfig, sendAdminDocument } from '../telegram.js';
import { lessonCode, loadImages, buildHtml, buildPdf, asciiSlug, MAX_EXPORT_BYTES } from '../lessonExport.js';

const router = Router();
router.use(requireAdmin);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

router.post('/lessons/:id/export', ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(req, res, 404, 'lessonNotFound');
  const format = req.body?.format === 'html' ? 'html' : 'pdf';
  const lesson = await Lesson.findById(req.params.id).lean();
  if (!lesson) return fail(req, res, 404, 'lessonNotFound');
  if (lesson.kind !== 'blocks') return fail(req, res, 400, 'exportBlocksOnly');
  const cfg = await botConfig();
  if (!cfg.token || !cfg.adminChatId) return fail(req, res, 400, 'exportBotMissing');

  const blocks = lesson.blocks || [];
  const { code, course, chain } = await lessonCode(lesson);
  const images = await loadImages(blocks);
  const ctx = { lesson, course, chain, code, blocks, images };

  let buffer;
  try {
    buffer = format === 'pdf' ? await buildPdf(ctx) : Buffer.from(buildHtml(ctx), 'utf8');
  } catch (e) {
    if (e.code === 'exportFont') return fail(req, res, 400, 'exportFont');
    throw e;
  }
  if (buffer.length > MAX_EXPORT_BYTES) return fail(req, res, 413, 'exportTooBig');

  const filename = `${code ? `${code}_` : ''}${asciiSlug(lesson.title)}.${format}`;
  const caption = `<b>${esc(code || lesson.title)}</b>\n${esc(lesson.title)}${lesson.titleAm ? `\n${esc(lesson.titleAm)}` : ''}`;
  const sent = await sendAdminDocument(buffer, filename, caption, format === 'pdf' ? 'application/pdf' : 'text/html');
  if (!sent.ok) {
    const detail = sent.error ? ` (${sent.error})` : '';
    return res.status(502).json({ error: msg(req, sent.status === 'not_configured' ? 'exportBotMissing' : 'exportFailed') + detail, code: 'exportFailed' });
  }
  const withPictures = blocks.filter((b) => b.image?.url).length;
  res.json({ ok: true, filename, code, format, sizeKb: Math.round(buffer.length / 1024), missingImages: Math.max(0, withPictures - images.size) });
}));

export default router;
