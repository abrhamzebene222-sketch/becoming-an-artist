// Extra strings for 1-on-1 tutoring (number 3). They are merged on top of en.js / am.js by i18n/index.jsx,
// so the existing en.js / am.js files do not need to change.
export const en = {
  common: { hours: '{h} h', hoursWord: 'hours' },
  sessions: {
    duration: 'Session length',
    durationHelp: 'Longer sessions are cheaper per hour: 1.5 h −10%, 2 h −15%, 2.5 h −20%, 3 h −25%.',
    saveUpTo: 'Save up to {p}%',
    rate: 'Rate: {amount} per hour',
    price: 'Price',
    youSave: 'You save {amount}',
    noDiscount: 'No discount for 1 hour',
    rateNotSet: 'The instructor will confirm the price when approving your request.',
    content: 'What do you want to learn?',
    theory: 'Theory', practical: 'Practical', both: 'Both',
    split: 'Theory {t}% · Practical {p}%',
    splitHint: 'Move the slider to choose how the time is shared (10% steps).',
    theoryShort: 'Theory', practicalShort: 'Practical',
    cardLine: '{h} · {content}',
    listPrice: 'Normal price {amount}',
  },
  admin: {
    settings: {
      sessionOnline: '1-on-1 online rate (ETB per hour)',
      sessionInPerson: '1-on-1 in-person rate (ETB per hour)',
      sessionTableTitle: 'What students will pay (rate × hours, with the fixed discount)',
      sessionTableNote: 'Discounts are fixed: 1 h 0% · 1.5 h 10% · 2 h 15% · 2.5 h 20% · 3 h 25%. Change only the hourly rates above.',
      hoursCol: 'Hours', discountCol: 'Discount', onlineCol: 'Online', inPersonCol: 'In person',
    },
    bookings: {
      duration: 'Length', content: 'Content',
      quoted: 'Student was quoted {price} ({rate} per hour, {pct}% off)',
      priceHint: 'Pre-filled with the price the student saw. You can change it.',
      oldBooking: 'Older request (no length chosen)',
    },
  },
};

export const am = {
  common: { hours: '{h} ሰዓት', hoursWord: 'ሰዓት' },
  sessions: {
    duration: 'የትምህርቱ ርዝመት',
    durationHelp: 'ረዘም ያለ ትምህርት በሰዓት ርካሽ ነው፦ 1.5 ሰዓት −10%፣ 2 ሰዓት −15%፣ 2.5 ሰዓት −20%፣ 3 ሰዓት −25%።',
    saveUpTo: 'እስከ {p}% ይቆጥቡ',
    rate: 'ዋጋ፦ በሰዓት {amount}',
    price: 'ዋጋ',
    youSave: 'የሚቆጥቡት {amount}',
    noDiscount: 'ለ1 ሰዓት ቅናሽ የለም',
    rateNotSet: 'ጥያቄዎን ሲያጸድቁ መምህሩ ዋጋውን ያሳውቁዎታል።',
    content: 'ምን መማር ይፈልጋሉ?',
    theory: 'ንድፈ ሐሳብ', practical: 'ተግባር', both: 'ሁለቱንም',
    split: 'ንድፈ ሐሳብ {t}% · ተግባር {p}%',
    splitHint: 'ጊዜው እንዴት እንደሚከፋፈል ለመምረጥ ስላይደሩን ያንቀሳቅሱ (በ10% ደረጃ)።',
    theoryShort: 'ንድፈ ሐሳብ', practicalShort: 'ተግባር',
    cardLine: '{h} · {content}',
    listPrice: 'መደበኛ ዋጋ {amount}',
  },
  admin: {
    settings: {
      sessionOnline: 'የ1 ለ 1 ኦንላይን ዋጋ (ብር በሰዓት)',
      sessionInPerson: 'የ1 ለ 1 በአካል ዋጋ (ብር በሰዓት)',
      sessionTableTitle: 'ተማሪዎች የሚከፍሉት (ዋጋ × ሰዓት፣ ከቋሚ ቅናሽ ጋር)',
      sessionTableNote: 'ቅናሾች ቋሚ ናቸው፦ 1 ሰዓት 0% · 1.5 ሰዓት 10% · 2 ሰዓት 15% · 2.5 ሰዓት 20% · 3 ሰዓት 25%። ከላይ ያሉትን የሰዓት ዋጋዎች ብቻ ይቀይሩ።',
      hoursCol: 'ሰዓት', discountCol: 'ቅናሽ', onlineCol: 'ኦንላይን', inPersonCol: 'በአካል',
    },
    bookings: {
      duration: 'ርዝመት', content: 'ይዘት',
      quoted: 'ለተማሪው የተነገረው ዋጋ {price} (በሰዓት {rate}፣ {pct}% ቅናሽ)',
      priceHint: 'ተማሪው ባየው ዋጋ ቀድሞ ተሞልቷል። መቀየር ይችላሉ።',
      oldBooking: 'የቆየ ጥያቄ (ርዝመት አልተመረጠም)',
    },
  },
};
