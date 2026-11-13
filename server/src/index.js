// Becoming an Artist — API server (Express + MongoDB Atlas + Cloudinary). Ready for Render.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { connectDB } from './db.js';
import { seed } from './seed.js';
import { msg } from './i18n.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import mediaRoutes from './routes/media.js';
import teacherRoutes from './routes/teachers.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('trust proxy', 1); // Render / Cloudflare sit in front of the app
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'frame-src': ["'self'", 'https://res.cloudinary.com'],
      'media-src': ["'self'", 'https://res.cloudinary.com'],
      'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
      'connect-src': ["'self'", 'https://api.cloudinary.com'],
    },
  },
}));
app.use(cors({ origin: config.publicOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api', teacherRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', studentRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: msg(req, 'notFound') }));

// Serve the built React app (client/dist)
const dist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, _next) => {
  console.error(err);
  if (err.name === 'MulterError') return res.status(400).json({ error: msg(req, 'receiptRequired') });
  res.status(500).json({ error: msg(req, 'serverError') });
});

try {
  await connectDB();
  await seed();
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`✔ Becoming an Artist running on port ${config.port}`);
    console.log(`  Videos, PDFs & receipts: Cloudinary (${config.cloudinary.cloudName || 'not configured'})`);
  });
} catch (e) {
  console.error('✖ Could not start:', e.message);
  console.error('  Check MONGO_URI (username, password, database access) and Atlas › Network Access.');
  process.exit(1);
}
