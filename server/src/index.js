// Main Server Entry for Becoming an Artist
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.PUBLIC_ORIGIN || '*',
  credentials: true
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Serving Frontend (Static Build) ----------
// Root Directory ባዶ ስለሆነ (የፕሮጀክቱ ዋና ፎልደር) ክላየንቱ ከሰርቨር አንጻር ሲታይ ../client/dist ውስጥ ይገኛል
app.use(express.static(path.join(__dirname, '../../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// ---------- Database Connection & Server Startup ----------
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Could not start: Server selection timed out or connection failed.', err);
  });