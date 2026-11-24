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
  // Telegram bot link (two-way sync) + referral credits
  telegramUsername: { type: String, trim: true, default: '' },
  telegramId: { type: String, index: true, sparse: true },
  telegramChatId: { type: String },
  telegramLinkCode: { type: String, index: true, sparse: true },
  telegramLinkExpires: Date,
  referralCode: { type: String, unique: true, sparse: true },
  creditEtb: { type: Number, default: 0, min: 0 },
}, opts());
UserSchema.virtual('isAdmin').get(function isAdmin() { return String(this.role).toLowerCase() === 'admin'; });
export const User = model('User', UserSchema);

// ---------- Media reference (an image/file kept on one of the Cloudinary accounts) ----------
// `account` = 'env' (the .env account) or the id of a CloudinaryAccount document.
export const MediaSchema = new Schema({
  url: String,
  publicId: String,
  account: { type: String, default: 'env' },
  resourceType: { type: String, default: 'image' },
}, { _id: false });

// ---------- Curriculum ----------
// Recursive tree: a Category with parent = null is a MAJOR group; any category can hold sub-groups
// (infinitely deep) and courses. Price tags live on the groups (buy a sub-group or a whole major group).
export const Category = model('Category', new Schema({
  parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  title: { type: String, required: true, trim: true },
  titleAm: { type: String, trim: true, default: '' },
  slug: { type: String, required: true, unique: true },
  description: String,
  descriptionAm: String,
  sortOrder: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },          // every course inside is open to everyone
  priceEtb: { type: Number, default: 0, min: 0 },     // one-time purchase of the whole group (0 = not sold as a group)
  monthlyPriceEtb: { type: Number, default: 0, min: 0 }, // monthly subscription base price (0 = use priceEtb)
  slides: { type: [MediaSchema], default: [] },       // background slideshow (major groups) / cover
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

// Modular lesson content: alternating text boxes, images and YouTube embeds, in the admin's order.
const BlockSchema = new Schema({
  // heading = section title · step = numbered procedure step (text + optional image) · callout = tip / warning box
  type: { type: String, enum: ['text', 'image', 'youtube', 'heading', 'step', 'callout'], required: true },
  text: String,
  textAm: String,
  image: MediaSchema,        // image blocks, and the optional picture of a step
  caption: String,
  youtubeUrl: String,
  variant: { type: String, enum: ['tip', 'warning'] }, // callout only
});

const needsFile = function needsFile() { return this.kind !== 'blocks'; };

export const Lesson = model('Lesson', new Schema({
  course: ref('Course', true),
  title: { type: String, required: true, trim: true },
  titleAm: { type: String, trim: true },
  // Stable slot id from server/lesson-slots.json (e.g. 'L014'). AI-written lesson files are matched
  // to their place in the tree by this id; lessons created in the admin panel simply have none.
  slot: { type: String, trim: true, index: true, sparse: true },
  kind: { type: String, enum: ['video', 'pdf', 'blocks'], required: true },
  cloudPublicId: { type: String, required: needsFile },
  cloudResourceType: { type: String, enum: ['video', 'image'], required: needsFile }, // PDFs are "image" in Cloudinary
  cloudDeliveryType: { type: String, default: 'authenticated' },                     // authenticated = private
  cloudAccount: { type: String, default: 'env' },                                   // which Cloudinary account holds the file
  blocks: { type: [BlockSchema], default: [] },
  bytes: Number,
  durationSec: Number,
  isPreview: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, opts()));

// ---------- Self-evaluation documents (number 7) ----------
// One document per lesson, written by the admin with the same blocks as a lesson (text / image / YouTube / heading / step / callout).
// Students buy it ONLY with tokens (1 token = 1 ETB); there is no minimum quantity. It is read inside the app, never exported.
export const SELFEVAL_DEFAULT_PRICE = 30;
export const SelfEval = model('SelfEval', (() => {
  const sc = new Schema({
    lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, unique: true },
    priceEtb: { type: Number, default: SELFEVAL_DEFAULT_PRICE, min: 0 }, // tokens; editable per document (0 = free)
    blocks: { type: [BlockSchema], default: [] },
    isPublished: { type: Boolean, default: true },
  }, opts());
  return sc;
})());

// A student's purchase of one self-evaluation document (access record, like LessonUnlock).
const SelfEvalPurchaseSchema = new Schema({
  user: ref('User', true), selfEval: ref('SelfEval', true), lesson: ref('Lesson', true),
  paidEtb: { type: Number, default: 0 },
}, opts());
SelfEvalPurchaseSchema.index({ user: 1, selfEval: 1 }, { unique: true });
export const SelfEvalPurchase = model('SelfEvalPurchase', SelfEvalPurchaseSchema);

// ---------- Access ----------
const EnrollmentSchema = new Schema({ user: ref('User', true), course: ref('Course', true), payment: ref('Payment') }, opts());
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
export const Enrollment = model('Enrollment', EnrollmentSchema);

// Whole-group purchase (or unlocked with referral credit)
const GroupEnrollmentSchema = new Schema({
  user: ref('User', true), category: ref('Category', true), payment: ref('Payment'),
  source: { type: String, enum: ['payment', 'credit', 'admin'], default: 'payment' },
}, opts());
GroupEnrollmentSchema.index({ user: 1, category: 1 }, { unique: true });
export const GroupEnrollment = model('GroupEnrollment', GroupEnrollmentSchema);

// groups = [] → legacy "all paid courses" plan. groups = [ids] → modular group-level monthly plan.
export const Subscription = model('Subscription', new Schema({
  user: ref('User', true), payment: ref('Payment'),
  groups: { type: [{ type: Schema.Types.ObjectId, ref: 'Category' }], default: [] },
  lessonCount: Number,
  discountPercent: Number,
  startsAt: { type: Date, required: true }, endsAt: { type: Date, required: true, index: true },
}, opts()));

// ---------- Payments (CBE / Telebirr screenshot verification) ----------
const PaymentSchema = new Schema({
  user: ref('User', true),
  purpose: { type: String, enum: ['course', 'subscription', 'session', 'group', 'group_subscription', 'topup'], required: true },
  course: ref('Course'),
  category: ref('Category'),                                           // purpose 'group'
  groups: { type: [{ type: Schema.Types.ObjectId, ref: 'Category' }], default: [] }, // purpose 'group_subscription'
  quote: { type: Schema.Types.Mixed },                                 // price breakdown at submit time
  booking: ref('Booking'),
  amountEtb: { type: Number, required: true },
  method: { type: String, enum: ['CBE', 'TELEBIRR'], required: true },
  referenceId: { type: String, required: true, trim: true },
  receiptPublicId: { type: String, required: true }, // private image on Cloudinary
  receiptAccount: { type: String, default: 'env' },
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
  // Duration / content split / price breakdown (all computed by the server, never trusted from the browser)
  durationHours: Number,                 // 1, 1.5, 2, 2.5 or 3
  contentType: { type: String, enum: ['theory', 'practical', 'both'] },
  theoryPercent: Number,                 // theory% + practical% = 100
  practicalPercent: Number,
  rateUsed: Number,                      // per-hour rate (ETB) at the moment of the request
  discountPercent: Number,               // duration discount applied
  listPriceEtb: Number,                  // rate x hours, before discount
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

// ---------- Multiple Cloudinary accounts (managed from the Admin dashboard) ----------
// The API secret is stored encrypted (AES-256-GCM, key derived from JWT_SECRET) and never sent back to the browser.
export const CloudinaryAccount = model('CloudinaryAccount', new Schema({
  label: { type: String, required: true, trim: true },
  cloudName: { type: String, required: true, trim: true },
  apiKey: { type: String, required: true, trim: true },
  apiSecretEnc: { type: String, required: true },
  role: { type: String, enum: ['primary', 'secondary', 'extra'], default: 'extra', index: true },
  folder: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true },
}, opts({ toJSON: { ...toJSON, transform: (_d, ret) => { ret.id = String(ret._id); delete ret._id; delete ret.apiSecretEnc; return ret; } } })));

// ---------- Promo / announcement boards (3 boards × 2 flipping units) ----------
const PromoSchema = new Schema({
  board: { type: Number, enum: [1, 2, 3], required: true },   // 1 news, 2 community/Telegram, 3 referral/sponsored
  slot: { type: Number, enum: [0, 1], required: true },
  title: { type: String, default: '' },
  titleAm: { type: String, default: '' },
  description: { type: String, default: '' },
  descriptionAm: { type: String, default: '' },
  linkUrl: { type: String, default: '' },
  linkLabel: { type: String, default: '' },
  linkLabelAm: { type: String, default: '' },
  image: MediaSchema,
  isActive: { type: Boolean, default: true },
}, opts());
PromoSchema.index({ board: 1, slot: 1 }, { unique: true });
export const Promo = model('Promo', PromoSchema);

// ---------- Telegram referral / APK sharing / sponsored campaigns ----------
const MilestoneSchema = new Schema({
  shares: { type: Number, required: true, min: 1 },
  rewardEtb: { type: Number, default: 0, min: 0 },    // course credit value
  rewardText: { type: String, default: '' },          // e.g. sponsored brand reward
}, { _id: false });

export const ReferralCampaign = model('ReferralCampaign', new Schema({
  code: { type: String, required: true, unique: true },  // short id used in Telegram deep links
  kind: { type: String, enum: ['app', 'sponsored'], default: 'app' },
  title: { type: String, required: true, trim: true },
  titleAm: { type: String, default: '' },
  description: { type: String, default: '' },
  sponsorName: { type: String, default: '' },
  sponsorUrl: { type: String, default: '' },            // partner app / site to promote
  apkFileId: { type: String, default: '' },             // Telegram file_id (admin sends the APK to the bot with /setapk CODE)
  milestones: { type: [MilestoneSchema], default: [] },
  isActive: { type: Boolean, default: true },
}, opts()));

// One row per NEW person brought in by a referrer (Telegram user who opened the bot link, or a web sign-up)
const ReferralShareSchema = new Schema({
  campaign: ref('ReferralCampaign', true),
  referrer: ref('User', true),
  telegramId: String,
  referredUser: ref('User'),
  channel: { type: String, enum: ['telegram', 'web'], default: 'telegram' },
}, opts());
ReferralShareSchema.index({ campaign: 1, telegramId: 1 }, { unique: true, partialFilterExpression: { telegramId: { $type: 'string' } } });
ReferralShareSchema.index({ campaign: 1, referredUser: 1 }, { unique: true, partialFilterExpression: { referredUser: { $type: 'objectId' } } });
export const ReferralShare = model('ReferralShare', ReferralShareSchema);

const RewardTicketSchema = new Schema({
  user: ref('User', true),
  campaign: ref('ReferralCampaign', true),
  shares: { type: Number, required: true },
  rewardEtb: { type: Number, default: 0 },
  rewardText: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  adminMessageId: Number,       // Telegram message in the admin chat (edited when decided)
  decidedVia: String,           // 'telegram' | 'web'
  decidedAt: Date,
}, opts());
RewardTicketSchema.index({ user: 1, campaign: 1, shares: 1 }, { unique: true });
export const RewardTicket = model('RewardTicket', RewardTicketSchema);

// Token ledger. 1 token = 1 ETB. User.creditEtb is the balance; every change also writes one row here.
const CreditTransactionSchema = new Schema({
  user: ref('User', true),
  amountEtb: { type: Number, required: true },  // + earned / bought, − spent
  reason: { type: String, enum: ['referral_reward', 'unlock_course', 'unlock_group', 'unlock_lesson', 'unlock_selfeval', 'topup', 'admin'], required: true },
  ticket: ref('RewardTicket'),
  course: ref('Course'),
  category: ref('Category'),
  lesson: ref('Lesson'),
  selfEval: ref('SelfEval'),                     // unlock_selfeval rows: the self-evaluation document bought
  payment: ref('Payment'),                       // topup rows: the approved payment (unique → can never be credited twice)
  balanceAfter: Number,
}, opts());
CreditTransactionSchema.index({ payment: 1 }, { unique: true, partialFilterExpression: { payment: { $exists: true } } });
export const CreditTransaction = model('CreditTransaction', CreditTransactionSchema);

// A single lesson unlocked with tokens (access record, like Enrollment but per lesson)
const LessonUnlockSchema = new Schema({
  user: ref('User', true), lesson: ref('Lesson', true), course: ref('Course', true),
  paidEtb: { type: Number, default: 0 },
}, opts());
LessonUnlockSchema.index({ user: 1, lesson: 1 }, { unique: true });
LessonUnlockSchema.index({ user: 1, course: 1 });
export const LessonUnlock = model('LessonUnlock', LessonUnlockSchema);

// ---------- Assignment submissions (PDF forwarded to the admin's Telegram) ----------
export const Assignment = model('Assignment', new Schema({
  user: ref('User'),
  course: ref('Course'),
  telegramUsername: String,
  email: String,
  notes: String,
  imageCount: Number,
  pdfUrl: String,
  pdfPublicId: String,
  pdfAccount: String,
  telegramStatus: { type: String, enum: ['sent', 'failed', 'not_configured'], default: 'not_configured' },
  telegramError: String,
}, opts()));
