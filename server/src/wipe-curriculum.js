// Deletes ONLY curriculum data: categories (chapters/units/sections), courses and lessons.
// Students, payments, enrollments, settings and promos are untouched.
//
//   Dry run (shows what would be deleted):  node src/wipe-curriculum.js
//   Actually delete:                        node src/wipe-curriculum.js --apply
//
// Run it before a fresh `npm run seed` when you want to replace the syllabus.
import { pathToFileURL } from 'node:url';
import { Category, Course, Lesson } from './models/index.js';

const APPLY = process.argv.includes('--apply');

async function wipe() {
  const [cats, courses, lessons] = await Promise.all([
    Category.countDocuments({}), Course.countDocuments({}), Lesson.countDocuments({}),
  ]);
  console.log(`Found ${cats} groups, ${courses} courses, ${lessons} lessons.`);
  if (!APPLY) {
    console.log('Dry run — nothing deleted. Add --apply to delete.');
    return;
  }
  await Lesson.deleteMany({});
  await Course.deleteMany({});
  await Category.deleteMany({});
  console.log('✔ Curriculum deleted. Run `npm run seed` to import the new syllabus.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { connectDB } = await import('./db.js');
  const mongoose = (await import('mongoose')).default;
  await connectDB();
  await wipe();
  await mongoose.disconnect();
}
