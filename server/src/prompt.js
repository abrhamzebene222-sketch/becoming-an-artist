// Prints a ready-to-paste prompt for an AI, pre-filled with the slots you name (revised block model).
//   node src/prompt.js L014 L015 L016 L017 L018
//   node src/prompt.js --course=<slug>
//   node src/prompt.js --chapter=2 --limit=5
import { slots, describe } from './lesson-contract.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const val = (n) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : ''; };
const all = slots();
const ids = args.filter((a) => /^L\d{3}$/i.test(a)).map((a) => a.toUpperCase());

let picked = [];
if (ids.length) picked = all.filter((s) => ids.includes(s.slot));
else if (val('course')) picked = all.filter((s) => s.courseSlug === val('course'));
else if (val('chapter')) picked = all.filter((s) => String(s.chapterNo) === val('chapter'));
const limit = Number(val('limit')) || 0;
if (limit) picked = picked.slice(0, limit);
if (!picked.length) { console.error('No slots matched. Try: node src/prompt.js L001 L002 L003'); process.exit(1); }

const tpl = fs.readFileSync(path.join(here, 'data', 'lessons', 'PROMPT.md'), 'utf8');
const rows = picked.map((s) => `| \`${s.slot}\` | ${s.chapter} | ${s.trail.join(' › ')} | ${s.course} | ${s.index} | ${s.title} | \`${s.courseSlug}\` |`).join('\n');
process.stdout.write(tpl.replace('{{SLOTS}}', rows).replace('{{N}}', String(picked.length)).replace('{{LIST}}', picked.map((s) => s.slot).join(', ')));
console.error(`\n(${picked.length} slot(s) · ${describe(picked[0])} …)`);
