// Seeds the academic curriculum, default contacts, settings and the admin account.
// Safe to run on every start — it only inserts what is missing and never overwrites your edits.
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { Category, Course, Lesson, ContactInfo, SubmissionLink, Setting, User, Promo } from './models/index.js';
import { DEFAULT_TIERS } from './lib.js';
import { config } from './config.js';
import { CURRICULUM } from './curriculum.js';
import { pruneLegacyCurriculum } from './prune-legacy.js';

// Walks the curriculum tree (see curriculum.js for the shape).
//   node with `children` -> Category (chapter / unit / section / studio)
//   node with `lessons`  -> Course inside the parent Category + one empty Lesson per title
// Nothing is ever overwritten: existing slugs / lesson titles are skipped, so titles and
// lesson content you edit in the admin panel survive every restart.
async function seedTree(nodes, parent = null) {
  const counts = { groups: 0, courses: 0, lessons: 0 };
  for (const [i, node] of nodes.entries()) {
    const { children, lessons: lessonTitles, ...data } = node;

    // ---- leaf node = course ----
    if (lessonTitles?.length) {
      if (!parent) continue;
      let course = await Course.findOne({ slug: data.slug });
      if (!course) {
        course = await Course.create({
          ...data, category: parent._id, sortOrder: i,
          priceEtb: 0, isFree: false, isPublished: true,
        });
        counts.courses += 1;
      }
      for (const [j, l] of lessonTitles.entries()) {
        if (await Lesson.exists({ course: course._id, title: l.title })) continue;
        await Lesson.create({
          course: course._id,
          title: l.title,
          titleAm: l.titleAm || undefined,
          kind: 'blocks',
          blocks: [],            // empty on purpose — content is added later
          isPreview: j === 0,    // first lesson of every course is a free preview
          sortOrder: j,
        });
        counts.lessons += 1;
      }
      continue;
    }

    // ---- group node = category ----
    let category = await Category.findOne({ slug: data.slug });
    if (!category) {
      category = await Category.create({ ...data, parent: parent ? parent._id : null, sortOrder: i });
      counts.groups += 1;
    }
    if (children?.length) {
      const sub = await seedTree(children, category);
      counts.groups += sub.groups;
      counts.courses += sub.courses;
      counts.lessons += sub.lessons;
    }
  }
  return counts;
}

const DEFAULT_SETTINGS = {
  subscriptionDiscountPercent: 40,
  subscriptionFixedPriceEtb: 0,
  sessionPriceOnlineEtb: 0,
  sessionPriceInPersonEtb: 0,
  cbeAccountName: '',
  cbeAccountNumber: '',
  telebirrName: '',
  telebirrNumber: '+251913516032',
  subscriptionTiers: DEFAULT_TIERS,
};

// 3 promo boards x 2 flipping units — all editable in Admin > Promo boards
const DEFAULT_PROMOS = [
  { board: 1, slot: 0, title: 'Daily news', titleAm: 'የዕለቱ ዜና', description: 'Course announcements appear here.', descriptionAm: 'የኮርስ ማስታወቂያዎች እዚህ ይታያሉ።' },
  { board: 1, slot: 1, title: 'New lessons every week', titleAm: 'በየሳምንቱ አዳዲስ ትምህርቶች', description: '', descriptionAm: '' },
  { board: 2, slot: 0, title: 'Join our Telegram channel', titleAm: 'የቴሌግራም ቻናላችንን ይቀላቀሉ', description: 'Tips, critiques and community challenges.', descriptionAm: 'ምክሮች፣ ግምገማዎች እና የማህበረሰብ ውድድሮች።', linkUrl: 'https://t.me/ArtistAbrham', linkLabel: 'Join', linkLabelAm: 'ይቀላቀሉ' },
  { board: 2, slot: 1, title: 'Share your artwork', titleAm: 'ስራዎን ያጋሩ', description: 'Post your work in the community group.', descriptionAm: 'ስራዎን በማህበረሰብ ቡድኑ ውስጥ ያጋሩ።' },
  { board: 3, slot: 0, title: 'Share the app, earn course credit', titleAm: 'መተግበሪያውን አጋርተው የኮርስ ክሬዲት ያግኙ', description: 'Invite 10, 20, 50 or 100 friends through our Telegram bot.', descriptionAm: '10፣ 20፣ 50 ወይም 100 ጓደኞችን በቴሌግራም ቦታችን ይጋብዙ።' },
  { board: 3, slot: 1, title: 'Sponsored rewards', titleAm: 'የስፖንሰር ሽልማቶች', description: 'Partner campaigns with special rewards.', descriptionAm: 'ልዩ ሽልማት ያላቸው የአጋር ዘመቻዎች።' },
];

export async function seed() {
  const counts = await seedTree(CURRICULUM);
  if (counts.groups || counts.courses || counts.lessons) {
    console.log(`✔ Curriculum: +${counts.groups} groups, +${counts.courses} courses, +${counts.lessons} lessons`);
  }

  // Remove the OLD starter courses/groups that are not in curriculum.js (they used to come back after every deploy).
  // Real curriculum, content you wrote and anything students bought are never touched. Turn off: PRUNE_LEGACY=off
  if (String(process.env.PRUNE_LEGACY || 'on').toLowerCase() !== 'off') {
    try { await pruneLegacyCurriculum({ apply: true, quiet: true }); }
    catch (e) { console.warn('⚠ Legacy cleanup skipped:', e.message); }
  }

  if (!(await ContactInfo.exists({}))) {
    await ContactInfo.insertMany([
      { kind: 'email', label: 'Email', value: 'Artistabrham@gmail.com', sortOrder: 0 },
      { kind: 'phone', label: 'Phone', value: '+251913516032', sortOrder: 1 },
      { kind: 'telegram', label: 'Telegram', value: '@ArtistAbrham', sortOrder: 2 },
    ]);
  }
  if (!(await SubmissionLink.exists({}))) {
    await SubmissionLink.insertMany([
      { kind: 'telegram', label: 'Telegram', url: 'https://t.me/ArtistAbrham', isDefault: true },
      { kind: 'email', label: 'Email', url: 'mailto:Artistabrham@gmail.com', isDefault: false },
    ]);
  }
  for (const p of DEFAULT_PROMOS) {
    await Promo.updateOne({ board: p.board, slot: p.slot }, { $setOnInsert: p }, { upsert: true });
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await Setting.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true });
  }

  // First admin account (from ADMIN_EMAIL / ADMIN_PASSWORD). More admins: set role "admin" in Atlas.
  if (!(await User.exists({ role: /^admin$/i }))) {
    if (!config.admin.password || config.admin.password.length < 8) {
      console.warn('⚠ Set ADMIN_PASSWORD (8+ characters) to create the admin account.');
    } else {
      const existing = await User.findOne({ email: config.admin.email });
      if (existing) await User.updateOne({ _id: existing._id }, { role: 'admin' });
      else await User.create({ name: config.admin.name, email: config.admin.email, role: 'admin', passwordHash: await bcrypt.hash(config.admin.password, 12) });
      console.log(`✔ Admin account ready for ${config.admin.email}`);
    }
  }
}

// `npm run seed` runs this file directly
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { connectDB } = await import('./db.js');
  const mongoose = (await import('mongoose')).default;
  await connectDB();
  await seed();
  console.log('✔ Seed complete');
  await mongoose.disconnect();
}
