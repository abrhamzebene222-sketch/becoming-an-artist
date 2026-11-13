// Public teacher application form (no photo upload). Login is optional.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { TeacherApplication } from '../models/index.js';
import { optionalAuth } from '../auth.js';
import { notifyAdmins } from '../notify.js';
import { fail, msg } from '../i18n.js';
import { ah } from '../lib.js';

const router = Router();
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 10,
  handler: (req, res) => res.status(429).json({ error: msg(req, 'tooMany') }),
});

export const SUB_CITIES = ['Addis Ketema', 'Akaky Kaliti', 'Arada', 'Bole', 'Gullele', 'Kirkos', 'Kolfe Keranio',
  'Lemi Kura', 'Lideta', 'Nifas Silk-Lafto', 'Yeka', 'Outside Addis Ababa'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const str = (v, max = 4000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

router.post('/teacher-applications', limiter, optionalAuth, ah(async (req, res) => {
  const b = req.body || {};
  const age = Number(b.age);
  const data = {
    user: req.user?.id,
    fullName: str(b.fullName, 120),
    age,
    email: str(b.email, 160),
    phone: str(b.phone, 40),
    education: str(b.education),
    subCity: SUB_CITIES.includes(b.subCity) ? b.subCity : '',
    location: str(b.location, 200),
    experience: str(b.experience),
    yearsExperience: Math.max(0, Number(b.yearsExperience) || 0),
    portfolioLinks: (Array.isArray(b.portfolioLinks) ? b.portfolioLinks : []).map((l) => str(l, 300)).filter((l) => /^https?:\/\//i.test(l)).slice(0, 10),
    portfolioDescription: str(b.portfolioDescription),
    teachAllCourses: !!b.teachAllCourses,
    courses: b.teachAllCourses ? [] : (Array.isArray(b.courses) ? b.courses.map((c) => str(c, 120)).filter(Boolean).slice(0, 40) : []),
    otherSubjects: str(b.otherSubjects, 500),
    teachingMode: ['online', 'in_person', 'both'].includes(b.teachingMode) ? b.teachingMode : '',
    availabilityFlexible: !!b.availabilityFlexible,
    availableDays: b.availabilityFlexible ? [] : (Array.isArray(b.availableDays) ? b.availableDays.filter((d) => DAYS.includes(d)) : []),
    availableTimes: str(b.availableTimes, 200),
    message: str(b.message),
  };
  const ok = data.fullName && age >= 16 && age <= 100 && /.+@.+\..+/.test(data.email) && data.phone && data.education
    && data.subCity && data.experience && data.teachingMode
    && (data.teachAllCourses || data.courses.length || data.otherSubjects)
    && (data.availabilityFlexible || data.availableDays.length);
  if (!ok) return fail(req, res, 400, 'applicationFields');

  const app = await TeacherApplication.create(data);
  await notifyAdmins({
    type: 'teacher_application_new', params: { name: data.fullName },
    title: 'New teacher application', body: data.fullName, link: '/admin/teachers',
  });
  res.json({ id: app.id });
}));

export default router;
