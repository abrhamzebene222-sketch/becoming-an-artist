// Extra strings for credit-hour pricing. Merged on top of en.js / am.js by i18n/index.jsx.
export const en = {
  credit: {
    settingsTitle: 'Credit-hour pricing',
    how: 'One number prices everything. Lesson price = credit hours × this price. Course price = the sum of its lessons. Group price = the sum of the courses inside it. Tokens: 1 token = 1 ETB, so a lesson costs the same number of tokens. Leave it at 0 to keep using the prices typed on each group and course.',
    rateLabel: 'Price of one credit hour (ETB)',
    defaultLabel: 'Default credit hours (for lessons with none set)',
    on: 'Credit-hour pricing is ON. Group and course prices are calculated; the price boxes on groups and courses are ignored.',
    off: 'Credit-hour pricing is OFF (price is 0). The prices typed on each group and course are used.',
    example: 'Example: {h} credit hours × {rate} = {price} ETB (or {price} tokens)',
    hoursLabel: 'Credit hours',
    hoursHint: 'Theory 0.5–1 · mixed 1–2 · practical 1.5–3. Empty = default ({n}).',
    hoursShort: '{n} credit h',
    lessonPrice: '{n} ETB',
    notSold: 'No content yet — not sold',
    calcGroup: 'Calculated from the courses inside: {hours} credit hours',
    calcCourse: 'Calculated from the lessons: {price} · {hours} credit hours',
    calcNote: 'Change a lesson\'s credit hours or the credit-hour price in Settings to change this.',
    totalHours: '{n} credit hours',
    buyLesson: 'Unlock only this lesson',
  },
};

export const am = {
  credit: {
    settingsTitle: 'በክሬዲት አወር የሚሰራ ዋጋ',
    how: 'አንድ ቁጥር ሁሉንም ዋጋ ይወስናል። የሌሰን ዋጋ = ክሬዲት አወር × ይህ ዋጋ። የኮርስ ዋጋ = የሌሰኖቹ ድምር። የግሩፕ ዋጋ = በውስጡ ያሉ ኮርሶች ድምር። ቶከን፦ 1 ቶከን = 1 ብር፣ ስለዚህ አንድ ሌሰን በዚያው ቁጥር ቶከን ይገዛል። 0 ካደረጉት በግሩፕና በኮርስ ላይ የተጻፉት ዋጋዎች ይሠራሉ።',
    rateLabel: 'የአንድ ክሬዲት አወር ዋጋ (ብር)',
    defaultLabel: 'መደበኛ ክሬዲት አወር (ክሬዲት አወር ላልተሞላላቸው ሌሰኖች)',
    on: 'የክሬዲት አወር ዋጋ ሥራ ላይ ነው። የግሩፕና የኮርስ ዋጋ ይሰላል፤ በግሩፕና በኮርስ ላይ የተጻፉ ዋጋዎች ችላ ይባላሉ።',
    off: 'የክሬዲት አወር ዋጋ አልበራም (ዋጋው 0 ነው)። በግሩፕና በኮርስ ላይ የተጻፉ ዋጋዎች ይሠራሉ።',
    example: 'ምሳሌ፦ {h} ክሬዲት አወር × {rate} = {price} ብር (ወይም {price} ቶከን)',
    hoursLabel: 'ክሬዲት አወር',
    hoursHint: 'ቴዎሪ 0.5–1 · ድብልቅ 1–2 · ፕራክቲካል 1.5–3። ባዶ ከሆነ መደበኛው ({n}) ይሠራል።',
    hoursShort: '{n} ክሬዲት አወር',
    lessonPrice: '{n} ብር',
    notSold: 'ገና ይዘት የለውም — አይሸጥም',
    calcGroup: 'በውስጡ ካሉ ኮርሶች የተሰላ፦ {hours} ክሬዲት አወር',
    calcCourse: 'ከሌሰኖቹ የተሰላ፦ {price} · {hours} ክሬዲት አወር',
    calcNote: 'ይህን ለመቀየር የሌሰኑን ክሬዲት አወር ወይም በሴቲንግ ያለውን የክሬዲት አወር ዋጋ ይቀይሩ።',
    totalHours: '{n} ክሬዲት አወር',
    buyLesson: 'ይህን ሌሰን ብቻ ክፈት',
  },
};
