// Fast, language-neutral search over published COURSES and LESSONS.
//
// Why not a MongoDB text index?  Atlas M0 (free) text search has no Amharic support, so Amharic words are not
// split or matched properly. The whole catalogue is small (hundreds of titles), so we keep a tiny in-memory index
// instead: it works the same for English and Amharic, answers in a few milliseconds and needs no extra database cost.
//
// What is searched (metadata only — lesson BODY text is never searched, so paid content cannot leak through search):
//   course : title, titleAm, keywords, keywordsAm, summary, summaryAm, learningOutcomes, group names above it
//   lesson : title, titleAm, keywords, keywordsAm, plus its course title and group names (lower weight)
//
// Matching rules
//   • Every word typed must be found (AND). Order does not matter.
//   • A word matches at the START of a word (best) or ANYWHERE inside a word (Amharic prefixes like የ / በ / ለ).
//   • Amharic look-alike letters are treated as one (ሀ ሐ ኀ, ሰ ሠ, አ ዐ, ጸ ፀ). Punctuation and accents are ignored.
//   • If nothing is found, a second pass forgives small English typos (e.g. "persepctive").
//   • Results are ranked: title > keywords > summary > group names.
import { Course, Lesson } from './models/index.js';
import { getCategories } from './tree.js';

const TTL_MS = 30_000;       // the index is rebuilt at most every 30 s (and right after any admin change)
const MAX_TOKENS = 6;
const MAX_QUERY = 80;

// ---------- text normalisation ----------
const ETHIOPIC_FOLD = /[\u1210-\u1217\u1220-\u1227\u1280-\u1287\u12D0-\u12D7\u1340-\u1347]/g;
function foldEthiopic(ch) {
  const c = ch.charCodeAt(0);
  if (c >= 0x1210 && c <= 0x1217) return String.fromCharCode(c - 0x10); // ሐ → ሀ
  if (c >= 0x1280 && c <= 0x1287) return String.fromCharCode(c - 0x80); // ኀ → ሀ
  if (c >= 0x1220 && c <= 0x1227) return String.fromCharCode(c + 0x10); // ሠ → ሰ
  if (c >= 0x12D0 && c <= 0x12D7) return String.fromCharCode(c - 0x30); // ዐ → አ
  if (c >= 0x1340 && c <= 0x1347) return String.fromCharCode(c - 0x08); // ፀ → ጸ
  return ch;
}

/** lower-case, no accents, Amharic look-alike letters merged, punctuation → single spaces */
export function normalize(input) {
  return String(input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(ETHIOPIC_FOLD, foldEthiopic)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function tokenize(q) {
  const seen = new Set();
  for (const w of normalize(String(q ?? '').slice(0, MAX_QUERY)).split(' ')) if (w) seen.add(w);
  return [...seen].slice(0, MAX_TOKENS);
}

const hasEthiopic = (s) => /[\u1200-\u137F]/.test(s);
/** A query must be at least 2 characters (1 is enough for an Amharic syllable). */
export const isSearchable = (q) => {
  const n = normalize(String(q ?? '').slice(0, MAX_QUERY));
  return n.length >= 2 || (n.length === 1 && hasEthiopic(n));
};

/** true when every word of q is found inside text (used to match group names in the catalogue tree) */
export function textMatches(q, text) {
  const tokens = tokenize(q);
  if (!tokens.length) return true;
  const n = normalize(text);
  return tokens.every((t) => n.includes(t));
}

// ---------- typo tolerance (English only) ----------
function osa(a, b) { // Damerau–Levenshtein (optimal string alignment) distance
  const m = a.length; const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j += 1) d[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
    }
  }
  return d[m][n];
}
function fuzzyWordScore(token, words) {
  if (token.length < 4 || hasEthiopic(token)) return 0;
  const max = token.length >= 8 ? 2 : 1;
  for (const w of words) {
    if (Math.abs(w.length - token.length) > max + 2) continue;
    if (osa(token, w) <= max || osa(token, w.slice(0, token.length)) <= max) return 30;
  }
  return 0;
}

// ---------- index ----------
// weights = [match at the start of a word, match inside a word]
const WEIGHTS = { title: [100, 60], kw: [80, 50], text: [25, 15], path: [20, 12], ctx: [18, 10] };
const pad = (s) => (s ? ` ${s}` : '');

function trailOf(byId, categoryId) {
  const out = [];
  const seen = new Set();
  let cur = byId.get(String(categoryId));
  while (cur && !seen.has(String(cur._id))) {
    seen.add(String(cur._id));
    out.unshift({ title: cur.title || '', titleAm: cur.titleAm || '' });
    cur = cur.parent ? byId.get(String(cur.parent)) : null;
  }
  return out;
}

/** Pure function (easy to test): builds the searchable entries from plain objects. */
export function buildIndex(courses, lessons, byId) {
  const entries = [];
  const courseInfo = new Map();
  const lessonCount = new Map();
  let order = 0;

  for (const c of courses) {
    const path = trailOf(byId, c.category);
    const pathText = normalize(path.map((p) => `${p.title} ${p.titleAm}`).join(' '));
    const title = normalize(`${c.title} ${c.titleAm || ''}`);
    const kw = normalize(`${c.keywords || ''} ${c.keywordsAm || ''}`);
    const courseOrder = order++;
    courseInfo.set(String(c._id), { c, path, pathText, courseOrder, titleOnly: normalize(`${c.title} ${c.titleAm || ''}`) });
    entries.push({
      kind: 'course', order: courseOrder * 10000, c, path,
      titles: [pad(normalize(c.title)), pad(normalize(c.titleAm))].filter((x) => x.trim()),
      f: {
        title: pad(title), kw: pad(kw), path: pad(pathText),
        text: pad(normalize(`${c.summary || ''} ${c.summaryAm || ''} ${c.learningOutcomes || ''}`)),
      },
      words: [...new Set(`${title} ${kw}`.split(' ').filter(Boolean))],
    });
  }

  for (const l of lessons) {
    const info = courseInfo.get(String(l.course));
    if (!info) continue; // lesson of an unpublished / missing course
    const title = normalize(`${l.title} ${l.titleAm || ''}`);
    const kw = normalize(`${l.keywords || ''} ${l.keywordsAm || ''}`);
    const n = (lessonCount.get(info.courseOrder) || 0) + 1; // ties: course order first, then lesson order inside the course
    lessonCount.set(info.courseOrder, n);
    entries.push({
      kind: 'lesson', order: info.courseOrder * 10000 + n, l, c: info.c, path: info.path,
      titles: [pad(normalize(l.title)), pad(normalize(l.titleAm))].filter((x) => x.trim()),
      f: { title: pad(title), kw: pad(kw), ctx: pad(info.titleOnly), path: pad(info.pathText) },
      words: [...new Set(`${title} ${kw}`.split(' ').filter(Boolean))],
    });
  }
  return { entries, builtAt: Date.now() };
}

function tokenScore(token, f) {
  let best = 0;
  for (const [name, [start, inside]] of Object.entries(WEIGHTS)) {
    const s = f[name];
    if (!s) continue;
    if (s.includes(` ${token}`)) best = Math.max(best, start);
    else if (s.includes(token)) best = Math.max(best, inside);
  }
  return best;
}

function scoreEntry(tokens, e, fuzzy) {
  let total = 0;
  for (const t of tokens) {
    let s = tokenScore(t, e.f);
    if (!s && fuzzy) s = fuzzyWordScore(t, e.words);
    if (!s) return 0; // every word must be found
    total += s;
  }
  const whole = ` ${tokens.join(' ')}`;
  if (e.titles.some((x) => x === whole)) total += 120;
  else if (e.titles.some((x) => x.startsWith(whole))) total += 60;
  return total;
}

const clip = (s, n) => String(s || '').slice(0, n);

function courseHit(e, score) {
  const c = e.c;
  return {
    id: String(c._id), slug: c.slug, title: c.title, titleAm: c.titleAm || '',
    summary: clip(c.summary, 160), summaryAm: clip(c.summaryAm, 160),
    isFree: !!c.isFree, priceEtb: c.priceEtb || 0, path: e.path, score,
  };
}
function lessonHit(e, score) {
  const { l, c } = e;
  return {
    id: String(l._id), title: l.title, titleAm: l.titleAm || '', kind: l.kind, isPreview: !!l.isPreview,
    courseId: String(c._id), courseSlug: c.slug, courseTitle: c.title, courseTitleAm: c.titleAm || '',
    courseIsFree: !!c.isFree, path: e.path, score,
  };
}

/** Every matching entry, best first. */
function rawHits(index, q) {
  const tokens = tokenize(q);
  if (!tokens.length || !isSearchable(q)) return [];
  const run = (fuzzy) => index.entries
    .map((e) => ({ e, score: scoreEntry(tokens, e, fuzzy) }))
    .filter((x) => x.score > 0);
  let hits = run(false);
  if (!hits.length) hits = run(true);
  return hits.sort((a, b) => b.score - a.score || a.e.order - b.e.order);
}

/** Pure ranking + shaping (easy to test). */
export function runSearch(index, q, { courses = 8, lessons = 20 } = {}) {
  const hits = rawHits(index, q);
  const cs = hits.filter((h) => h.e.kind === 'course');
  const ls = hits.filter((h) => h.e.kind === 'lesson');
  return {
    q: String(q ?? '').slice(0, MAX_QUERY),
    courseTotal: cs.length,
    lessonTotal: ls.length,
    courses: cs.slice(0, courses).map((h) => courseHit(h.e, h.score)),
    lessons: ls.slice(0, lessons).map((h) => lessonHit(h.e, h.score)),
  };
}

/** ids of every course that matches directly OR through one of its lessons (used to filter the catalogue tree) */
export function matchingIds(index, q) {
  const ids = new Set();
  for (const { e } of rawHits(index, q)) ids.add(String(e.c._id));
  return ids;
}

// ---------- cached loader ----------
let cache = null;
let cachedAt = 0;
let building = null;

/** Call after any course / lesson / group change so the next search sees it immediately. */
export const invalidateSearch = () => { cache = null; };

async function load() {
  const [{ byId }, courses, lessons] = await Promise.all([
    getCategories(),
    Course.find({ isPublished: true }, 'title titleAm slug summary summaryAm learningOutcomes keywords keywordsAm category isFree priceEtb sortOrder createdAt')
      .sort({ sortOrder: 1, createdAt: 1 }).lean(),
    Lesson.find({}, 'course title titleAm kind keywords keywordsAm isPreview sortOrder createdAt')
      .sort({ sortOrder: 1, createdAt: 1 }).lean(),
  ]);
  cache = buildIndex(courses, lessons, byId);
  cachedAt = Date.now();
  return cache;
}

async function getIndex() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;
  if (!building) building = load().finally(() => { building = null; });
  return building;
}

export async function searchAll(q, opts) { return runSearch(await getIndex(), q, opts); }
export async function matchingCourseIds(q) { return matchingIds(await getIndex(), q); }
