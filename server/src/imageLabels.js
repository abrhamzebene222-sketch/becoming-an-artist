// Automatic picture labels (number 9).
// Every picture inside a lesson or a self-evaluation document gets a name made of:
//   chapter / groups (shortened) / lesson title (shortened) [/ Self-Eval tag] + the picture's number (1, 2, 3 …)
// Nothing is stored: the label is built from the tree and the picture's position, so it always follows renames and re-ordering.
import { Course } from './models/index.js';
import { ancestorChain } from './tree.js';

const SEP = ' / ';
const MAX_GROUP = 18;     // one chapter / group name
const MAX_GROUP_TIGHT = 10; // used when the whole name is still too long
const MAX_TITLE = 40;     // the lesson title
const MAX_BASE = 110;     // whole name before the number
const TAG = { en: 'Self-Eval', am: 'ራስ መገምገሚያ' };

/** Shorten a name to `max` characters, cutting at a word boundary when possible. */
export function shorten(text, max) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return `${(sp >= Math.floor(max / 3) ? cut.slice(0, sp) : cut).replace(/[\s,:;.\-–—&]+$/, '')}…`;
}

function build(groupNames, title, tag) {
  const make = (groupMax, list) => [...list.map((g) => shorten(g, groupMax)), shorten(title, MAX_TITLE), ...(tag ? [tag] : [])]
    .filter(Boolean).join(SEP);
  let out = make(MAX_GROUP, groupNames);
  if (out.length > MAX_BASE) out = make(MAX_GROUP_TIGHT, groupNames);
  if (out.length > MAX_BASE && groupNames.length > 2) out = make(MAX_GROUP_TIGHT, [groupNames[0], groupNames[groupNames.length - 1]]);
  return out;
}

/**
 * { labelBase, labelBaseAm } for a lesson (lean doc with title, titleAm, course).
 * The picture label is `${labelBase} ${number}`.
 */
export async function labelBases(lesson, { selfEval = false } = {}) {
  const course = lesson?.course ? await Course.findById(lesson.course, 'category').lean() : null;
  const chain = course?.category ? (await ancestorChain(course.category)).reverse() : []; // chapter first
  const en = build(chain.map((c) => c.title), lesson?.title, selfEval ? TAG.en : '');
  const am = build(chain.map((c) => c.titleAm || c.title), lesson?.titleAm || lesson?.title, selfEval ? TAG.am : '');
  return { labelBase: en, labelBaseAm: am };
}

/** Picture numbers in reading order: image blocks and step pictures that really have a picture. Map(blockId → 1, 2, 3 …). */
export function imageNumbers(blocks = []) {
  const out = new Map();
  let n = 0;
  for (const b of blocks) {
    if ((b.type === 'image' || b.type === 'step') && b.image?.url) { n += 1; out.set(String(b._id), n); }
  }
  return out;
}
