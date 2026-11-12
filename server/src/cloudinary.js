// Cloudinary video/PDF hosting.
// Lessons are uploaded as PRIVATE ("authenticated") assets: they can only be opened through
// signed URLs, and this server only signs a URL for a student who has access to that lesson.
import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';

const c = config.cloudinary;
cloudinary.config({ cloud_name: c.cloudName, api_key: c.apiKey, api_secret: c.apiSecret, secure: true });

export { cloudinary };
export const FOLDER = c.folder;

// One optimised MP4 rendition: max 1280px wide, automatic quality (smaller files on slow connections).
// It is generated once right after upload ("eager"), so students never wait for processing.
const VIDEO_TRANSFORM = { width: 1280, crop: 'limit', quality: 'auto' };
export const EAGER_VIDEO = `${cloudinary.utils.generate_transformation_string({ ...VIDEO_TRANSFORM })}/mp4`;

const accessOptions = (deliveryType) => {
  // With Cloudinary token-based authentication (higher plans), links also EXPIRE after 2 hours.
  if (c.authTokenKey && deliveryType === 'authenticated') {
    return { type: deliveryType, auth_token: { key: c.authTokenKey, duration: 2 * 60 * 60 } };
  }
  return { type: deliveryType, sign_url: deliveryType !== 'upload' };
};

/** Playable URL for a lesson (MP4 for videos, PDF for documents). */
export function lessonUrl(lesson) {
  const base = { resource_type: lesson.cloud_resource_type, ...accessOptions(lesson.cloud_delivery_type) };
  if (lesson.kind === 'video') return cloudinary.url(lesson.cloud_public_id, { ...base, transformation: [VIDEO_TRANSFORM], format: 'mp4' });
  return cloudinary.url(lesson.cloud_public_id, { ...base, format: 'pdf' });
}

/** Thumbnail frame for the video player. */
export function posterUrl(lesson) {
  if (lesson.kind !== 'video') return null;
  return cloudinary.url(lesson.cloud_public_id, {
    resource_type: 'video', ...accessOptions(lesson.cloud_delivery_type),
    transformation: [{ start_offset: 'auto', width: 1280, crop: 'limit', quality: 'auto' }], format: 'jpg',
  });
}

/** Parameters + signature that let the admin's browser upload straight to Cloudinary (the secret never leaves the server). */
export function signUpload(kind) {
  const params = {
    timestamp: Math.round(Date.now() / 1000),
    folder: FOLDER,
    type: 'authenticated',
    ...(kind === 'video' ? { eager: EAGER_VIDEO, eager_async: true } : {}),
  };
  return {
    cloudName: c.cloudName,
    apiKey: c.apiKey,
    resourceType: kind === 'video' ? 'video' : 'image', // PDFs are "image" assets in Cloudinary
    params,
    signature: cloudinary.utils.api_sign_request(params, c.apiSecret),
  };
}

/** Look up an existing asset (e.g. uploaded through the Cloudinary website). Tries private first, then public. */
export async function findAsset(publicId, resourceType) {
  for (const type of ['authenticated', 'upload', 'private']) {
    try {
      const r = await cloudinary.api.resource(publicId, { resource_type: resourceType, type });
      return { deliveryType: type, bytes: r.bytes, duration: r.duration ? Math.round(r.duration) : null };
    } catch { /* try next type */ }
  }
  return null;
}

export const isConfigured = () => !!(c.cloudName && c.apiKey && c.apiSecret);
