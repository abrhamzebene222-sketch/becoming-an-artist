// Places AI-written SELF-EVALUATION documents next to their lessons — the same way import-lessons.js places lessons.
//   node src/import-selfevals.js                 dry run (needs the database)
//   node src/import-selfevals.js --apply         write to MongoDB
//   node src/import-selfevals.js --offline       only check the files, no database
//   node src/import-selfevals.js --apply --force replace documents that already have content
//
// One file per document in src/data/selfevals/ — exactly the same format as a lesson file (see data/lessons/README.md):
//   export default {
//     slot: 'L014',                 // the LESSON this document belongs to (from lesson-slots.csv)
//     course: '<course slug>',      // must match the slot's course slug
//     title: '…', titleAm: '…',     // optional (the lesson keeps its own title)
//     creditHours: 0.5,             // size → price = creditHours × credit-hour rate (Admin › Settings)
//     priceEtb: 30,                 // optional fixed price, used only when creditHours / the rate is not set
//     isPublished: true,            // optional, default true
//     blocks: [ text | heading | step | callout | image | youtube | imageHint ],   // imageHint = admin-only "put a picture here"
//   };
// Picture names ("Chapter / Group / Lesson / Self-Eval 1") are built automatically by the app — nothing to write.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkLesson, lessonFiles, slots, describe } from './lesson-contract.js';

const APPLY = process.argv.includes('--apply');
const OFFLINE = process.argv.includes('--offline');
const FORCE = process.argv.includes('--force');
const here = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(here, 'data', 'selfevals');

const files = lessonFiles(DIR);
const prepared = []; const failed = []; const seen = new Map();

for (const file of files) {
  let data;
  try { data = (await import(pathToFileURL(file).href)).default; }
  catch (e) { failed.push({ file, errors: [`cannot load: ${e.message}`] }); continue; }
  const r = checkLesson(data, file);
  if (!r.ok) { failed.push({ file, errors: r.errors }); continue; }
  if (seen.has(r.lesson.slot)) { failed.push({ file, errors: [`duplicate slot ${r.lesson.slot} (also ${seen.get(r.lesson.slot)})`] }); continue; }
  seen.set(r.lesson.slot, file);
  const fixed = Number(data.priceEtb);
  const priceEtb = Number.isInteger(fixed) && fixed >= 0 && fixed <= 100000 ? fixed : undefined;
  const warnings = r.warnings.map((w) => w
    .replace('the lesson will use the default credit hours from Admin › Settings', 'the document will use its fixed price')
    .replace('the lesson shows the "content coming soon" note', 'the document is empty'));
  prepared.push({ file, doc: { ...r.lesson, priceEtb, isPublished: data.isPublished !== false }, slot: r.slot, warnings });
}

console.log(`\nSelf-eval files: ${files.length}   valid: ${prepared.length}   rejected: ${failed.length}   (folder: src/data/selfevals)`);
console.log(`Mode: ${OFFLINE ? 'OFFLINE (check only)' : APPLY ? 'REAL IMPORT' : 'DRY RUN'}${FORCE ? ' + FORCE' : ''}\n`);
for (const p of prepared) {
  const t = {}; p.doc.blocks.forEach((b) => { t[b.type] = (t[b.type] || 0) + 1; });
  console.log(`✔ ${p.doc.slot}  ${p.doc.title}`);
  console.log(`   blocks: ${p.doc.blocks.length} (${Object.entries(t).map(([k, v]) => `${k}×${v}`).join(' ') || 'none'})`);
  console.log(`   credit hours: ${p.doc.creditHours ?? 'not set (fixed price is used)'}`);
  console.log(`   lesson: ${describe(p.slot)}`);
  p.warnings.forEach((w) => console.log(`   ! ${w}`));
}
for (const f of failed) { console.log(`✖ ${f.file}`); f.errors.forEach((e) => console.log(`   ${e}`)); }
if (failed.length) process.exitCode = 1;

if (OFFLINE || !prepared.length) {
  if (!prepared.length && !OFFLINE) console.log('\nNothing to import.');
  if (OFFLINE) console.log(`\nChecked ${prepared.length} of ${slots().length} possible slots. Nothing written (--offline).`);
  process.exit(process.exitCode || 0);
}

const mongoose = (await import('mongoose')).default;
const { connectDB } = await import('./db.js');
const { Course, Lesson, SelfEval } = await import('./models/index.js');
await connectDB();
console.log(`\nDatabase: ${mongoose.connection.name}`);

const stats = { created: 0, updated: 0, kept: 0, missing: 0 };
try {
  for (const { doc } of prepared) {
    const course = await Course.findOne({ slug: doc.courseSlug }, '_id title');
    const lesson = course
      ? ((await Lesson.findOne({ slot: doc.slot }, '_id title')) || (await Lesson.findOne({ course: course._id, title: doc.title }, '_id title')))
      : null;
    if (!lesson) { console.log(`✖ ${doc.slot}: lesson not found — run the curriculum seed / import-lessons first`); stats.missing += 1; continue; }

    const existing = await SelfEval.findOne({ lesson: lesson._id });
    if (existing?.blocks?.length && !FORCE) {
      const fill = doc.creditHours != null && !(existing.creditHours > 0);
      if (fill && APPLY) await SelfEval.updateOne({ _id: existing._id }, { $set: { creditHours: doc.creditHours } });
      console.log(`= ${doc.slot} kept (already has ${existing.blocks.length} blocks — use --force to replace)${fill ? ` · creditHours ${APPLY ? 'set to' : 'would be'} ${doc.creditHours}` : ''}`);
      stats.kept += 1; continue;
    }
    const set = {
      blocks: doc.blocks, isPublished: doc.isPublished,
      ...(doc.creditHours != null ? { creditHours: doc.creditHours } : {}),
      ...(doc.priceEtb != null ? { priceEtb: doc.priceEtb } : {}),
    };
    if (!APPLY) { console.log(`${existing ? '~' : '+'} ${doc.slot} would be ${existing ? 'updated' : 'created'} → ${lesson.title}`); continue; }
    if (existing) { await SelfEval.updateOne({ _id: existing._id }, { $set: set }); stats.updated += 1; console.log(`~ ${doc.slot} updated (${doc.blocks.length} blocks) → ${lesson.title}`); }
    else { await SelfEval.create({ lesson: lesson._id, ...set }); stats.created += 1; console.log(`+ ${doc.slot} created (${doc.blocks.length} blocks) → ${lesson.title}`); }
  }
  console.log(`\n${APPLY ? 'Imported' : 'Would import'}: ${stats.created} new, ${stats.updated} updated, ${stats.kept} kept.`);
  if (stats.missing) console.log(`✖ ${stats.missing} document(s) could not be placed.`);
  if (!APPLY) console.log('Nothing written. Add --apply to save.');
} finally { await mongoose.disconnect(); }
