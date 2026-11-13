// Mongoose models for Becoming an Artist.
// Every model returns `id` (string) instead of `_id` in API responses.
import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const ref = (name, required = false) => ({ type: Schema.Types.ObjectId, ref: name, required, index: true });

const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => { ret.id = String(ret._id); delete ret._id; delete ret.passwordHash; return ret; },
};
const opts = (extra = {}) => ({ timestamps: true, toJSON, toObject: toJSON, ...extra });

// ---------- Users ----------
// role: 'student' (default) or 'admin'. You can promote a user by editing `role` to "admin"
// in MongoDB Atlas › Data Explorer › users — the change applies on their next page load.
const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'student', lowercase: true, trim: true },
}, opts());
UserSchema.virtual('isAdmin').get(function isAdmin() { return String(this.role).toLowerCase() === 'admin'; });
export const User = model('User', UserSchema);

// ---------- Curriculum ----------
export const Category = model('Category', new Schema({
  title: { type: String, required: true, trim: true },
  titleAm: { type: String, trim: true, default: '' },
  slug: { type: String, required: true, unique: true },
  description: String,
  descriptionAm: String,
  sortOrder: { type: Number, default: 0 },
}, opts()));

const CriterionSchema = new Schema({ criterion: String, weight: Number }, { _id: false });

export const Course = model('Course', new Schema({
  category: ref('Category', true),
  title: { type: String, required: true, trim: true },
  titleAm: { type: String, trim: true, default: '' },
  slug: { type: String, required: true, unique: true },
  summary: String,
  summaryAm: String,
  learningOutcomes: String,
  deliverables: String,
  evaluationCriteria: { type: [CriterionSchema], default: [] },
  // Free courses can be watched without an account. Paid courses need login + payment.
  isFree: { type: Boolean, default: false },
  priceEtb: { type: Number, default: 0, min: 0 },
  submissionLink: ref('SubmissionLink'),
  isPublished: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, opts()));

export const Lesson = model('Lesson', new Schema({
  course: ref('Course', true),
  title: { type: String, required: true, trim: true },
  kind: { type: String, enum: ['video', 'pdf'], required: true },
  cloudPublicId: { type: String, required: true },
  cloudResourceType: { type: String, enum: ['video', 'image'], required: true }, // PDFs are "image" in Cloudinary
  cloudDeliveryType: { type: String, default: 'authenticated' },                  // authenticated = private
  bytes: Number,
  durationSec: Number,
  isPreview: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, opts()));

// ---------- Access ----------
const EnrollmentSchema = new Schema({ user: ref('User', true), course: ref('Course', true), payment: ref('Payment') }, opts());
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
export const Enrollment = model('Enrollment', EnrollmentSchema);

export const Subscription = model('Subscription', new Schema({
  user: ref('User', true), payment: ref('Payment'),
  startsAt: { type: Date, required: true }, endsAt: { type: Date, required: true, index: true },
}, opts()));

// ---------- Payments (CBE / Telebirr screenshot verification) ----------
const PaymentSchema = new Schema({
  user: ref('User', true),
  purpose: { type: String, enum: ['course', 'subscription', 'session'], required: true },
  course: ref('Course'),
  booking: ref('Booking'),
  amountEtb: { type: Number, required: true },
  method: { type: String, enum: ['CBE', 'TELEBIRR'], required: true },
  referenceId: { type: String, required: true, trim: true },
  receiptPublicId: { type: String, required: true }, // private image on Cloudinary
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  adminNote: String,
  reviewedAt: Date,
}, opts());
PaymentSchema.index({ method: 1, referenceId: 1 }, { unique: true });
export const Payment = model('Payment', PaymentSchema);

// ---------- 1-on-1 sessions ----------
export const Booking = model('Booking', new Schema({
  user: ref('User', true),
  mode: { type: String, enum: ['online', 'in_person'], required: true },
  preferredAt: { type: Date, required: true },
  topic: { type: String, required: true },
  notes: String,
  status: { type: String, enum: ['requested', 'approved', 'rejected', 'paid', 'completed'], default: 'requested', index: true },
  priceEtb: Number,
  adminMessage: String,
}, opts()));

export const CourseRequest = model('CourseRequest', new Schema({
  user: ref('User', true),
  topic: { type: String, required: true },
  description: String,
  level: String,
  status: { type: String, enum: ['open', 'planned', 'declined', 'done'], default: 'open', index: true },
}, opts()));

// ---------- Teacher applications (no photo upload) ----------
export const TeacherApplication = model('TeacherApplication', new Schema({
  user: ref('User'),
  // Personal information
  fullName: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 16, max: 100 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  education: { type: String, required: true },
  subCity: { type: String, required: true },
  location: { type: String, trim: true },
  // Professional background
  experience: { type: String, required: true },
  yearsExperience: { type: Number, min: 0, default: 0 },
  portfolioLinks: { type: [String], default: [] },
  portfolioDescription: String,
  // Teaching preferences
  teachAllCourses: { type: Boolean, default: false },
  courses: { type: [String], default: [] },
  otherSubjects: String,
  teachingMode: { type: String, enum: ['online', 'in_person', 'both'], required: true },
  availabilityFlexible: { type: Boolean, default: false },
  availableDays: { type: [String], default: [] },
  availableTimes: String,
  message: String,
  status: { type: String, enum: ['new', 'reviewing', 'accepted', 'rejected'], default: 'new', index: true },
  adminNote: String,
}, opts()));

// ---------- Notifications ----------
// `type` + `params` let the app show each notification in the reader's language.
export const Notification = model('Notification', new Schema({
  user: ref('User', true),
  type: { type: String, required: true },
  params: { type: Schema.Types.Mixed, default: {} },
  title: String,
  body: String,
  link: String,
  isRead: { type: Boolean, default: false },
}, opts()));

// ---------- Editable business info ----------
export const ContactInfo = model('ContactInfo', new Schema({
  kind: { type: String, enum: ['email', 'phone', 'telegram', 'address', 'website', 'other'], default: 'other' },
  label: String,
  value: { type: String, required: true },
  sortOrder: { type: Number, default: 0 },
}, opts()));

export const SubmissionLink = model('SubmissionLink', new Schema({
  kind: { type: String, enum: ['telegram', 'email', 'google_form', 'other'], default: 'other' },
  label: String,
  url: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, opts()));

export const Setting = model('Setting', new Schema({
  key: { type: String, required: true, unique: true },
  value: Schema.Types.Mixed,
}, opts()));
