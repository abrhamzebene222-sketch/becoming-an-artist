// Strings for the news feed (number 5). Merged on top of en.js / am.js by i18n/index.jsx.
export const en = {
  nav: { news: 'News' },
  news: {
    title: 'News & announcements', latest: 'Latest news', all: 'All news', empty: 'No news yet.',
    readMore: 'Read more', openLesson: 'Open the lesson', openCourse: 'Open the course', openLink: 'Open link',
    notFound: 'This news item was not found.',
  },
  notif: { lesson_new: { title: 'New lesson', body: '{title} · {course}' } },
  lessonPage: { subtitle: 'Short description (one sentence)', },
  admin: {
    news: {
      title: 'News', hint: 'Posts shown on the student home page and the News page. To announce a lesson, use "Add to news" on the lesson in Courses & Media.',
      newItem: 'New news item', editItem: 'Edit news item', list: 'All news items', empty: 'No news items yet.',
      titleEn: 'Title (English)', titleAm: 'Title (Amharic)', summaryEn: 'Short summary (English)', summaryAm: 'Short summary (Amharic)',
      bodyEn: 'Full text for "Read more" (English)', bodyAm: 'Full text for "Read more" (Amharic)', image: 'Picture',
      linkTo: 'Button opens', linkNone: 'Nothing', linkCourse: 'A course', linkUrl: 'An outside link', chooseCourse: 'Choose a course…',
      url: 'Link (https://…)', lessonLinked: 'Linked to a lesson (set by "Add to news")', visible: 'Visible to students', hidden: 'Hidden',
      save: 'Save', saving: 'Saving…', cancel: 'Cancel', edit: 'Edit', remove: 'Delete', confirmRemove: 'Delete this news item?',
    },
    courses: {
      subtitle: 'Subtitle (English, one sentence)', subtitleAm: 'Subtitle (Amharic, one sentence)',
      addToNews: 'Add to news', addedToNews: 'Added to news. Students were notified.',
    },
  },
};

export const am = {
  nav: { news: 'ዜና' },
  news: {
    title: 'ዜና እና ማስታወቂያዎች', latest: 'የቅርብ ጊዜ ዜና', all: 'ሁሉም ዜና', empty: 'እስካሁን ዜና የለም።',
    readMore: 'ተጨማሪ ያንብቡ', openLesson: 'ትምህርቱን ክፈት', openCourse: 'ኮርሱን ክፈት', openLink: 'ሊንኩን ክፈት',
    notFound: 'ይህ ዜና አልተገኘም።',
  },
  notif: { lesson_new: { title: 'አዲስ ትምህርት', body: '{title} · {course}' } },
  lessonPage: { subtitle: 'አጭር መግለጫ (አንድ ዓረፍተ ነገር)', },
  admin: {
    news: {
      title: 'ዜና', hint: 'በተማሪዎች መነሻ ገጽ እና በዜና ገጽ ላይ የሚታዩ ጽሑፎች። ትምህርት ለማሳወቅ በ "ኮርሶች እና ሚዲያ" ውስጥ ያለውን "ወደ ዜና ጨምር" ይጠቀሙ።',
      newItem: 'አዲስ ዜና', editItem: 'ዜና አስተካክል', list: 'ሁሉም ዜናዎች', empty: 'እስካሁን ዜና የለም።',
      titleEn: 'ርዕስ (እንግሊዝኛ)', titleAm: 'ርዕስ (አማርኛ)', summaryEn: 'አጭር ማጠቃለያ (እንግሊዝኛ)', summaryAm: 'አጭር ማጠቃለያ (አማርኛ)',
      bodyEn: 'ሙሉ ጽሑፍ ለ "ተጨማሪ ያንብቡ" (እንግሊዝኛ)', bodyAm: 'ሙሉ ጽሑፍ ለ "ተጨማሪ ያንብቡ" (አማርኛ)', image: 'ምስል',
      linkTo: 'ቁልፉ የሚከፍተው', linkNone: 'ምንም', linkCourse: 'ኮርስ', linkUrl: 'የውጭ ሊንክ', chooseCourse: 'ኮርስ ይምረጡ…',
      url: 'ሊንክ (https://…)', lessonLinked: 'ከትምህርት ጋር ተያይዟል ("ወደ ዜና ጨምር" ያስቀመጠው)', visible: 'ለተማሪዎች ይታያል', hidden: 'ተደብቋል',
      save: 'አስቀምጥ', saving: 'በማስቀመጥ ላይ…', cancel: 'ተው', edit: 'አስተካክል', remove: 'ሰርዝ', confirmRemove: 'ይህ ዜና ይሰረዝ?',
    },
    courses: {
      subtitle: 'ንዑስ ርዕስ (እንግሊዝኛ፣ አንድ ዓረፍተ ነገር)', subtitleAm: 'ንዑስ ርዕስ (አማርኛ፣ አንድ ዓረፍተ ነገር)',
      addToNews: 'ወደ ዜና ጨምር', addedToNews: 'ወደ ዜና ተጨምሯል። ተማሪዎች ተነግሯቸዋል።',
    },
  },
};
