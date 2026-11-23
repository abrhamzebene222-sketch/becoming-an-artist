// One-time (re-runnable) content importer. Reads EVERY file in server/src/data/ and adds:
//   • new groups / sub-groups / courses (with lessons)
//   • extra lessons inside courses you ALREADY have (matched by slug; the course itself is never changed)
//   • the Ethiopian iconography sub-groups inside your existing iconography major group
// Anything already there (same slug / same lesson title) is skipped — your edits are never overwritten.
//
//   Dry run (changes nothing):  node src/import-content.js
//   Real import:                node src/import-content.js --apply
//   Optional:  --group="Exact title of iconography major group"   --free
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { connectDB } from './db.js';
import { Category, Course, Lesson } from './models/index.js';

const APPLY = process.argv.includes('--apply');
const FREE = process.argv.includes('--free');
const groupArg = (process.argv.find((a) => a.startsWith('--group=')) || '').slice(8).trim();
const log = (...a) => console.log(...a);
const stats = { groups: 0, courses: 0, lessons: 0, sGroups: 0, sCourses: 0, sLessons: 0 };
const known = new Map(); // slug -> category document (or a stand-in during a dry run)

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const batches = [];
for (const f of fs.readdirSync(dataDir).filter((x) => x.endsWith('.js')).sort()) {
  batches.push({ file: f, data: (await import(pathToFileURL(path.join(dataDir, f)).href)).default });
}

await connectDB();
log(`\nDatabase: ${mongoose.connection.name}   Mode: ${APPLY ? 'REAL IMPORT' : 'DRY RUN (nothing is written)'}`);
log(`Data files: ${batches.map((b) => b.file).join(', ')}\n`);

async function findCat(slug) {
  if (known.has(slug)) return known.get(slug);
  const d = await Category.findOne({ slug });
  if (d) known.set(slug, d);
  return d;
}

async function addLessons(course, lessons, indent) {
  const real = course && !course.virtual;
  const last = real ? await Lesson.findOne({ course: course._id }).sort({ sortOrder: -1 }) : null;
  const hadAny = !!last;
  let next = (last?.sortOrder ?? -1) + 1;
  for (const [li, ls] of lessons.entries()) {
    const exists = real ? await Lesson.findOne({ course: course._id, title: ls.title }) : null;
    if (exists) { stats.sLessons += 1; continue; }
    stats.lessons += 1; log(`${indent}+ lesson: ${ls.title}`);
    if (APPLY && real) {
      await Lesson.create({ course: course._id, title: ls.title, kind: 'blocks', blocks: ls.blocks, sortOrder: next, isPreview: !hadAny && li === 0 });
      next += 1;
    }
  }
}

async function addCourse(co, cat, ci, indent) {
  const { lessons = [], ...coData } = co;
  const total = (co.evaluationCriteria || []).reduce((n, x) => n + x.weight, 0);
  if (total !== 100) log(`${indent}⚠ criteria weights of "${co.title}" add up to ${total}, not 100`);
  let course = await Course.findOne({ slug: co.slug });
  if (course) { stats.sCourses += 1; log(`${indent}= course exists: ${co.title}`); }
  else {
    stats.courses += 1; log(`${indent}+ course: ${co.title}  (${lessons.length} lessons${lessons.length ? '' : ' — will stay hidden until it has lessons'})`);
    if (APPLY && cat && !cat.virtual) {
      const last = await Course.findOne({ category: cat._id }).sort({ sortOrder: -1 });
      course = await Course.create({ ...coData, category: cat._id, sortOrder: (last?.sortOrder ?? -1) + 1, isFree: FREE, priceEtb: 0, isPublished: lessons.length > 0 });
    } else course = { virtual: true };
  }
  await addLessons(course, lessons, `${indent}    `);
}

async function addGroup(node, parent, gi, indent = '') {
  const { courses = [], children = [], parentSlug, ...data } = node;
  let cat = await findCat(node.slug);
  if (cat) { stats.sGroups += 1; log(`${indent}= group exists: ${node.title}`); }
  else {
    stats.groups += 1; log(`${indent}+ ${parent ? 'sub-group' : 'MAJOR GROUP'}: ${node.title}`);
    if (APPLY) {
      const pid = parent && !parent.virtual ? parent._id : null;
      const last = await Category.findOne({ parent: pid }).sort({ sortOrder: -1 });
      cat = await Category.create({ ...data, parent: pid, sortOrder: (last?.sortOrder ?? -1) + 1, isFree: FREE, priceEtb: 0 });
    } else cat = { virtual: true, title: node.title };
    known.set(node.slug, cat);
  }
  for (const [ci, co] of courses.entries()) await addCourse(co, cat, ci, `${indent}  `);
  for (const [i, ch] of children.entries()) await addGroup(ch, cat, i, `${indent}  `);
}

try {
  const majors = await Category.find({ parent: null }).sort({ sortOrder: 1 });
  log('Major groups already in your app:');
  majors.forEach((m) => log(`  - ${m.title}  |  ${m.titleAm || ''}  (slug: ${m.slug})`));
  log('');

  for (const { file, data } of batches) {
    log(`──── ${file} ────`);

    if (data.subgroups?.length) {
      const cands = groupArg ? majors.filter((m) => m.title === groupArg || m.titleAm === groupArg)
        : majors.filter((m) => /iconograph|ሥዕላት|ስዕላት/i.test(`${m.title} ${m.titleAm || ''}`));
      if (cands.length !== 1) {
        log(`✖ Could not pick ONE iconography major group (${cands.length} matched). Re-run with --group="exact title". Skipping the iconography part.`);
        process.exitCode = 1;
      } else {
        log(`Iconography major group: ${cands[0].title}`);
        for (const [i, sg] of data.subgroups.entries()) await addGroup(sg, cands[0], i);
      }
    }

    for (const g of data.groups || []) {
      let parent = null;
      if (g.parentSlug) {
        parent = await findCat(g.parentSlug);
        if (!parent) { log(`✖ Parent group "${g.parentSlug}" not found — skipped "${g.title}". Tell Claude which group it should go under.`); continue; }
      }
      await addGroup(g, parent, 0);
    }

    for (const ex of data.existingCourses || []) {
      const course = await Course.findOne({ slug: ex.slug });
      if (!course) { log(`✖ Existing course "${ex.slug}" not found — its ${ex.lessons.length} lessons were skipped.`); continue; }
      log(`Adding lessons to existing course: ${course.title}`);
      await addLessons(course, ex.lessons, '    ');
    }
  }

  log(`\n${APPLY ? 'Created' : 'Would create'}: ${stats.groups} groups, ${stats.courses} courses, ${stats.lessons} lessons.`);
  log(`Skipped (already there): ${stats.sGroups} groups, ${stats.sCourses} courses, ${stats.sLessons} lessons.`);
  if (!APPLY) log('\nNothing was changed. Add --apply to really import.');
} finally {
  await mongoose.disconnect();
}
