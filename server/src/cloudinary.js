// Cloudinary — now with MULTIPLE accounts.
// • The account from the environment (.env / Render) is kept as "env" (works exactly like before).
// • Extra accounts are added/edited/removed by the admin in Admin › Cloudinary accounts (stored in MongoDB).
// • One account can be marked "primary" and one "secondary"; uploads pick one of them (or a specific id).
// • Every stored media reference keeps the id of its account, so URLs, overwrites and deletes always hit the right cloud.
// Nothing is kept on the server's disk (memory uploads only), so it works on Render.
import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';
import { CloudinaryAccount } from './models/index.js';
import { decrypt } from './secret.js';

const c = config.cloudinary;
cloudinary.config({ cloud_name: c.cloudName, api_key: c.apiKey, api_secret: c.apiSecret, secure: true });

export { cloudinary };

const ENV = c.cloudName && c.apiKey && c.apiSecret
  ? { id: 'env', label: 'Environment (.env)', cloudName: c.cloudName, apiKey: c.apiKey, apiSecret: c.apiSecret, role: 'env', folder: c.folder, isActive: true, fromEnv: true }
  : null;

// ---------- Account registry (cached 30 s, refreshed after every admin change) ----------
let cache = null;
let cachedAt = 0;
async function dbAccounts() {
  if (cache && Date.now() - cachedAt < 30_000) return cache;
  const rows = await CloudinaryAccount.find().sort({ createdAt: 1 }).lean();
  cache = rows.map((r) => ({
    id: String(r._id), label: r.label, cloudName: r.cloudName, apiKey: r.apiKey, apiSecret: decrypt(r.apiSecretEnc),
    role: r.role, folder: r.folder || c.folder, isActive: r.isActive !== false,
  }));
  cachedAt = Date.now();
  return cache;
}
export const invalidateAccounts = () => { cache = null; };

/** All usable accounts (env first). Secrets included — never send this list to the browser. */
export async function listAccounts() {
  return [...(ENV ? [ENV] : []), ...(await dbAccounts())];
}

/**
 * Pick the account for a NEW upload.
 * sel: 'primary' | 'secondary' | 'env' | <account id>. Falls back to primary → env → first active account.
 */
export async function resolveAccount(sel = 'primary') {
  const db = (await dbAccounts()).filter((a) => a.isActive);
  if (sel === 'env' && ENV) return ENV;
  if (sel && !['primary', 'secondary', 'env'].includes(sel)) {
    const a = db.find((x) => x.id === String(sel));
    if (a) return a;
  }
  if (sel === 'secondary') {
    const s = db.find((x) => x.role === 'secondary');
    if (s) return s;
  }
  return db.find((x) => x.role === 'primary') || ENV || db[0] || null;
}

/** The account that holds an EXISTING file (inactive accounts still count, so old files keep working). */
export async function accountFor(id) {
  if (!id || id === 'env') return ENV || resolveAccount('primary');
  const a = (await dbAccounts()).find((x) => x.id === String(id));
  return a || ENV || resolveAccount('primary');
}

export const isConfigured = async () => !!(await resolveAccount('primary'));

const creds = (acc) => ({ cloud_name: acc.cloudName, api_key: acc.apiKey, api_secret: acc.apiSecret, secure: true });
const folderOf = (acc, sub) => `${acc.folder || c.folder}/${sub}`;

export const LESSON_FOLDER = `${c.folder}/lessons`;
export const RECEIPT_FOLDER = `${c.folder}/receipts`;

// One optimised MP4: max 1280 px wide, automatic quality. Generated right after upload ("eager").
const VIDEO_TRANSFORM = { width: 1280, crop: 'limit', quality: 'auto' };
export const EAGER_VIDEO = `${cloudinary.utils.generate_transformation_string({ ...VIDEO_TRANSFORM })}/mp4`;

const accessOptions = (deliveryType, acc) => {
  // Token auth (paid plans) is configured for the env account only
  if (acc?.fromEnv && c.authTokenKey && deliveryType === 'authenticated') {
    return { type: deliveryType, auth_token: { key: c.authTokenKey, duration: 2 * 60 * 60 } };
  }
  return { type: deliveryType, sign_url: deliveryType !== 'upload' };
};

/** Signed, playable URL for a lesson (MP4 for videos, PDF for documents). */
export function lessonUrl(lesson, acc) {
  const base = { ...creds(acc), resource_type: lesson.cloudResourceType, ...accessOptions(lesson.cloudDeliveryType, acc) };
  if (lesson.kind === 'video') return cloudinary.url(lesson.cloudPublicId, { ...base, transformation: [VIDEO_TRANSFORM], format: 'mp4' });
  return cloudinary.url(lesson.cloudPublicId, { ...base, format: 'pdf' });
}

export function posterUrl(lesson, acc) {
  if (lesson.kind !== 'video') return null;
  return cloudinary.url(lesson.cloudPublicId, {
    ...creds(acc), resource_type: 'video', ...accessOptions(lesson.cloudDeliveryType, acc),
    transformation: [{ start_offset: 'auto', width: 1280, crop: 'limit', quality: 'auto' }], format: 'jpg',
  });
}

/** Signature that lets the admin's browser upload a lesson straight to the chosen Cloudinary account. */
export function signUpload(kind, acc) {
  const params = {
    timestamp: Math.round(Date.now() / 1000),
    folder: folderOf(acc, 'lessons'),
    type: 'authenticated',
    ...(kind === 'video' ? { eager: EAGER_VIDEO, eager_async: true } : {}),
  };
  return {
    account: acc.id,
    cloudName: acc.cloudName,
    apiKey: acc.apiKey,
    resourceType: kind === 'video' ? 'video' : 'image',
    params,
    signature: cloudinary.utils.api_sign_request(params, acc.apiSecret),
  };
}

/** Find an existing asset (e.g. uploaded on the Cloudinary website). Tries private first, then public. */
export async function findAsset(publicId, resourceType, acc) {
  for (const type of ['authenticated', 'upload', 'private']) {
    try {
      const r = await cloudinary.api.resource(publicId, { ...creds(acc), resource_type: resourceType, type });
      return { deliveryType: type, bytes: r.bytes, duration: r.duration ? Math.round(r.duration) : null };
    } catch { /* try the next type */ }
  }
  return null;
}

const streamUpload = (buffer, options) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(options, (err, result) => (err ? reject(err) : resolve(result)));
  stream.end(buffer);
});

/** Upload a payment screenshot (from memory) as a private image on the primary account. */
export async function uploadReceipt(buffer) {
  const acc = await resolveAccount('primary');
  const r = await streamUpload(buffer, { ...creds(acc), folder: folderOf(acc, 'receipts'), type: 'authenticated', resource_type: 'image' });
  return { publicId: r.public_id, account: acc.id };
}

/** Signed link to view a receipt (only ever sent to admins). */
export const receiptUrl = (publicId, acc) =>
  cloudinary.url(publicId, { ...creds(acc), resource_type: 'image', type: 'authenticated', sign_url: true, secure: true });

export const deleteReceipt = async (publicId, accountId) => {
  const acc = await accountFor(accountId);
  if (acc) await cloudinary.uploader.destroy(publicId, { ...creds(acc), resource_type: 'image', type: 'authenticated', invalidate: true }).catch(() => {});
};

/**
 * Upload a PUBLIC image (category slides, promo/news images, lesson block images).
 * If `replace` (an old media object) lives on the same account, the file is OVERWRITTEN in place (same public_id,
 * CDN cache invalidated). Otherwise the new file is uploaded and the old one is DESTROYED on its own account.
 */
export async function uploadImage(buffer, { account = 'primary', folder = 'misc', replace } = {}) {
  const acc = await resolveAccount(account);
  if (!acc) { const e = new Error('cloudinaryKeys'); e.code = 'cloudinaryKeys'; throw e; }
  const overwrite = !!(replace?.publicId && String(replace.account || 'env') === acc.id);
  const r = await streamUpload(buffer, {
    ...creds(acc),
    resource_type: 'image',
    type: 'upload',
    ...(overwrite ? { public_id: replace.publicId, overwrite: true, invalidate: true } : { folder: folderOf(acc, folder) }),
    transformation: [{ width: 2400, height: 2400, crop: 'limit', quality: 'auto' }],
  });
  if (replace?.publicId && !overwrite) await destroyMedia(replace);
  return { url: r.secure_url, publicId: r.public_id, account: acc.id, resourceType: 'image' };
}

/** Upload a generated file (e.g. assignment PDF) as a raw asset. */
export async function uploadRaw(buffer, { folder = 'assignments', filename } = {}) {
  const acc = await resolveAccount('primary');
  if (!acc) return null;
  const r = await streamUpload(buffer, {
    ...creds(acc), resource_type: 'raw', type: 'upload', folder: folderOf(acc, folder),
    ...(filename ? { public_id: filename } : {}),
  });
  return { url: r.secure_url, publicId: r.public_id, account: acc.id, resourceType: 'raw' };
}

/** Delete a stored media object from its Cloudinary account (ignores missing files). */
export async function destroyMedia(media) {
  if (!media?.publicId) return;
  const acc = await accountFor(media.account);
  if (!acc) return;
  await cloudinary.uploader.destroy(media.publicId, {
    ...creds(acc), resource_type: media.resourceType || 'image', type: 'upload', invalidate: true,
  }).catch((e) => console.warn('Cloudinary destroy failed:', media.publicId, e.message));
}

const mediaKey = (m) => `${m?.account || 'env'}::${m?.publicId}`;

/** Destroy every media object that was in `before` but is no longer in `after` (auto-delete on replace/remove). */
export async function syncMedia(before = [], after = []) {
  const keep = new Set(after.filter((m) => m?.publicId).map(mediaKey));
  await Promise.all(before.filter((m) => m?.publicId && !keep.has(mediaKey(m))).map(destroyMedia));
}

/** Delete a lesson's private file (video/PDF). */
export async function destroyLessonFile(lesson) {
  if (!lesson?.cloudPublicId) return;
  const acc = await accountFor(lesson.cloudAccount);
  if (!acc) return;
  await cloudinary.uploader.destroy(lesson.cloudPublicId, {
    ...creds(acc), resource_type: lesson.cloudResourceType, type: lesson.cloudDeliveryType || 'authenticated', invalidate: true,
  }).catch(() => {});
}

/** Check that a set of credentials works (Admin › Cloudinary accounts › Test). */
export async function pingAccount(acc) {
  try {
    await cloudinary.api.ping(creds(acc));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.error?.message || e.message || 'Failed' };
  }
}
