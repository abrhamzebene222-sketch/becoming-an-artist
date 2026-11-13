// Cloudinary: lesson videos/PDFs and payment screenshots, all stored as PRIVATE ("authenticated") assets.
// Nothing is kept on the server's disk, so it works on Render (whose disk is wiped on every deploy).
import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';

const c = config.cloudinary;
cloudinary.config({ cloud_name: c.cloudName, api_key: c.apiKey, api_secret: c.apiSecret, secure: true });

export { cloudinary };
export const LESSON_FOLDER = `${c.folder}/lessons`;
export const RECEIPT_FOLDER = `${c.folder}/receipts`;
export const isConfigured = () => !!(c.cloudName && c.apiKey && c.apiSecret);

// One optimised MP4: max 1280 px wide, automatic quality. Generated right after upload ("eager").
const VIDEO_TRANSFORM = { width: 1280, crop: 'limit', quality: 'auto' };
export const EAGER_VIDEO = `${cloudinary.utils.generate_transformation_string({ ...VIDEO_TRANSFORM })}/mp4`;

const accessOptions = (deliveryType) => {
  if (c.authTokenKey && deliveryType === 'authenticated') {
    return { type: deliveryType, auth_token: { key: c.authTokenKey, duration: 2 * 60 * 60 } };
  }
  return { type: deliveryType, sign_url: deliveryType !== 'upload' };
};

/** Signed, playable URL for a lesson (MP4 for videos, PDF for documents). */
export function lessonUrl(lesson) {
  const base = { resource_type: lesson.cloudResourceType, ...accessOptions(lesson.cloudDeliveryType) };
  if (lesson.kind === 'video') return cloudinary.url(lesson.cloudPublicId, { ...base, transformation: [VIDEO_TRANSFORM], format: 'mp4' });
  return cloudinary.url(lesson.cloudPublicId, { ...base, format: 'pdf' });
}

export function posterUrl(lesson) {
  if (lesson.kind !== 'video') return null;
  return cloudinary.url(lesson.cloudPublicId, {
    resource_type: 'video', ...accessOptions(lesson.cloudDeliveryType),
    transformation: [{ start_offset: 'auto', width: 1280, crop: 'limit', quality: 'auto' }], format: 'jpg',
  });
}

/** Signature that lets the admin's browser upload a lesson straight to Cloudinary (the secret never leaves the server). */
export function signUpload(kind) {
  const params = {
    timestamp: Math.round(Date.now() / 1000),
    folder: LESSON_FOLDER,
    type: 'authenticated',
    ...(kind === 'video' ? { eager: EAGER_VIDEO, eager_async: true } : {}),
  };
  return {
    cloudName: c.cloudName,
    apiKey: c.apiKey,
    resourceType: kind === 'video' ? 'video' : 'image',
    params,
    signature: cloudinary.utils.api_sign_request(params, c.apiSecret),
  };
}

/** Find an existing asset (e.g. uploaded on the Cloudinary website). Tries private first, then public. */
export async function findAsset(publicId, resourceType) {
  for (const type of ['authenticated', 'upload', 'private']) {
    try {
      const r = await cloudinary.api.resource(publicId, { resource_type: resourceType, type });
      return { deliveryType: type, bytes: r.bytes, duration: r.duration ? Math.round(r.duration) : null };
    } catch { /* try the next type */ }
  }
  return null;
}

/** Upload a payment screenshot (from memory) as a private image. Returns its public_id. */
export function uploadReceipt(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: RECEIPT_FOLDER, type: 'authenticated', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result.public_id)),
    );
    stream.end(buffer);
  });
}

/** Signed link to view a receipt (only ever sent to admins). */
export const receiptUrl = (publicId) =>
  cloudinary.url(publicId, { resource_type: 'image', type: 'authenticated', sign_url: true, secure: true });

export const deleteReceipt = (publicId) =>
  cloudinary.uploader.destroy(publicId, { resource_type: 'image', type: 'authenticated' }).catch(() => {});
