// Shared multer configs. Files stay in memory only (nothing is written to Render's disk), then go to Cloudinary,
// so "deleting the old file from server storage" is automatic: the buffer is released after the request.
import multer from 'multer';

const images = /^image\/(png|jpe?g|webp)$/;

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, images.test(file.mimetype)),
});

export const artworkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => cb(null, images.test(file.mimetype)),
});

// Assignment form: up to 12 artwork images + one optional payment-receipt screenshot.
export const assignmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 13 },
  fileFilter: (_req, file, cb) => cb(null, images.test(file.mimetype)),
}).fields([{ name: 'images', maxCount: 12 }, { name: 'receipt', maxCount: 1 }]);

// App update: one APK, kept in memory and forwarded to the Telegram channel (Bot API upload limit ~50 MB).
export const apkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1000 * 1000, files: 1 },
}).single('apk');
