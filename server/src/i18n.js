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
  newsNotFound: ['News item not found.', 'ዜናው አልተገኘም።'],
  newsFields: ['A news title is required.', 'የዜና ርዕስ ያስፈልጋል።'],
  newsExists: ['This lesson is already in the news.', 'ይህ ትምህርት አስቀድሞ በዜና ውስጥ አለ።'],
  courseNotPublished: ['Publish the course first so students can open this lesson.', 'ተማሪዎች ትምህርቱን እንዲከፍቱ መጀመሪያ ኮርሱን ያትሙ።'],
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
  // ---- Nested groups, media, Cloudinary accounts ----
  groupNotFound: ['Group not found.', 'ቡድኑ አልተገኘም።'],
  groupCycle: ['A group cannot be moved inside itself or its own sub-groups.', 'ቡድን በራሱ ወይም በንዑስ ቡድኖቹ ውስጥ ሊገባ አይችልም።'],
  imageRequired: ['Choose an image (PNG, JPG or WEBP, max 10 MB).', 'ምስል ይምረጡ (PNG፣ JPG ወይም WEBP፣ ከ10 MB ያልበለጠ)።'],
  cloudAccountFields: ['Label, cloud name, API key and API secret are required.', 'ስም፣ cloud name፣ API key እና API secret ያስፈልጋሉ።'],
  cloudAccountFailed: ['Cloudinary rejected these credentials. Check them and try again.', 'Cloudinary እነዚህን መረጃዎች አልተቀበለም። አረጋግጠው እንደገና ይሞክሩ።'],
  accountInUse: ['Files are still stored on this account. Deactivate it instead, or move the files first.', 'በዚህ መለያ ላይ ፋይሎች አሉ። ከማጥፋት ይልቅ ያቦዝኑት ወይም ፋይሎቹን መጀመሪያ ያዛውሩ።'],
  lessonBlocks: ['Add at least one text, image or YouTube block.', 'ቢያንስ አንድ ጽሑፍ፣ ምስል ወይም የYouTube ብሎክ ያክሉ።'],
  // ---- Group pricing / subscriptions / credits ----
  noGroupPrice: ['This group is not sold as a bundle yet.', 'ይህ ቡድን ገና በጥቅል አይሸጥም።'],
  selectGroups: ['Select at least one course group.', 'ቢያንስ አንድ የኮርስ ቡድን ይምረጡ።'],
  alreadyUnlocked: ['You already have access.', 'አስቀድመው መዳረሻ አለዎት።'],
  notEnoughCredit: ['Not enough credit for this unlock.', 'ለዚህ መክፈቻ በቂ ክሬዲት የለዎትም።'],
  // ---- Self-evaluation documents ----
  selfEvalSelect: ['Select at least one lesson.', 'ቢያንስ አንድ ትምህርት ይምረጡ።'],
  selfEvalNone: ['A self-evaluation document is not prepared yet for one of the selected lessons.', 'ከተመረጡት ትምህርቶች ለአንዱ የመገምገሚያ ሰነድ ገና አልተዘጋጀም።'],
  selfEvalNotFound: ['Self-evaluation document not found.', 'የመገምገሚያ ሰነዱ አልተገኘም።'],
  selfEvalLocked: ['Buy this self-evaluation document first.', 'መጀመሪያ ይህን የመገምገሚያ ሰነድ ይግዙ።'],
  selfEvalPrice: ['Enter a price between 0 and 100000 tokens.', 'ዋጋው ከ0 እስከ 100000 ቶክን መካከል ያስገቡ።'],
  selfEvalHasBuyers: ['Students already bought this document, so it cannot be deleted. Hide it instead.', 'ተማሪዎች ይህን ሰነድ ገዝተውታል፤ ስለዚህ መሰረዝ አይቻልም። በምትኩ ደብቁት።'],
  // ---- Telegram bot, referrals, assignments ----
  telegramNotConfigured: ['The Telegram bot is not linked yet. Ask the admin to set it up.', 'የቴሌግራም ቦቱ ገና አልተገናኘም። አስተዳዳሪውን ይጠይቁ።'],
  telegramUsername: ['Enter a valid Telegram username (5–32 letters, numbers or _).', 'ትክክለኛ የቴሌግራም የተጠቃሚ ስም ያስገቡ (5–32 ፊደል፣ ቁጥር ወይም _)።'],
  telegramTokenInvalid: ['Telegram rejected this bot token.', 'ቴሌግራም ይህን የቦት ቶክን አልተቀበለም።'],
  campaignFields: ['Title and at least one milestone are required.', 'ርዕስ እና ቢያንስ አንድ የማጋራት ግብ ያስፈልጋሉ።'],
  ticketReviewed: ['This reward request was already reviewed.', 'ይህ የሽልማት ጥያቄ አስቀድሞ ታይቷል።'],
  assignmentFields: ['Telegram username, email and at least one artwork image are required.', 'የቴሌግራም ስም፣ ኢሜይል እና ቢያንስ አንድ የስራ ምስል ያስፈልጋሉ።'],
};

export const langOf = (req) => (String(req.headers['accept-language'] || 'am').toLowerCase().startsWith('en') ? 'en' : 'am');

export const msg = (req, key) => {
  const m = MESSAGES[key] || MESSAGES.serverError;
  return langOf(req) === 'en' ? m[0] : m[1];
};

/** Send an error in the user's language: fail(req, res, 400, 'paymentFields') */
export const fail = (req, res, status, key) => res.status(status).json({ error: msg(req, key), code: key });
