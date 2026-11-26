# ለውጦች — ፋይሎቹን በየአቃፊያቸው ላይ ኮፒ/ፔስት አድርጉ (የአቃፊ መዋቅሩ ከፕሮጀክቱ ጋር ተመሳሳይ ነው)

## server/
- src/prune-legacy.js (አዲስ) — የድሮ ኮርሶችን/ግሩፖችን የሚያጠፋ
- src/seed.js — ሲጀምር prune-legacy ን ይጠራል
- src/import-selfevals.js (አዲስ) + src/data/selfevals/README.md (አዲስ) — AI የጻፈውን ራስ መገምገሚያ ማስገቢያ
- src/models/index.js — SelfEval.creditHours
- src/lib.js — selfEvalPriceOf()
- src/routes/selfEvals.js — ክሬዲት አወር ዋጋ፣ imageHint ለተማሪ እንዳይታይ
- src/routes/admin.js — ራስ መገምገሚያ creditHours (ማስቀመጥ/ዝርዝር/ማንበብ)
- package.json — scripts: prune, import-selfevals

## client/
- src/pages/admin/SelfEvals.jsx — የክሬዲት አወር መስክ
- src/i18n/selfEvalExtra.js — አዳዲስ ጽሁፎች

## ሊሰርዙት የሚገባ ፋይል
- server/migrate-courses.js (ለእያንዳንዱ ኮርስ `-group` ሰብ-ግሩፕ ይፈጥራል፤ ከጠራ ድጋሚ ዱፕሊኬት ያደርጋል)
