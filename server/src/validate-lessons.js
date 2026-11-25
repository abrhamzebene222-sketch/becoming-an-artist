// Checks every lesson file offline — no database needed.
//   node src/validate-lessons.js
//   node src/validate-lessons.js --dir=other/dir --quiet
// Exit code 1 when any file has an error.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkLesson, lessonFiles, slots, LESSONS_DIR, BLOCK_TYPES } from './lesson-contract.js';

const arg = (n) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : ''; };
const QUIET = process.argv.includes('--quiet');
const dir = arg('dir') ? path.resolve(process.cwd(), arg('dir')) : LESSONS_DIR;
const total = slots().length;
const files = lessonFiles(dir);

console.log(`\nLesson files: ${files.length}   Slots: ${total}   Folder: ${path.relative(process.cwd(), dir) || dir}`);
console.log(`Block types: ${BLOCK_TYPES.join(', ')}\n`);
if (!files.length) { console.log('No .js files yet — copy the AI output here first.'); process.exit(0); }

const seen = new Map();
let errors = 0, warnings = 0, blocks = 0, hoursTotal = 0, withHours = 0;
const tally = {};

for (const file of files) {
  const rel = path.relative(dir, file);
  let data;
  try { data = (await import(pathToFileURL(file).href)).default; }
  catch (e) { console.log(`✖ ${rel}\n    cannot load: ${e.message}`); errors += 1; continue; }

  const r = checkLesson(data, file);
  if (r.lesson) {
    const prev = seen.get(r.lesson.slot);
    if (prev) r.errors.push(`duplicate slot ${r.lesson.slot} — also in ${prev}`);
    else seen.set(r.lesson.slot, rel);
    blocks += r.lesson.blocks.length;
    if (r.lesson.creditHours != null) { hoursTotal += r.lesson.creditHours; withHours += 1; }
    r.lesson.blocks.forEach((b) => { tally[b.type] = (tally[b.type] || 0) + 1; });
  }
  errors += r.errors.length; warnings += r.warnings.length;
  const mark = r.errors.length ? '✖' : r.warnings.length ? '!' : '✔';
  console.log(`${mark} ${rel}`);
  console.log(`    ${r.lesson ? `${r.lesson.slot}  ${r.lesson.title}` : '(no slot)'} — ${r.lesson ? r.lesson.blocks.length : 0} blocks · ${r.lesson?.creditHours != null ? `${r.lesson.creditHours} credit h` : 'no credit hours'}`);
  if (r.slot) console.log(`    → ${r.slot.trail.join(' › ')} › ${r.slot.course}, lesson ${r.slot.index}`);
  if (!QUIET) r.warnings.forEach((w) => console.log(`    ! ${w}`));
  r.errors.forEach((e) => console.log(`    ✖ ${e}`));
}

const kinds = Object.entries(tally).map(([k, v]) => `${k}×${v}`).join(' ') || 'none';
console.log(`\n${errors ? '✖' : '✔'} ${files.length} file(s), ${blocks} block(s) [${kinds}], ${errors} error(s), ${warnings} warning(s).`);
console.log(`   Credit hours: ${withHours}/${files.length} lesson(s) have them — ${Math.round(hoursTotal * 100) / 100} credit hours in total (× your rate = the price)`);
console.log(`   Filled slots: ${seen.size}/${total}  (${total - seen.size} empty → "coming soon")`);
console.log(errors ? '   Fix the ✖ lines, then run again.' : '   Next: node src/import-lessons.js --apply');
if (errors) process.exitCode = 1;
