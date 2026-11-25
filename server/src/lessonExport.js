// Lesson export (Admin › lesson › "Send to Telegram"): turns one text lesson into a PDF or a self-contained HTML file.
// Used by routes/adminExport.js. Exports: lessonCode, loadImages, buildHtml, buildPdf, asciiSlug, MAX_EXPORT_BYTES.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { Course, Lesson } from './models/index.js';
import { getCategories, ancestorChain } from './tree.js';
import { youtubeId } from './lib.js';

const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts');
const FONT_REGULAR = path.join(FONT_DIR, 'NotoSansEthiopic-Regular.ttf');
const FONT_BOLD = path.join(FONT_DIR, 'NotoSansEthiopic-Bold.ttf');

/** Telegram bots can send files up to 50 MB; stay a little under. */
export const MAX_EXPORT_BYTES = 49 * 1024 * 1024;

const LEVEL_LETTERS = ['M', 'G', 'S', 'T', 'U', 'V', 'W'];

/** "Looking & Critique: Intro!" → "looking-critique-intro" (safe for file names). */
export function asciiSlug(title) {
  const s = String(title || '').normalize('NFKD').replace(/[^\x00-\x7F]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
  return s || 'lesson';
}

const byOrder = (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
  || new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  || String(a._id).localeCompare(String(b._id));

/**
 * Position code of a lesson inside the curriculum, e.g. M1-G2-S1-C1-L2
 * (M = major group, G/S/T… = sub-groups going down, C = course inside its group, L = lesson inside its course).
 * Returns { code, course, chain } where chain = categories from the major group down to the course's group.
 */
export async function lessonCode(lesson) {
  const course = await Course.findById(lesson.course).lean().catch(() => null);
  if (!course) return { code: '', course: null, chain: [] };
  const chain = (await ancestorChain(course.category)).filter(Boolean).reverse();
  const { children } = await getCategories();

  const parts = chain.map((cat, i) => {
    const parentKey = cat.parent ? String(cat.parent) : null;
    const siblings = children.get(parentKey) || [];
    const pos = siblings.findIndex((c) => String(c._id) === String(cat._id)) + 1;
    return `${LEVEL_LETTERS[i] || `D${i + 1}`}${pos || 1}`;
  });

  const courses = (await Course.find({ category: course.category }).lean()).sort(byOrder);
  const ci = courses.findIndex((c) => String(c._id) === String(course._id)) + 1;
  const lessons = (await Lesson.find({ course: course._id }, '_id sortOrder createdAt').lean()).sort(byOrder);
  const li = lessons.findIndex((l) => String(l._id) === String(lesson._id)) + 1;

  return { code: [...parts, `C${ci || 1}`, `L${li || 1}`].join('-'), course, chain };
}

/**
 * Downloads the pictures of the blocks (image blocks and steps with a picture).
 * Returns Map<blockIndex, { buf, width, height }> — JPEG, max 1400 px wide. A picture that cannot be loaded is skipped.
 */
export async function loadImages(blocks) {
  const out = new Map();
  const jobs = blocks.map((b, i) => ({ b, i })).filter(({ b }) => b.image?.url);
  const one = async ({ b, i }) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20_000);
    try {
      const res = await fetch(b.image.url, { signal: ctl.signal });
      if (!res.ok) return;
      const src = Buffer.from(await res.arrayBuffer());
      const { data, info } = await sharp(src).rotate().resize({ width: 1400, withoutEnlargement: true })
        .flatten({ background: '#ffffff' }).jpeg({ quality: 82 }).toBuffer({ resolveWithObject: true });
      out.set(i, { buf: data, width: info.width, height: info.height });
    } catch { /* picture skipped; adminExport reports how many were missing */ } finally { clearTimeout(timer); }
  };
  for (let k = 0; k < jobs.length; k += 4) await Promise.all(jobs.slice(k, k + 4).map(one)); // 4 at a time
  return out;
}

// ---------------------------------------------------------------- shared helpers
const texts = (b) => [b.text, b.textAm].map((s) => String(s || '').trim()).filter(Boolean);
const heading = (b) => texts(b).join('  ·  ');
const crumbs = (ctx) => [...ctx.chain.map((c) => [c.title, c.titleAm].filter(Boolean).join(' / ')),
  ctx.course ? [ctx.course.title, ctx.course.titleAm].filter(Boolean).join(' / ') : ''].filter(Boolean);

// ---------------------------------------------------------------- HTML
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const para = (s) => `<p>${esc(s).replace(/\n/g, '<br>')}</p>`;

/** One self-contained HTML file: pictures are embedded, so it opens anywhere, offline. */
export function buildHtml(ctx) {
  const { lesson, blocks, images, code } = ctx;
  const img = (i, b) => {
    const m = images.get(i);
    if (!m) return b.image?.url ? '<p class="muted">[image could not be loaded]</p>' : '';
    return `<figure><img src="data:image/jpeg;base64,${m.buf.toString('base64')}" alt="${esc(b.caption || '')}">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`;
  };
  let step = 0;
  const body = blocks.map((b, i) => {
    if (b.type === 'heading') { step = 0; return `<h2>${esc(heading(b))}</h2>`; }
    if (b.type === 'text') return texts(b).map(para).join('');
    if (b.type === 'callout') {
      const warn = b.variant === 'warning';
      return `<aside class="${warn ? 'warn' : 'tip'}"><strong>${warn ? 'WARNING · ማስጠንቀቂያ' : 'TIP · ጠቃሚ ምክር'}</strong>${texts(b).map(para).join('')}</aside>`;
    }
    if (b.type === 'step') { step += 1; return `<section class="step"><span class="n">${step}</span><div>${texts(b).map(para).join('')}${img(i, b)}</div></section>`; }
    if (b.type === 'image') return img(i, b);
    if (b.type === 'youtube') {
      const id = youtubeId(b.youtubeUrl);
      const url = id ? `https://www.youtube.com/watch?v=${id}` : b.youtubeUrl;
      return url ? `<p class="video">▶ Video: <a href="${esc(url)}">${esc(url)}</a></p>` : '';
    }
    return '';
  }).join('\n');

  const trail = crumbs(ctx).map(esc).join(' › ');
  return `<!doctype html>
<html lang="am"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(code ? `${code} · ` : '')}${esc(lesson.title)}</title>
<style>
body{font-family:'Noto Sans Ethiopic','Nyala','Abyssinica SIL',system-ui,-apple-system,'Segoe UI',Arial,sans-serif;max-width:760px;margin:0 auto;padding:24px 18px 60px;line-height:1.65;color:#1b2a28;background:#fff}
.code{font-size:12px;letter-spacing:.06em;color:#0f766e;font-weight:700}
h1{font-size:26px;margin:.2em 0 .1em} .am{font-size:20px;color:#334;margin:0 0 .4em} .trail{font-size:13px;color:#667;margin-bottom:1.5em}
h2{font-size:20px;margin:1.6em 0 .4em;border-bottom:1px solid #d9e4e2;padding-bottom:.2em}
p{margin:.6em 0} figure{margin:1em 0;text-align:center} img{max-width:100%;height:auto;border-radius:8px;border:1px solid #d9e4e2}
figcaption{font-size:12px;color:#667;margin-top:4px}
aside{border-left:4px solid;border-radius:6px;padding:10px 14px;margin:1em 0} aside strong{display:block;font-size:12px;letter-spacing:.05em;margin-bottom:2px}
.tip{background:#e6f4f1;border-color:#0f766e;color:#0b4f48} .warn{background:#fdf5da;border-color:#b58900;color:#6b5200}
.step{display:flex;gap:12px;margin:1em 0} .step .n{flex:none;width:30px;height:30px;border-radius:50%;background:#0f766e;color:#fff;display:grid;place-items:center;font-weight:700;font-size:14px;margin-top:2px}
.step>div{flex:1;min-width:0} .muted{color:#889;font-size:13px} .video a{word-break:break-all}
@media print{body{padding:0} h2,figure,aside,.step{break-inside:avoid}}
</style></head><body>
${code ? `<div class="code">${esc(code)}</div>` : ''}
<h1>${esc(lesson.title)}</h1>
${lesson.titleAm ? `<p class="am">${esc(lesson.titleAm)}</p>` : ''}
${trail ? `<div class="trail">${trail}</div>` : ''}
${body}
</body></html>`;
}

// ---------------------------------------------------------------- PDF
const ETHIOPIC = /[\u1200-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/;
// Built-in PDF fonts only know Latin-1 + a few symbols: swap common look-alikes, drop the rest
const latinSafe = (s) => s.replace(/[‘’‚′]/g, "'").replace(/[“”„″]/g, '"').replace(/[–—−]/g, '-').replace(/…/g, '...')
  .replace(/[›»]/g, '>').replace(/[‹«]/g, '<').replace(/[→⇒]/g, '->').replace(/[\u00A0\u2009\u200A\u202F]/g, ' ')
  .replace(/[^\x09\x0A\x20-\x7E\u00A1-\u00FF•€™]/g, '?');

/** Splits text into runs of Ethiopic / non-Ethiopic characters (neutral characters stay with the run they follow). */
function runsOf(text) {
  const runs = [];
  let cur = null;
  for (const ch of text) {
    const eth = ETHIOPIC.test(ch);
    const neutral = /[\s\d.,;:!?'"()\-\/+=%&#*@_[\]{}<>|~`^$\\]/.test(ch);
    const isEth = neutral && cur ? cur.eth : eth;
    if (!cur || cur.eth !== isEth) { cur = { eth: isEth, s: '' }; runs.push(cur); }
    cur.s += ch;
  }
  return runs;
}

function pdfFonts() {
  if (!fs.existsSync(FONT_REGULAR)) throw Object.assign(new Error('exportFont'), { code: 'exportFont' });
  return { regular: FONT_REGULAR, bold: fs.existsSync(FONT_BOLD) ? FONT_BOLD : FONT_REGULAR };
}

/** PDF with Amharic support. Needs server/src/fonts/NotoSansEthiopic-Regular.ttf (see fonts/README.txt). */
export function buildPdf(ctx) {
  const fonts = pdfFonts(); // throws { code: 'exportFont' } when the font file is missing
  const { lesson, blocks, images, code } = ctx;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true, info: { Title: lesson.title, Author: 'Becoming an Artist' } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      doc.registerFont('Eth', fonts.regular);
      doc.registerFont('EthBold', fonts.bold);

      const left = doc.page.margins.left;
      const width = doc.page.width - left - doc.page.margins.right;
      const bottom = () => doc.page.height - doc.page.margins.bottom;

      /** Writes text that may mix Latin and Amharic, wrapping across lines. */
      const write = (text, { size = 11, bold = false, color = '#1b2a28', indent = 0, gap = 4, align = 'left' } = {}) => {
        const lines = String(text).split('\n');
        lines.forEach((line, li) => {
          const runs = runsOf(line).filter((r) => r.s.length);
          if (!runs.length) { doc.moveDown(0.4); return; }
          doc.fillColor(color).fontSize(size);
          runs.forEach((r, ri) => {
            const last = ri === runs.length - 1;
            doc.font(r.eth ? (bold ? 'EthBold' : 'Eth') : (bold ? 'Helvetica-Bold' : 'Helvetica'));
            const opts = { width: width - indent, align, lineGap: 3, continued: !last };
            if (ri === 0) doc.text(r.eth ? r.s : latinSafe(r.s), left + indent, doc.y, opts);
            else doc.text(r.eth ? r.s : latinSafe(r.s), opts);
          });
          if (li === lines.length - 1) doc.moveDown(gap / 11);
        });
      };

      const ensure = (h) => { if (doc.y + h > bottom()) doc.addPage(); };

      const picture = (i, b, indent = 0) => {
        const m = images.get(i);
        if (!m) return;
        const maxW = width - indent;
        const scale = Math.min(maxW / m.width, 420 / m.height, 1);
        const w = m.width * scale; const h = m.height * scale;
        ensure(h + (b.caption ? 20 : 4));
        const x = left + indent + (maxW - w) / 2;
        doc.image(m.buf, x, doc.y, { width: w, height: h });
        doc.y += h + 6;
        if (b.caption) write(b.caption, { size: 9, color: '#667', indent, align: 'center' });
      };

      // ---- header
      if (code) write(code, { size: 10, bold: true, color: '#0f766e', gap: 2 });
      write(lesson.title, { size: 22, bold: true, gap: 4 });
      if (lesson.titleAm) write(lesson.titleAm, { size: 17, color: '#334455', gap: 4 });
      const trail = crumbs(ctx).join('  >  ');
      if (trail) write(trail, { size: 9, color: '#667788', gap: 6 });
      doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor('#d9e4e2').lineWidth(1).stroke();
      doc.moveDown(0.8);

      // ---- blocks
      let step = 0;
      blocks.forEach((b, i) => {
        if (b.type === 'heading') {
          step = 0;
          ensure(60);
          doc.moveDown(0.5);
          write(heading(b), { size: 15, bold: true, gap: 4 });
        } else if (b.type === 'text') {
          texts(b).forEach((t) => write(t, { size: 11, gap: 6 }));
        } else if (b.type === 'callout') {
          const warn = b.variant === 'warning';
          ensure(50);
          const page = doc.bufferedPageRange().count;
          const y0 = doc.y;
          write(warn ? 'WARNING · ማስጠንቀቂያ' : 'TIP · ጠቃሚ ምክር', { size: 8, bold: true, color: warn ? '#8a6d00' : '#0f766e', indent: 12, gap: 1 });
          texts(b).forEach((t) => write(t, { size: 10.5, color: warn ? '#6b5200' : '#0b4f48', indent: 12, gap: 3 }));
          if (doc.bufferedPageRange().count === page) {
            doc.rect(left, y0, 3, Math.max(doc.y - y0 - 2, 8)).fill(warn ? '#b58900' : '#0f766e');
          }
          doc.moveDown(0.5);
        } else if (b.type === 'step') {
          step += 1;
          ensure(48);
          const y0 = doc.y;
          doc.circle(left + 11, y0 + 9, 11).fill('#0f766e');
          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(String(step), left, y0 + 4, { width: 22, align: 'center', lineBreak: false });
          doc.y = y0;
          texts(b).forEach((t) => write(t, { size: 11, indent: 32, gap: 5 }));
          picture(i, b, 32);
          doc.moveDown(0.4);
        } else if (b.type === 'image') {
          picture(i, b);
          doc.moveDown(0.4);
        } else if (b.type === 'youtube') {
          const id = youtubeId(b.youtubeUrl);
          const url = id ? `https://www.youtube.com/watch?v=${id}` : b.youtubeUrl;
          if (url) {
            ensure(24);
            doc.fillColor('#1d4ed8').font('Helvetica').fontSize(10).text(`Video: ${latinSafe(url)}`, left, doc.y, { width, link: url, underline: true });
            doc.moveDown(0.6);
          }
        }
      });

      // ---- footer: page numbers + code
      const range = doc.bufferedPageRange();
      for (let p = 0; p < range.count; p += 1) {
        doc.switchToPage(p);
        const keep = doc.page.margins.bottom;
        doc.page.margins.bottom = 0; // otherwise writing in the bottom margin adds a blank page
        doc.fillColor('#8899aa').font('Helvetica').fontSize(8)
          .text(`${code ? `${code}  ·  ` : ''}${p + 1} / ${range.count}`, left, doc.page.height - 32, { width, align: 'center', lineBreak: false });
        doc.page.margins.bottom = keep;
      }
      doc.end();
    } catch (e) { reject(e); }
  });
}
