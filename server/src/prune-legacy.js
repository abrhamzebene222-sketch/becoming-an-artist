// Removes the OLD starter curriculum (groups / courses / lessons that are not part of curriculum.js).
//
// Why this exists: the first version of the app seeded a small syllabus (e.g. courses "Points & Lines",
// "Formal Structures", "Volume", "Chiaroscuro" directly under "Drawing Fundamentals", a chapter called
// "Human Anatomy & Figure Drawing", a second "Composition & Perspective"). They are still in MongoDB, so they
// show up next to the real 485-lesson tree. This file deletes them — and because seed() calls it on every start,
// they cannot come back after a GitHub push / Render deploy.
//
// What is treated as OLD ("legacy"):
//   • a major group (no parent) whose slug is not in curriculum.js, with everything below it
//   • a course sitting DIRECTLY under a major group whose slug is not in curriculum.js
//   • anything non-canonical below a legacy group
// What is NEVER touched:
//   • every group / course / lesson that is in curriculum.js (your 485 lessons and their content)
//   • groups/courses you created in the admin panel (their slug ends with the 8-character time code the admin adds)
//   • any legacy item that students already bought / unlocked / paid for (it is kept and reported instead)
//
//   Dry run (shows what would be deleted):  node src/prune-legacy.js
//   Delete for real:                        node src/prune-legacy.js --apply
//   Switch the automatic start-up cleaning off: set PRUNE_LEGACY=off on Render
import { pathToFileURL } from 'node:url';
import {
  Category, Course, Lesson, Enrollment, GroupEnrollment, Subscription, Payment,
  LessonUnlock, SelfEval, SelfEvalPurchase,
} from './models/index.js';
import { CURRICULUM } from './curriculum.js';
import { syncMedia } from './cloudinary.js';
import { invalidateTree } from './tree.js';

// admin.js creates slugs as `${slugify(title)}-${Date.now().toString(36)}` — an 8-character base-36 time code.
const isAdminMade = (slug) => {
  const m = /-([a-z0-9]{8})$/.exec(String(slug || ''));
  if (!m) return false;
  const ms = parseInt(m[1], 36);
  return ms > 1.4e12 && ms < 3.2e12; // between 2014 and 2070
};

function canonicalSlugs() {
  const groups = new Set(); const courses = new Set();
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.lessons?.length) courses.add(n.slug);
      else { groups.add(n.slug); if (n.children?.length) walk(n.children); }
    }
  };
  walk(CURRICULUM);
  return { groups, courses };
}

const sid = (x) => String(x);

export async function pruneLegacyCurriculum({ apply = true, log = console.log, quiet = false } = {}) {
  const canon = canonicalSlugs();
  const cats = await Category.find({}, 'parent slug title').lean();
  const courses = await Course.find({}, 'category slug title').lean();
  const catBy = new Map(cats.map((c) => [sid(c._id), c]));

  // ---- 1. legacy groups: non-canonical major groups + every non-canonical group below a legacy one ----
  const legacyCat = new Set();
  const childrenOf = new Map();
  for (const c of cats) {
    const p = c.parent && catBy.has(sid(c.parent)) ? sid(c.parent) : null;
    if (!childrenOf.has(p)) childrenOf.set(p, []);
    childrenOf.get(p).push(c);
  }
  const markLegacy = (c) => {
    legacyCat.add(sid(c._id));
    for (const ch of childrenOf.get(sid(c._id)) || []) {
      if (!canon.groups.has(ch.slug) && !isAdminMade(ch.slug)) markLegacy(ch);
    }
  };
  for (const top of childrenOf.get(null) || []) {
    if (!canon.groups.has(top.slug) && !isAdminMade(top.slug)) markLegacy(top);
  }

  // ---- 2. legacy courses ----
  const legacyCourse = [];
  for (const co of courses) {
    if (canon.courses.has(co.slug) || isAdminMade(co.slug)) continue;
    const parent = catBy.get(sid(co.category));
    const underMajor = parent && !parent.parent;                 // directly under a major group
    const underLegacy = legacyCat.has(sid(co.category));          // inside a legacy group
    const orphan = !parent;                                       // its group no longer exists
    if (underMajor || underLegacy || orphan) legacyCourse.push(co);
  }
  const legacyCourseIds = legacyCourse.map((c) => c._id);

  // ---- 3. protect anything students already paid for ----
  const [enr, unl, pay, bought] = await Promise.all([
    Enrollment.distinct('course', { course: { $in: legacyCourseIds } }),
    LessonUnlock.distinct('course', { course: { $in: legacyCourseIds } }),
    Payment.distinct('course', { course: { $in: legacyCourseIds } }),
    (async () => {
      const ls = await Lesson.find({ course: { $in: legacyCourseIds } }, '_id course').lean();
      const ids = await SelfEvalPurchase.distinct('lesson', { lesson: { $in: ls.map((l) => l._id) } });
      const set = new Set(ids.map(sid));
      return ls.filter((l) => set.has(sid(l._id))).map((l) => l.course);
    })(),
  ]);
  const keptCourse = new Set([...enr, ...unl, ...pay, ...bought].map(sid));

  const legacyCatIds = [...legacyCat];
  const [grpEnr, subs, grpPay] = await Promise.all([
    GroupEnrollment.distinct('category', { category: { $in: legacyCatIds } }),
    Subscription.distinct('groups', { groups: { $in: legacyCatIds } }),
    Payment.distinct('category', { category: { $in: legacyCatIds } }),
  ]);
  const keptCat = new Set([...grpEnr, ...subs, ...grpPay].map(sid));
  // a kept course keeps its whole chain of groups alive
  for (const co of courses) {
    if (!keptCourse.has(sid(co._id))) continue;
    let cur = catBy.get(sid(co.category)); const seen = new Set();
    while (cur && !seen.has(sid(cur._id))) { seen.add(sid(cur._id)); keptCat.add(sid(cur._id)); cur = cur.parent ? catBy.get(sid(cur.parent)) : null; }
  }
  // a kept group keeps its ancestors alive
  for (const id of [...keptCat]) {
    let cur = catBy.get(id); const seen = new Set();
    while (cur && !seen.has(sid(cur._id))) { seen.add(sid(cur._id)); keptCat.add(sid(cur._id)); cur = cur.parent ? catBy.get(sid(cur.parent)) : null; }
  }

  const delCourses = legacyCourse.filter((c) => !keptCourse.has(sid(c._id)));
  const delCats = cats.filter((c) => legacyCat.has(sid(c._id)) && !keptCat.has(sid(c._id)));
  const delCourseIds = delCourses.map((c) => c._id);
  const lessonCount = delCourseIds.length ? await Lesson.countDocuments({ course: { $in: delCourseIds } }) : 0;

  if (!delCats.length && !delCourses.length) { if (!quiet) log('Nothing to clean — only the real curriculum is in the database.'); return { groups: 0, courses: 0, lessons: 0 }; }
  log(`\nOld starter curriculum found: ${delCats.length} group(s), ${delCourses.length} course(s), ${lessonCount} lesson(s).`);
  for (const c of delCats.filter((x) => !x.parent || !legacyCat.has(sid(x.parent)))) log(`  group  : ${c.title}  (${c.slug})`);
  for (const c of delCourses.slice(0, 60)) log(`  course : ${c.title}  (${c.slug})`);
  if (delCourses.length > 60) log(`  … and ${delCourses.length - 60} more course(s)`);
  const protectedCount = legacyCourse.length - delCourses.length;
  if (protectedCount) log(`  ⚠ ${protectedCount} old course(s) kept because students bought or unlocked them.`);

  if (!apply) { log('\nDry run — nothing deleted. Add --apply to delete.'); return { groups: delCats.length, courses: delCourses.length, lessons: lessonCount, dryRun: true }; }

  // ---- 4. delete (images on Cloudinary first, then the documents) ----
  const lessons = await Lesson.find({ course: { $in: delCourseIds } }, 'blocks').lean();
  const evals = await SelfEval.find({ lesson: { $in: lessons.map((l) => l._id) } }, 'blocks').lean();
  const picsOf = (blocks = []) => blocks.filter((b) => b.image?.publicId).map((b) => b.image);
  const delCatDocs = await Category.find({ _id: { $in: delCats.map((c) => c._id) } }, 'slides').lean();
  try {
    await syncMedia([
      ...delCatDocs.flatMap((c) => c.slides || []),
      ...lessons.flatMap((l) => picsOf(l.blocks)),
      ...evals.flatMap((e) => picsOf(e.blocks)),
    ], []);
  } catch (e) { log(`  (could not remove some images from Cloudinary: ${e.message})`); }

  await SelfEval.deleteMany({ lesson: { $in: lessons.map((l) => l._id) } });
  await Lesson.deleteMany({ course: { $in: delCourseIds } });
  await Enrollment.deleteMany({ course: { $in: delCourseIds } });
  await Course.deleteMany({ _id: { $in: delCourseIds } });
  await GroupEnrollment.deleteMany({ category: { $in: delCats.map((c) => c._id) } });
  await Category.deleteMany({ _id: { $in: delCats.map((c) => c._id) } });
  invalidateTree();
  log(`✔ Old curriculum removed: ${delCats.length} group(s), ${delCourses.length} course(s), ${lessonCount} lesson(s).`);
  return { groups: delCats.length, courses: delCourses.length, lessons: lessonCount };
}

// `npm run prune` runs this file directly
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { connectDB } = await import('./db.js');
  const mongoose = (await import('mongoose')).default;
  await connectDB();
  await pruneLegacyCurriculum({ apply: process.argv.includes('--apply') });
  await mongoose.disconnect();
}
