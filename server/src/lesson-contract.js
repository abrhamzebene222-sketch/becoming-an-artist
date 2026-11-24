// ─── Lesson content contract (v2) ────────────────────────────────────────────
// Matches the revised app: SIX block types (text, heading, step, callout, image, youtube),
// Lesson.titleAm in the schema, and the canonical YouTube URL the admin route stores.
// One lesson = one file under src/data/lessons/. The slot id decides placement, never the folder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const SLOTS_FILE = path.resolve(here, '..', 'lesson-slots.json');
export const LESSONS_DIR = path.join(here, 'data', 'lessons');
export const BLOCK_TYPES = ['text', 'heading', 'step', 'callout', 'image', 'youtube'];
export const MAX_BLOCKS = 200;                 // same cap as the admin route
export const LIMITS = { text: 20000, heading: 300, callout: 5000, caption: 500 };

let cache = null;
export function slots() {
  if (!cache) cache = JSON.parse(fs.readFileSync(SLOTS_FILE, 'utf8'));
  return cache;
}
export const byId = (id) => slots().find((s) => s.slot === String(id || '').trim().toUpperCase()) || null;

export function slugify(title) {
  return String(title || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/g, '');
}

/** Same extraction as server/src/lib.js youtubeId() — keeps URLs identical to the admin route. */
export function youtubeId(url) {
  const m = String(url || '').match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

const str = (v) => String(v == null ? '' : v);
const clean = (v) => str(v).replace(/\s+/g, ' ').trim();
const clip = (v, n) => str(v).slice(0, n);
const isTextish = (v) => clean(v).length > 0;

function media(b, errs, warnings, where) {
  // admin cleanMedia() requires url AND publicId, otherwise the block is dropped on save
  const url = clean((b.image && b.image.url) || b.imageUrl);
  const publicId = clean((b.image && b.image.publicId) || b.publicId);
  if (!/^https?:\/\//i.test(url)) { errs.push(`${where}: needs image.url / imageUrl (http or https)`); return null; }
  if (!publicId) warnings.push(`${where}: no publicId — the image shows fine, but Admin › Courses will drop it if you edit that lesson`);
  return { url, publicId, account: clean(b.image && b.image.account) || 'env', resourceType: 'image' };
}

function normalizeOne(b, i, errs, warnings) {
  const where = `block ${i + 1}`;
  if (!b || typeof b !== 'object' || Array.isArray(b)) { errs.push(`${where}: not an object`); return null; }
  const type = clean(b.type).toLowerCase();
  const caption = clip(clean(b.caption), LIMITS.caption);

  if (type === 'text') {
    if (!isTextish(b.text) && !isTextish(b.textAm)) { errs.push(`${where} (text): needs text or textAm`); return null; }
    return { type: 'text', text: clip(str(b.text), LIMITS.text), textAm: clip(str(b.textAm), LIMITS.text) };
  }
  if (type === 'heading') {
    if (!isTextish(b.text) && !isTextish(b.textAm)) { errs.push(`${where} (heading): needs a short section title`); return null; }
    return { type: 'heading', text: clip(clean(b.text), LIMITS.heading), textAm: clip(clean(b.textAm), LIMITS.heading) };
  }
  if (type === 'step') {
    const image = b.image || b.imageUrl ? media(b, errs, warnings, `${where} (step)`) : null;
    if (!isTextish(b.text) && !isTextish(b.textAm) && !image) { errs.push(`${where} (step): needs text or an image`); return null; }
    const out = { type: 'step', text: clip(str(b.text), LIMITS.text), textAm: clip(str(b.textAm), LIMITS.text) };
    if (image) { out.image = image; if (caption) out.caption = caption; }
    return out;
  }
  if (type === 'callout') {
    if (!isTextish(b.text) && !isTextish(b.textAm)) { errs.push(`${where} (callout): needs text`); return null; }
    return {
      type: 'callout',
      variant: clean(b.variant).toLowerCase() === 'warning' ? 'warning' : 'tip',
      text: clip(str(b.text), LIMITS.callout),
      textAm: clip(str(b.textAm), LIMITS.callout),
    };
  }
  if (type === 'image') {
    const image = media(b, errs, warnings, `${where} (image)`);
    return image ? { type: 'image', image, ...(caption ? { caption } : {}) } : null;
  }
  if (type === 'youtube') {
    const id = youtubeId(b.youtubeUrl || b.url || b.youtubeId);
    if (!id) { errs.push(`${where} (youtube): needs a real youtube.com / youtu.be link`); return null; }
    return { type: 'youtube', youtubeUrl: `https://www.youtube.com/watch?v=${id}`, ...(caption ? { caption } : {}) };
  }
  errs.push(`${where}: unknown type "${b.type}" — use text, heading, step, callout, image or youtube`);
  return null;
}

export function normalizeBlocks(raw, errs = [], warnings = []) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) { errs.push('`blocks` must be an array'); return []; }
  if (raw.length > MAX_BLOCKS) errs.push(`too many blocks (${raw.length}) — the app keeps ${MAX_BLOCKS}`);
  const out = [];
  raw.slice(0, MAX_BLOCKS).forEach((b, i) => { const n = normalizeOne(b, i, errs, warnings); if (n) out.push(n); });
  return out;
}

/** Full check of one lesson file. → { ok, errors, warnings, lesson, slot } */
export function checkLesson(data, file = '') {
  const errors = [], warnings = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, errors: ['the file must `export default { … }` one object'], warnings, lesson: null, slot: null };
  }
  const slotRow = byId(data.slot);
  if (!isTextish(data.slot)) errors.push('missing `slot` — copy it from lesson-slots.csv');
  else if (!slotRow) errors.push(`unknown slot "${data.slot}" — not in lesson-slots.json`);

  if (slotRow) {
    if (clean(data.course).toLowerCase() !== slotRow.courseSlug.toLowerCase()) {
      errors.push(`\`course\` must be exactly "${slotRow.courseSlug}" (got "${clean(data.course) || 'nothing'}")`);
    }
    if (isTextish(data.title) && clean(data.title).toLowerCase() !== clean(slotRow.title).toLowerCase()) {
      warnings.push(`title differs from the manifest — the app keeps "${slotRow.title}"`);
    }
    if (file && !path.basename(file).startsWith(slotRow.slot)) {
      warnings.push(`filename should start with "${slotRow.slot}-" (expected ${slotRow.file})`);
    }
  }

  const blocks = normalizeBlocks(data.blocks, errors, warnings);
  if (!blocks.length) warnings.push('no blocks — the lesson shows the "content coming soon" note');
  const stepCount = blocks.filter((b) => b.type === 'step').length;
  const headed = blocks[0]?.type === 'heading';
  if (stepCount && !headed) warnings.push('steps without a leading `heading` — numbering starts at 1 from the top');

  const lesson = {
    slot: clean(data.slot).toUpperCase(),
    courseSlug: slotRow ? slotRow.courseSlug : undefined,
    position: slotRow ? slotRow.index : undefined,
    title: slotRow ? slotRow.title : clean(data.title),
    titleAm: isTextish(data.titleAm) ? clean(data.titleAm) : (slotRow ? slotRow.titleAm : ''),
    blocks,
    isPreview: data.isPreview === true,
  };
  return { ok: errors.length === 0, errors, warnings, lesson, slot: slotRow };
}

export function lessonFiles(dir = LESSONS_DIR) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walkDir = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name.startsWith('_')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walkDir(p);
      else if (e.name.endsWith('.js')) out.push(p);
    }
  };
  walkDir(dir);
  return out.sort();
}

export const describe = (slot) =>
  `Chapter ${slot.chapterNo} ${slot.chapter} › ${slot.trail.join(' › ')} › ${slot.course} (lesson ${slot.index})`;
