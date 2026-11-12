import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { seed } from './seed.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import mediaRoutes from './routes/media.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

seed();

const app = express();
app.set('trust proxy', 1); // behind Cloudflare Tunnel
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'frame-src': ["'self'", 'https://res.cloudinary.com'],
      // Videos, posters and PDFs load straight from Cloudinary; admin uploads go to its API
      'media-src': ["'self'", 'https://res.cloudinary.com'],
      'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
      'connect-src': ["'self'", 'https://api.cloudinary.com'],
    },
  },
}));
app.use(cors({ origin: config.publicOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', studentRoutes);

// Serve the built React app (client/dist) from the same server
const dist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(config.port, () => {
  console.log(`✔ Becoming an Artist running on http://localhost:${config.port}`);
  console.log(`  Videos & PDFs: Cloudinary (${config.cloudinary.cloudName || 'not configured'})`);
});
