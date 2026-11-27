// Pro assignment submission: Telegram @username (required), email, notes, review type, PAYMENT (method + reference ID,
// optional receipt screenshot) + several artwork images → one professional PDF report that contains the form AND the
// payment details → forwarded to the admin's Telegram chat (and kept on Cloudinary for the admin page).
// Submission is blocked without payment details. The fee is computed on the server from Admin › Settings.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { Assignment, Course, Payment } from '../models/index.js';
import { requireAuth } from '../auth.js';
import { notifyAdmins } from '../notify.js';
import { fail, msg } from '../i18n.js';
import { ah, assignmentQuote, assignmentFees } from '../lib.js';
import { assignmentUpload } from '../upload.js';
import { sendAdminDocument } from '../telegram.js';
import { uploadRaw, uploadReceipt, deleteReceipt, isConfigured } from '../cloudinary.js';

const router = Router();
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 15,
  handler: (req, res) => res.status(429).json({ error: msg(req, 'tooMany') }),
});
const USERNAME = /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEAL = '#1FA69B';
const INK = '#111B1A';

/** Build the PDF in memory. Images are normalised to JPEG (PDFKit reads JPEG/PNG; WEBP is converted). */
const TYPE_LABEL = { one_on_one: '1-on-1 live review', video: 'Recorded video review', pdf: 'PDF written review' };

async function buildPdf({ student, telegramUsername, email, notes, course, files, quote, method, referenceId, receiptFile }) {
  const images = await Promise.all(files.map(async (f) => ({
    name: f.originalname,
    buffer: await sharp(f.buffer).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer(),
  })));

  const receiptImg = receiptFile
    ? await sharp(receiptFile.buffer).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer()
    : null;

  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Assignment — ${student}`, Author: 'Becoming an Artist' } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  const W = doc.page.width;
  // Header band
  doc.rect(0, 0, W, 96).fill(INK);
  doc.fillColor(TEAL).fontSize(22).text('Becoming an Artist', 48, 30);
  doc.fillColor('#BFF5F0').fontSize(11).text('Assignment submission report', 48, 60);
  doc.fillColor('#9DB3AF').fontSize(9).text(new Date().toUTCString(), W - 248, 62, { width: 200, align: 'right' });

  // Details table
  doc.moveDown(4);
  let y = 120;
  const row = (label, value) => {
    doc.fillColor('#555').fontSize(9).text(label.toUpperCase(), 48, y, { width: 130 });
    doc.fillColor('#111').fontSize(11).text(value || '—', 180, y - 1, { width: W - 228 });
    y = Math.max(doc.y, y + 14) + 8;
  };
  row('Student', student);
  row('Telegram', telegramUsername);
  row('Email', email);
  if (course) row('Course', course);
  row('Artworks', String(images.length));
  row('Review type', TYPE_LABEL[quote.reviewType]);
  row('Fee', `${quote.feeEtb} ETB  (${quote.ratio}x of ${quote.baseRateEtb} ETB 1-on-1 hourly rate)`);
  row('Payment method', method === 'TELEBIRR' ? 'Telebirr' : 'CBE (Commercial Bank of Ethiopia)');
  row('Payment reference', referenceId);
  row('Payment status', receiptImg ? 'Reference + receipt attached - verify before reviewing' : 'Reference only (no receipt image) - verify before reviewing');
  doc.moveTo(48, y).lineTo(W - 48, y).strokeColor(TEAL).lineWidth(1.5).stroke();
  y += 14;
  doc.fillColor('#555').fontSize(9).text('NOTES', 48, y);
  // Ethiopic glyphs are not in the built-in PDF fonts; notes keep Latin text and mark other characters
  const safe = (s) => String(s || '').replace(/[^\x09\x0A\x0D\x20-\x7E -ɏ]/g, '·');
  doc.fillColor('#111').fontSize(11).text(safe(notes) || '—', 48, y + 14, { width: W - 96, lineGap: 3 });
  if (/[ሀ-፿]/.test(notes || '')) {
    doc.moveDown(0.5).fillColor('#888').fontSize(8).text('(Amharic text in the notes is included in the Telegram caption.)');
  }

  // One artwork per page, fitted and centred, with a caption
  images.forEach((img, i) => {
    doc.addPage();
    doc.rect(0, 0, W, 40).fill(INK);
    doc.fillColor('#BFF5F0').fontSize(10).text(`Artwork ${i + 1} of ${images.length}`, 48, 15);
    doc.fillColor('#9DB3AF').text(safe(img.name), W - 300, 15, { width: 252, align: 'right' });
    doc.image(img.buffer, 48, 64, { fit: [W - 96, doc.page.height - 140], align: 'center', valign: 'center' });
    doc.page.margins.bottom = 0; // footer sits inside the bottom margin without forcing a new page
    doc.fillColor('#888').fontSize(8).text(`${student} · ${telegramUsername}`, 48, doc.page.height - 36, { width: W - 96, align: 'center', lineBreak: false });
  });
  if (receiptImg) {
    doc.addPage();
    doc.rect(0, 0, W, 40).fill(INK);
    doc.fillColor('#BFF5F0').fontSize(10).text('Payment receipt', 48, 15);
    doc.fillColor('#9DB3AF').text(`${method} - ${safe(referenceId)} - ${quote.feeEtb} ETB`, W - 348, 15, { width: 300, align: 'right' });
    doc.image(receiptImg, 48, 64, { fit: [W - 96, doc.page.height - 140], align: 'center', valign: 'center' });
  }
  doc.end();
  return done;
}

// What each review type costs right now (the form shows this before the student pays).
router.get('/assignments/quote', requireAuth, ah(async (_req, res) => res.json(await assignmentFees())));

router.post('/assignments', limiter, requireAuth, assignmentUpload, ah(async (req, res) => {
  const b = req.body || {};
  const telegramUsername = String(b.telegramUsername || '').trim();
  const email = String(b.email || '').trim();
  const notes = String(b.notes || '').trim().slice(0, 4000);
  const files = req.files?.images || [];
  const receiptFile = req.files?.receipt?.[0] || null;
  const method = String(b.method || '');
  const referenceId = String(b.referenceId || '').trim().slice(0, 64);

  // 1) Telegram @username is mandatory (the instructor finds the student there to give feedback)
  if (!USERNAME.test(telegramUsername)) return fail(req, res, 400, 'telegramUsername');
  if (!EMAIL.test(email) || !files.length) return fail(req, res, 400, 'assignmentFields');
  // 2) Payment is mandatory: method + reference ID (receipt screenshot optional, attached to the PDF when given)
  if (!['CBE', 'TELEBIRR'].includes(method) || referenceId.length < 4) return fail(req, res, 400, 'assignmentPayment');
  // 3) The fee comes from Admin › Settings (never from the browser)
  const { error, quote } = await assignmentQuote(b.reviewType);
  if (error) return fail(req, res, error === 'assignmentNoPrice' ? 503 : 400, error);
  if (await Payment.exists({ method, referenceId })) return fail(req, res, 409, 'duplicateRef');
  if (receiptFile && !(await isConfigured())) return fail(req, res, 503, 'cloudinaryKeys');

  const tgName = `@${telegramUsername.replace(/^@/, '')}`;
  const course = mongoose.isValidObjectId(b.courseId) ? await Course.findById(b.courseId, 'title').lean() : null;

  // Payment record (pending): the admin verifies it in Admin › Payments, same as every other payment.
  const receipt = receiptFile ? await uploadReceipt(receiptFile.buffer) : null;
  let payment;
  try {
    payment = await Payment.create({
      user: req.user.id, purpose: 'assignment', method, amountEtb: quote.feeEtb, referenceId,
      receiptPublicId: receipt?.publicId, receiptAccount: receipt?.account,
      quote: { reviewType: quote.reviewType, ratio: quote.ratio, baseRateEtb: quote.baseRateEtb },
    });
  } catch (e) {
    if (receipt) await deleteReceipt(receipt.publicId, receipt.account);
    if (e.code === 11000) return fail(req, res, 409, 'duplicateRef');
    throw e;
  }

  try {
    const pdf = await buildPdf({
      student: req.user.name, telegramUsername: tgName, email, notes, course: course?.title, files,
      quote, method, referenceId, receiptFile,
    });
    const filename = `assignment-${req.user.name.replace(/[^A-Za-z0-9]+/g, '-').slice(0, 40)}-${Date.now()}.pdf`;

    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const caption = `📝 <b>New assignment</b>\n👤 ${esc(req.user.name)} · ${esc(tgName)}\n✉️ ${esc(email)}`
      + `${course ? `\n📚 ${esc(course.title)}` : ''}\n🖼 ${files.length} artwork(s)`
      + `\n🎯 ${esc(TYPE_LABEL[quote.reviewType])}\n💳 ${esc(method)} · ${esc(referenceId)} · ${quote.feeEtb} ETB${receipt ? ' · receipt attached' : ''}`
      + `${notes ? `\n\n${esc(notes.slice(0, 300))}` : ''}`;

    const [sent, stored] = await Promise.all([
      sendAdminDocument(pdf, filename, caption).catch((e) => ({ ok: false, status: 'failed', error: e.message })),
      uploadRaw(pdf, { folder: 'assignments', filename }).catch(() => null),
    ]);

    const a = await Assignment.create({
      user: req.user.id, course: course?._id, telegramUsername: tgName, email, notes, imageCount: files.length,
      reviewType: quote.reviewType, baseRateEtb: quote.baseRateEtb, ratioUsed: quote.ratio, feeEtb: quote.feeEtb,
      paymentMethod: method, paymentReference: referenceId, payment: payment._id,
      pdfUrl: stored?.url, pdfPublicId: stored?.publicId, pdfAccount: stored?.account,
      telegramStatus: sent.status, telegramError: sent.error,
    });
    await notifyAdmins({
      type: 'assignment_new', params: { name: req.user.name, count: files.length },
      title: 'New assignment submitted', body: `${req.user.name} · ${files.length} artwork(s) · ${quote.feeEtb} ETB (${method})`, link: '/admin/assignments',
    });
    res.json({ id: a.id, telegramStatus: sent.status, feeEtb: quote.feeEtb });
  } catch (e) {
    // Nothing was delivered: remove the payment so the student can retry with the same reference ID
    await Payment.deleteOne({ _id: payment._id }).catch(() => {});
    if (receipt) await deleteReceipt(receipt.publicId, receipt.account);
    throw e;
  }
}));

router.get('/assignments', requireAuth, ah(async (req, res) => {
  res.json(await Assignment.find({ user: req.user.id }, '-pdfPublicId -pdfAccount -telegramError').sort({ createdAt: -1 }).limit(50)
    .populate('course', 'title titleAm').populate('payment', 'status'));
}));

export default router;
