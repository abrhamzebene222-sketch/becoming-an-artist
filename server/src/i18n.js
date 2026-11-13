// Server messages in Amharic (default) and English. The app sends its language in the Accept-Language header.
const MESSAGES = {
  signIn: ['Please sign in.', 'እባክዎ ይግቡ።'],
  adminOnly: ['Admins only.', 'ይህ ለአስተዳዳሪ ብቻ ነው።'],
  registerFields: ['Name, email and a password of at least 8 characters are required.', 'ስም፣ ኢሜይል እና ቢያንስ 8 ፊደል ያለው የይለፍ ቃል ያስፈልጋል።'],
  emailTaken: ['An account with this email already exists.', 'በዚህ ኢሜይል የተመዘገበ መለያ አስቀድሞ አለ።'],
  badLogin: ['Wrong email or password.', 'ኢሜይል ወይም የይለፍ ቃል ትክክል አይደለም።'],
  accountMissing: ['Account not found.', 'መለያው አልተገኘም።'],
  courseNotFound: ['Course not found.', 'ኮርሱ አልተገኘም።'],
  lessonNotFound: ['Lesson not found.', 'ትምህርቱ አልተገኘም።'],
  loginToWatch: ['Please sign in to watch this paid course.', 'ይህን የክፍያ ኮርስ ለማየት እባክዎ ይግቡ።'],
  unlockToWatch: ['Unlock this course to watch.', 'ይህን ኮርስ ለማየት መጀመሪያ ይክፈቱት።'],
  videoNotConfigured: ['Video hosting is not configured yet.', 'የቪዲዮ ማስተናገጃ ገና አልተዘጋጀም።'],
  receiptRequired: ['Attach the payment screenshot (PNG, JPG or WEBP, max 8 MB).', 'የክፍያውን ስክሪንሾት ያያይዙ (PNG፣ JPG ወይም WEBP፣ ከ8 MB ያልበለጠ)።'],
  paymentFields: ['Choose a payment method and enter the transaction reference ID.', 'የክፍያ መንገድ ይምረጡ እና የግብይት ማጣቀሻ ቁጥሩን ያስገቡ።'],
  nothingToPay: ['Nothing to pay for, or the price is not set yet.', 'የሚከፈል ነገር የለም ወይም ዋጋው ገና አልተወሰነም።'],
  freeCourse: ['This course is free — no payment needed.', 'ይህ ኮርስ ነፃ ነው — ክፍያ አያስፈልግም።'],
  duplicateRef: ['This transaction reference was already submitted.', 'ይህ የግብይት ማጣቀሻ ቁጥር ቀደም ብሎ ገብቷል።'],
  bookingFields: ['Choose online or in-person, a date/time and a topic.', 'በኦንላይን ወይም በአካል፣ ቀን/ሰዓት እና ርዕስ ይምረጡ።'],
  topicRequired: ['Tell us the topic you want to learn.', 'መማር የሚፈልጉትን ርዕስ ይንገሩን።'],
  invalidDecision: ['Invalid decision.', 'ልክ ያልሆነ ውሳኔ።'],
  notFound: ['Not found.', 'አልተገኘም።'],
  paymentReviewed: ['Payment not found or already reviewed.', 'ክፍያው አልተገኘም ወይም አስቀድሞ ታይቷል።'],
  cloudinaryKeys: ['Add your Cloudinary keys to the server environment first.', 'መጀመሪያ የCloudinary ቁልፎችዎን በአገልጋዩ ላይ ያስገቡ።'],
  lessonFields: ['Course, title, file and type are required.', 'ኮርስ፣ ርዕስ፣ ፋይል እና ዓይነት ያስፈልጋሉ።'],
  assetMissing: ['No file with that public ID was found in your Cloudinary account.', 'በዚህ መለያ ቁጥር ያለ ፋይል በCloudinary አልተገኘም።'],
  applicationFields: ['Please fill in all required fields.', 'እባክዎ ሁሉንም አስፈላጊ መስኮች ይሙሉ።'],
  tooMany: ['Too many attempts. Please wait a few minutes and try again.', 'በጣም ብዙ ሙከራዎች ተደርገዋል። ጥቂት ደቂቃዎች ጠብቀው እንደገና ይሞክሩ።'],
  serverError: ['Something went wrong on the server. Please try again.', 'በአገልጋዩ ላይ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።'],
};

export const langOf = (req) => (String(req.headers['accept-language'] || 'am').toLowerCase().startsWith('en') ? 'en' : 'am');

export const msg = (req, key) => {
  const m = MESSAGES[key] || MESSAGES.serverError;
  return langOf(req) === 'en' ? m[0] : m[1];
};

/** Send an error in the user's language: fail(req, res, 400, 'paymentFields') */
export const fail = (req, res, status, key) => res.status(status).json({ error: msg(req, key), code: key });
