// Strings for the app update notice. Merged on top of en.js / am.js by i18n/index.jsx.
export const en = {
  nav: { appUpdates: 'App updates' },
  update: {
    title: 'New update available', new: 'Update', required: 'Required update', button: 'Update', dismiss: 'Dismiss',
  },
  admin: {
    appUpdates: {
      title: 'App updates',
      hint: 'Publish a new app version. Students with an older app see a "New update available" card. Post the APK in your Telegram channel and paste the post link, or attach the APK here and let the bot post it (up to about 50 MB).',
      newVersion: 'Publish a new version', list: 'Published versions', empty: 'No versions published yet.',
      versionName: 'Version name (e.g. 1.2.0)', versionCode: 'Version code (whole number, higher than the last one)',
      notesEn: 'What is new (English)', notesAm: 'What is new (Amharic)',
      mandatory: 'Mandatory update (students cannot dismiss the card)',
      link: 'Telegram post link (https://t.me/…)', linkHint: 'Leave empty only when the bot posts the APK below, or the channel link is set in Telegram Bot.',
      apk: 'APK file (optional)', sendToChannel: 'Send the APK to the Telegram channel through the bot',
      apkTooBig: 'This file is over the bot limit (about 50 MB). Post it in the channel yourself and paste the link.',
      publish: 'Publish', publishing: 'Publishing…', published: 'Version published.',
      sent: 'APK sent to the channel', failed: 'APK not sent', tooBig: 'APK too big for the bot', needsLink: 'No link yet — students cannot see this version.',
      visible: 'Visible', hidden: 'Hidden', required: 'Mandatory', edit: 'Edit link', remove: 'Delete', confirmRemove: 'Delete this version?',
      saveLink: 'Save link', cancel: 'Cancel',
    },
  },
};

export const am = {
  nav: { appUpdates: 'የመተግበሪያ ዝመናዎች' },
  update: {
    title: 'አዲስ ዝመና አለ', new: 'ዝመና', required: 'የግድ ማዘመን', button: 'አዘምን', dismiss: 'ዝጋ',
  },
  admin: {
    appUpdates: {
      title: 'የመተግበሪያ ዝመናዎች',
      hint: 'አዲስ የመተግበሪያ ስሪት ያትሙ። የቆየ መተግበሪያ ያላቸው ተማሪዎች \"አዲስ ዝመና አለ\" የሚል ካርድ ያያሉ። APK ን በቴሌግራም ቻናልዎ ላይ ለጥፈው የፖስቱን ሊንክ ያስገቡ፣ ወይም እዚህ አያይዘው ቦቱ እንዲለጥፈው ያድርጉ (እስከ 50 MB)።',
      newVersion: 'አዲስ ስሪት ያትሙ', list: 'የታተሙ ስሪቶች', empty: 'ገና ምንም ስሪት አልታተመም።',
      versionName: 'የስሪት ስም (ለምሳሌ 1.2.0)', versionCode: 'የስሪት ቁጥር (ሙሉ ቁጥር፣ ከመጨረሻው የሚበልጥ)',
      notesEn: 'አዲስ ነገር (እንግሊዝኛ)', notesAm: 'አዲስ ነገር (አማርኛ)',
      mandatory: 'የግድ ማዘመን (ተማሪዎች ካርዱን መዝጋት አይችሉም)',
      link: 'የቴሌግራም ፖስት ሊንክ (https://t.me/…)', linkHint: 'ባዶ ይተዉት ቦቱ ከታች ያለውን APK ሲለጥፍ፣ ወይም የቻናሉ ሊንክ በቴሌግራም ቦት ውስጥ ሲዘጋጅ ብቻ።',
      apk: 'APK ፋይል (አማራጭ)', sendToChannel: 'APK ን በቦቱ ወደ ቴሌግራም ቻናል ላክ',
      apkTooBig: 'ፋይሉ ከቦቱ ገደብ (ወደ 50 MB) ይበልጣል። በቻናሉ ላይ እራስዎ ለጥፈው ሊንኩን ያስገቡ።',
      publish: 'አትም', publishing: 'በማተም ላይ…', published: 'ስሪቱ ታትሟል።',
      sent: 'APK ወደ ቻናሉ ተልኳል', failed: 'APK አልተላከም', tooBig: 'APK ለቦቱ በጣም ትልቅ ነው', needsLink: 'ሊንክ የለም — ተማሪዎች ይህን ስሪት ማየት አይችሉም።',
      visible: 'የሚታይ', hidden: 'የተደበቀ', required: 'የግድ', edit: 'ሊንክ አስተካክል', remove: 'ሰርዝ', confirmRemove: 'ይህ ስሪት ይሰረዝ?',
      saveLink: 'ሊንኩን አስቀምጥ', cancel: 'ሰርዝ',
    },
  },
};
