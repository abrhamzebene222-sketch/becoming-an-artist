// Strings for the one-device-per-account lock. Merged on top of en.js / am.js by i18n/index.jsx.
export const en = {
  device: {
    title: 'Move this account to this device',
    explain: 'This account is linked to another phone or browser, so it can only be used there. To move it here, we will email a 6-digit code to the address on the account. After the move, the old device is signed out.',
    send: 'Email me a code',
    sent: 'We sent a code to {email}. It is valid for {min} minutes.',
    codeLabel: '6-digit code',
    confirm: 'Confirm and move',
    resend: 'Send a new code',
    back: 'Back to sign in',
  },
  admin: {
    users: {
      device: 'Device', deviceLinked: 'Linked', deviceNone: 'Not linked yet', resetDevice: 'Unlink device',
      resetConfirm: 'Unlink this student\'s device? Their credits and purchases stay. Their next sign-in links the new phone and the old phone is signed out.',
    },
  },
};

export const am = {
  device: {
    title: 'መለያውን ወደዚህ መሣሪያ ያዛውሩ',
    explain: 'ይህ መለያ ከሌላ ስልክ ወይም ብራውዘር ጋር ተያይዟል፤ ስለዚህ እዚያ ብቻ ነው መጠቀም የሚቻለው። ወደዚህ ለማዛወር በመለያው ኢሜይል ባለ 6 አሃዝ ኮድ እንልካለን። ከተዛወረ በኋላ የድሮው መሣሪያ ይወጣል።',
    send: 'ኮድ ወደ ኢሜይሌ ላክ',
    sent: 'ኮድ ወደ {email} ተልኳል። ለ{min} ደቂቃ ያገለግላል።',
    codeLabel: 'ባለ 6 አሃዝ ኮድ',
    confirm: 'አረጋግጥ እና አዛውር',
    resend: 'አዲስ ኮድ ላክ',
    back: 'ወደ መግቢያ ተመለስ',
  },
  admin: {
    users: {
      device: 'መሣሪያ', deviceLinked: 'ተያይዟል', deviceNone: 'ገና አልተያያዘም', resetDevice: 'መሣሪያውን አላቅቅ',
      resetConfirm: 'የዚህ ተማሪ መሣሪያ ይላቀቅ? ክሬዲቶቹና የገዛቸው ኮርሶች ይቆያሉ። በሚቀጥለው ሲገባ አዲሱ ስልክ ይያያዛል፤ የድሮው ስልክ ይወጣል።',
    },
  },
};
