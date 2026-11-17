// Main Server Entry for Becoming an Artist
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Models
import { 
  User, Course, Lesson, Category, Enrollment, GroupEnrollment, 
  Subscription, Payment, Booking, CourseRequest, TeacherApplication, 
  Notification, ContactInfo, SubmissionLink, Setting, CloudinaryAccount, 
  Promo, ReferralCampaign, ReferralShare, RewardTicket, CreditTransaction, Assignment 
} from './models/index.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.PUBLIC_ORIGIN || '*',
  credentials: true
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- API Routes ----------
// 1. Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running smoothly', timestamp: new Date() });
});

// 2. Courses API
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).populate('category').sort({ sortOrder: 1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses/:slug', async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug }).populate('category');
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Categories API
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Lessons API
app.get('/api/courses/:courseId/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId }).sort({ sortOrder: 1 });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Serving Frontend (Static Build) ----------
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