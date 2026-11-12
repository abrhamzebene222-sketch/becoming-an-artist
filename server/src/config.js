import 'dotenv/config';
import path from 'node:path';

const abs = (p) => path.resolve(process.cwd(), p);

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || '',
  publicOrigin: [...(process.env.PUBLIC_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
    'https://localhost', 'capacitor://localhost'], // Android/iOS app
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'becoming-an-artist/lessons',
    // Optional: only if your Cloudinary plan has token-based authentication (makes links expire)
    authTokenKey: process.env.CLOUDINARY_AUTH_TOKEN_KEY || '',
  },
  receiptsDir: abs(process.env.RECEIPTS_DIR || './storage/receipts'),
  dbFile: abs(process.env.DB_FILE || './storage/app.db'),
  admin: {
    name: process.env.ADMIN_NAME || 'Abrham',
    email: process.env.ADMIN_EMAIL || 'Artistabrham@gmail.com',
    password: process.env.ADMIN_PASSWORD || '',
  },
};

if (!config.jwtSecret || config.jwtSecret.length < 32 || config.jwtSecret.startsWith('change-me')) {
  console.error('✖ Set a long random JWT_SECRET in server/.env before starting.');
  process.exit(1);
}
if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
  console.warn('⚠ Cloudinary is not configured: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env');
}
