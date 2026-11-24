// Public news feed: GET /api/news?limit=3  and  GET /api/news/:id  (only active items; no login needed)
import { Router } from 'express';
import mongoose from 'mongoose';
import { NewsItem } from '../models/index.js';
import { fail } from '../i18n.js';
import { ah } from '../lib.js';
import { serializeNews } from '../newsLib.js';

const router = Router();

router.get('/news', ah(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 50);
  const items = await NewsItem.find({ isActive: true }).sort({ createdAt: -1 }).limit(limit).lean();
  res.json(await serializeNews(items));
}));

router.get('/news/:id', ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(req, res, 404, 'newsNotFound');
  const item = await NewsItem.findOne({ _id: req.params.id, isActive: true }).lean();
  if (!item) return fail(req, res, 404, 'newsNotFound');
  res.json((await serializeNews(item))[0]);
}));

export default router;
