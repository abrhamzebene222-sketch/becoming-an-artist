// Self-evaluation documents (student side).
// A document belongs to one lesson and is written by the admin. Students buy it ONLY with tokens (1 token = 1 ETB),
// any number at a time (no minimum). The document is read inside the app (text / image blocks), never exported.
//   GET  /api/self-evals?q=…   lessons (search) with: is a document prepared? price? already bought?
//   GET  /api/self-evals/mine  my purchased documents
//   POST /api/self-evals/buy   { lessonIds: [...] }  spend tokens on every selected document
//   GET  /api/self-evals/:id   the document content (buyers and admins only)
import { Router } from 'express';
import mongoose from 'mongoose';
import { SelfEval, SelfEvalPurchase, Lesson, Course, User } from '../models/index.js';
import { requireAuth } from '../auth.js';
import { fail } from '../i18n.js';
import { ah, spendTokens, youtubeId, isAdmin } from '../lib.js';
import { searchAll, isSearchable } from '../search.js';

const router = Router();
router.use(requireAuth);

const MAX_BUY = 50;
const price = (e) => Math.max(0, Math.round(Number(e.priceEtb) || 0));

/** Search lessons; with no search text, list the lessons that already have a document. */
router.get('/', ah(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const uid = req.user.id;
  const me = await User.findById(uid, 'creditEtb').lean();
  const balance = me?.creditEtb || 0;
  let rows = [];

  if (q) {
    if (isSearchable(q)) {
      const r = await searchAll(q, { courses: 1, lessons: 40 });
      rows = r.lessons.map((h) => ({
        lessonId: h.id, title: h.title, titleAm: h.titleAm || '', courseTitle: h.courseTitle, courseTitleAm: h.courseTitleAm || '',
      }));
    }
  } else {
    const evals = await SelfEval.find({ isPublished: true }).sort({ updatedAt: -1 }).limit(60).lean();
    const lessons = await Lesson.find({ _id: { $in: evals.map((e) => e.lesson) } }, 'title titleAm course').lean();
    const courses = await Course.find({ _id: { $in: lessons.map((l) => l.course) }, isPublished: true }, 'title titleAm').lean();
    const courseBy = new Map(courses.map((c) => [String(c._id), c]));
    rows = lessons.filter((l) => courseBy.has(String(l.course))).map((l) => {
      const c = courseBy.get(String(l.course));
      return { lessonId: String(l._id), title: l.title, titleAm: l.titleAm || '', courseTitle: c.title, courseTitleAm: c.titleAm || '' };
    });
  }

  const evals = rows.length ? await SelfEval.find({ lesson: { $in: rows.map((r) => r.lessonId) }, isPublished: true }).lean() : [];
  const evalBy = new Map(evals.map((e) => [String(e.lesson), e]));
  const owned = evals.length
    ? new Set((await SelfEvalPurchase.find({ user: uid, selfEval: { $in: evals.map((e) => e._id) } }, 'selfEval').lean()).map((p) => String(p.selfEval)))
    : new Set();
  res.json({
    balance,
    items: rows.map((r) => {
      const e = evalBy.get(r.lessonId);
      return { ...r, evalId: e ? String(e._id) : '', priceEtb: e ? price(e) : 0, owned: !!e && owned.has(String(e._id)) };
    }),
  });
}));

router.get('/mine', ah(async (req, res) => {
  const purchases = await SelfEvalPurchase.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(200).lean();
  const lessons = await Lesson.find({ _id: { $in: purchases.map((p) => p.lesson) } }, 'title titleAm course').lean();
  const courses = await Course.find({ _id: { $in: lessons.map((l) => l.course) } }, 'title titleAm').lean();
  const lessonBy = new Map(lessons.map((l) => [String(l._id), l]));
  const courseBy = new Map(courses.map((c) => [String(c._id), c]));
  res.json(purchases.map((p) => {
    const l = lessonBy.get(String(p.lesson)); const c = l && courseBy.get(String(l.course));
    return {
      id: String(p.selfEval), lessonId: String(p.lesson), title: l?.title || '', titleAm: l?.titleAm || '',
      courseTitle: c?.title || '', courseTitleAm: c?.titleAm || '', paidEtb: p.paidEtb || 0, boughtAt: p.createdAt,
    };
  }));
}));

/**
 * Buy one or many documents. The server decides every price (the browser sends only lesson ids).
 * Each document is paid one by one with spendTokens() (atomic, never a negative balance, ledger row per document).
 * The total is checked first so a student who cannot afford the whole selection pays for nothing.
 */
router.post('/buy', ah(async (req, res) => {
  const raw = Array.isArray(req.body?.lessonIds) ? req.body.lessonIds : [];
  const ids = [...new Set(raw.map(String))].filter((id) => mongoose.isValidObjectId(id)).slice(0, MAX_BUY);
  if (!ids.length) return fail(req, res, 400, 'selfEvalSelect');
  const uid = req.user.id;

  const evals = await SelfEval.find({ lesson: { $in: ids }, isPublished: true }).lean();
  if (evals.length !== ids.length) return fail(req, res, 400, 'selfEvalNone');
  const have = new Set((await SelfEvalPurchase.find({ user: uid, selfEval: { $in: evals.map((e) => e._id) } }, 'selfEval').lean()).map((p) => String(p.selfEval)));
  const todo = evals.filter((e) => !have.has(String(e._id)));
  if (!todo.length) return fail(req, res, 400, 'alreadyUnlocked');

  const total = todo.reduce((s, e) => s + price(e), 0);
  const me = await User.findById(uid, 'creditEtb').lean();
  if ((me?.creditEtb || 0) < total) return fail(req, res, 400, 'notEnoughCredit');

  const lessons = await Lesson.find({ _id: { $in: todo.map((e) => e.lesson) } }, 'course').lean();
  const courseOf = new Map(lessons.map((l) => [String(l._id), l.course]));

  let bought = 0; let spent = 0; let balance = me?.creditEtb || 0; let stopped = '';
  for (const e of todo) {
    const p = price(e);
    const grant = async () => (await SelfEvalPurchase.updateOne({ user: uid, selfEval: e._id },
      { $setOnInsert: { user: uid, selfEval: e._id, lesson: e.lesson, paidEtb: p } }, { upsert: true })).upsertedCount === 1;
    if (p === 0) { if (await grant()) bought += 1; continue; }            // a document the admin made free
    const r = await spendTokens(uid, p, { reason: 'unlock_selfeval', selfEval: e._id, lesson: e.lesson, course: courseOf.get(String(e.lesson)) }, grant);
    if (r.error === 'alreadyUnlocked') continue;                          // bought a moment ago on another device
    if (r.error) { stopped = r.error; break; }
    bought += 1; spent += p; balance = r.balance;
  }
  if (!bought && stopped) return fail(req, res, 400, stopped);
  res.json({ ok: true, bought, spent, creditEtb: balance, stopped });
}));

/** The document itself. Buyers keep access even if the admin hides it later. */
router.get('/:id', ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(req, res, 404, 'selfEvalNotFound');
  const e = await SelfEval.findById(req.params.id).lean();
  if (!e) return fail(req, res, 404, 'selfEvalNotFound');
  if (!isAdmin(req.user) && !(await SelfEvalPurchase.exists({ user: req.user.id, selfEval: e._id }))) {
    return fail(req, res, 403, 'selfEvalLocked');
  }
  const lesson = await Lesson.findById(e.lesson, 'title titleAm course').lean();
  const course = lesson ? await Course.findById(lesson.course, 'title titleAm slug').lean() : null;
  res.set('Cache-Control', 'private, no-cache'); // the service worker keeps its own offline copy
  res.json({
    id: String(e._id), lessonId: String(e.lesson),
    title: lesson?.title || '', titleAm: lesson?.titleAm || '',
    courseTitle: course?.title || '', courseTitleAm: course?.titleAm || '', courseSlug: course?.slug || '',
    blocks: (e.blocks || []).map((b) => ({
      id: String(b._id), type: b.type, text: b.text || '', textAm: b.textAm || '', caption: b.caption || '',
      imageUrl: b.image?.url || '', variant: b.variant || '',
      youtubeId: b.type === 'youtube' ? youtubeId(b.youtubeUrl) : '',
    })),
  });
}));

export default router;
