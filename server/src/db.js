import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
// Bundled Windows builds of the SQLite engine (Node 22 and Node 24) so it works without compiling.
const prebuilt = path.join(__dirname, '../node_modules/better-sqlite3/prebuilds',
  `${process.platform}-${process.arch}-node-v${process.versions.modules}.node`);
export const db = new Database(config.dbFile, fs.existsSync(prebuilt) ? { nativeBinding: prebuilt } : {});
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
// Migration: lessons from the old local-PC streaming version are replaced by Cloudinary lessons
const lessonCols = db.prepare("SELECT name FROM pragma_table_info('lessons')").all().map((r) => r.name);
if (lessonCols.length && !lessonCols.includes('cloud_public_id')) {
  console.warn('⚠ Removing old local-file lessons: re-add them by uploading to Cloudinary in Admin › Courses & Media.');
  db.exec('DROP TABLE lessons');
}
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

export const getSetting = (key, fallback = null) =>
  db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value ?? fallback;

export const setSetting = (key, value) =>
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value == null ? null : String(value));

/** Does this user currently have access to a course (purchase or active subscription)? */
export function hasCourseAccess(userId, courseId) {
  const owned = db.prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, courseId);
  if (owned) return true;
  return !!activeSubscription(userId);
}

export function activeSubscription(userId) {
  return db.prepare(
    "SELECT * FROM subscriptions WHERE user_id = ? AND datetime(ends_at) > datetime('now') ORDER BY ends_at DESC LIMIT 1"
  ).get(userId);
}

/**
 * Monthly price = (sum of all published course prices) × (1 − discount%),
 * unless the admin sets a fixed monthly price.
 */
export function pricing() {
  const total = db.prepare('SELECT COALESCE(SUM(price_etb),0) AS t FROM courses WHERE is_published = 1').get().t;
  const discount = Number(getSetting('subscription_discount_percent', 40));
  const fixed = Number(getSetting('subscription_fixed_price_etb', 0));
  const monthly = fixed > 0 ? fixed : Math.round(total * (1 - discount / 100));
  const savingsPercent = total > 0 ? Math.round((1 - monthly / total) * 100) : 0;
  return {
    allCoursesTotal: total,
    discountPercent: discount,
    monthlyPrice: monthly,
    savingsPercent,
    usesFixedPrice: fixed > 0,
    sessionPriceOnline: Number(getSetting('session_price_online_etb', 0)),
    sessionPriceInPerson: Number(getSetting('session_price_in_person_etb', 0)),
  };
}
