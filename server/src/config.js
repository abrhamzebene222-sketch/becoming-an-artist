// All settings come from environment variables (server/.env locally, "Environment" tab on Render).
import 'dotenv/config';

const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  // Extra allowed browser origins (your Render URL, custom domain). The Android app origin is always allowed.
  publicOrigins: [...list(process.env.PUBLIC_ORIGIN), 'http://localhost:5173', 'http://localhost:4000', 'https://localhost', 'capacitor://localhost'],
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'becoming-an-artist',
    // Optional (paid Cloudinary plans): token-based auth key, makes lesson links expire after 2 hours
    authTokenKey: process.env.CLOUDINARY_AUTH_TOKEN_KEY || '',
  },
  admin: {
    name: process.env.ADMIN_NAME || 'Abrham',
    email: (process.env.ADMIN_EMAIL || 'Artistabrham@gmail.com').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || '',
  },
};

// Device lock: one student account works on one phone/browser at a time.
config.deviceLock = String(process.env.DEVICE_LOCK || 'on').toLowerCase() !== 'off';
config.deviceChangeDays = Number(process.env.DEVICE_CHANGE_DAYS || 30);
// Email sending for the one-time code (HTTPS APIs, so it also works on Render's free plan where SMTP ports are blocked)
config.mail = {
  brevoKey: process.env.BREVO_API_KEY || '',
  resendKey: process.env.RESEND_API_KEY || '',
  from: process.env.MAIL_FROM || '',
  fromName: process.env.MAIL_FROM_NAME || 'Becoming an Artist',
};

const missing = [];
if (!config.mongoUri) missing.push('MONGO_URI');
if (!config.jwtSecret || config.jwtSecret.length < 32) missing.push('JWT_SECRET (at least 32 characters)');
if (missing.length) {
  console.error(`✖ Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
  console.warn('⚠ Cloudinary is not configured: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
}
