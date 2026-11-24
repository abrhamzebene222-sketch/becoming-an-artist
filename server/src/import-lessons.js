// Places lesson files into the exact slot of the course tree (revised schema + 6 block types).
//   node src/import-lessons.js                 dry run (needs DB)
//   node src/import-lessons.js --apply         write to MongoDB
//   node src/import-lessons.js --offline       resolve file → slot only, no database
//   node src/import-lessons.js --apply --force replace lessons that already have content
import { pathToFileURL } from 'node:url';
import { checkLesson, lessonFiles, slots, describe } from './lesson-contract.js';

const APPLY = process.argv.includes('--apply');
const OFFLINE = process.argv.includes('--offline');
const FORCE = process.argv.includes('--force');

const files = lessonFiles();
const total = slots().length;
const prepared = [], failed = [], seen = new Map();

for (const file of files) {
  let data;
  try { data = (await import(pathToFileURL(file).href)).default; }
  catch (e) { failed.push({ file, errors: [`cannot load: ${e.message}`] }); continue; }
  const r = checkLesson(data, file);
  if (!r.ok) { failed.push({ file, errors: r.errors }); continue; }
  if (seen.has(r.lesson.slot)) { failed.push({ file, errors: [`duplicate slot ${r.lesson.slot} (also ${seen.get(r.lesson.slot)})`] }); continue; }
  seen.set(r.lesson.slot, file);
  prepared.push({ file, lesson: r.lesson, slot: r.slot, warnings: r.warnings });
}

console.log(`\nFiles: ${files.length}   valid: ${prepared.length}   rejected: ${failed.length}`);
console.log(`Mode: ${OFFLINE ? 'OFFLINE (resolve only)' : APPLY ? 'REAL IMPORT' : 'DRY RUN'}${FORCE ? ' + FORCE' : ''}\n`);

for (const p of prepared) {
  const t = {};
  p.lesson.blocks.forEach((b) => { t[b.type] = (t[b.type] || 0) + 1; });
  console.log(`✔ ${p.lesson.slot}  ${p.lesson.title}`);
  console.log(`   blocks: ${p.lesson.blocks.length} (${Object.entries(t).map(([k, v]) => `${k}×${v}`).join(' ') || 'none'})`);
  console.log(`   slot  : ${describe(p.slot)}`);
  console.log(`   course: ${p.slot.courseSlug}  →  sortOrder ${p.lesson.position - 1}`);
  p.warnings.forEach((w) => console.log(`   ! ${w}`));
}
for (const f of failed) { console.log(`✖ ${f.file}`); f.errors.forEach((e) => console.log(`   ${e}`)); }
if (failed.length) process.exitCode = 1;

if (OFFLINE) {
  console.log(`\nResolved ${prepared.length} of ${total} slots. Nothing written (--offline).`);
  process.exit(process.exitCode || 0);
}
if (!prepared.length) { console.log('\nNothing to import.'); process.exit(process.exitCode || 0); }

const mongoose = (await import('mongoose')).default;
const { connectDB } = await import('./db.js');
const { Course, Lesson } = await import('./models/index.js');
await connectDB();
console.log(`\nDatabase: ${mongoose.connection.name}`);

const stats = { created: 0, updated: 0, kept: 0, missingCourse: 0 };
try {
  for (const { lesson } of prepared) {
    const course = await Course.findOne({ slug: lesson.courseSlug });
    if (!course) {
      console.log(`✖ ${lesson.slot}: course "${lesson.courseSlug}" not found — run the curriculum seed first`);
      stats.missingCourse += 1; continue;
    }
    const existing = (await Lesson.findOne({ slot: lesson.slot }))
      || (await Lesson.findOne({ course: course._id, title: lesson.title }));

    if (existing && existing.blocks?.length && !FORCE) {
      console.log(`= ${lesson.slot} kept (already has ${existing.blocks.length} blocks — use --force to replace)`);
      stats.kept += 1; continue;
    }
    const doc = {
      course: course._id,
      slot: lesson.slot,
      title: lesson.title,
      titleAm: lesson.titleAm || undefined,
      kind: 'blocks',
      blocks: lesson.blocks,
      sortOrder: Math.max(0, (lesson.position || 1) - 1),
    };
    if (!APPLY) { console.log(`${existing ? '~' : '+'} ${lesson.slot} would be ${existing ? 'updated' : 'created'} → ${course.title}`); continue; }
    if (existing) {
      await Lesson.updateOne({ _id: existing._id }, { $set: doc });
      console.log(`~ ${lesson.slot} updated (${lesson.blocks.length} blocks) → ${course.title}`);
      stats.updated += 1;
    } else {
      await Lesson.create({ ...doc, isPreview: lesson.isPreview });
      console.log(`+ ${lesson.slot} created (${lesson.blocks.length} blocks) → ${course.title}`);
      stats.created += 1;
    }
  }
  console.log(`\n${APPLY ? 'Imported' : 'Would import'}: ${stats.created} new, ${stats.updated} updated, ${stats.kept} kept.`);
  if (stats.missingCourse) console.log(`✖ ${stats.missingCourse} lesson(s) could not be placed.`);
  if (!APPLY) console.log('Nothing written. Add --apply to save.');
} finally { await mongoose.disconnect(); }
