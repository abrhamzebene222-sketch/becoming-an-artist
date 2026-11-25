# አንድ መለያ = አንድ መሣሪያ (Device lock)

## እንዴት ይሰራል
- መተግበሪያው የስልኩን መለያ በራሱ ያነባል (ተማሪው ምንም አይሞላም)። Android/iOS መተግበሪያ፦ `@capacitor/device`። ድረ-ገጽ፦ በብራውዘሩ ውስጥ የሚቀመጥ ዘፈቀደ መለያ።
- ተማሪ ሲመዘገብ ወይም የመጀመሪያ ጊዜ ሲገባ መሣሪያው ከመለያው ጋር ይታሰራል (ሰርቨሩ hash ብቻ ያስቀምጣል)።
- ከሌላ መሣሪያ ሲገባ → "መለያው ከሌላ መሣሪያ ጋር ተያይዟል" ይላል፣ ኮድ ወደ ኢሜይሉ እንዲላክ ይጠይቃል።
- ትክክለኛ ኮድ (ከይለፍ ቃል ጋር) ሲገባ → መሣሪያው ይተካል፣ የድሮው ስልክ ቶከን ወዲያው ይሰረዛል (`tokenVersion` +1)፣ ክሬዲቶችና የተገዙ ኮርሶች በመለያው ላይ ስለሆኑ ይቆያሉ።
- ገደቦች፦ በ30 ቀን አንድ ጊዜ፣ ኮድ 10 ደቂቃ፣ 5 ስህተት ሙከራ፣ ኮድ በ60 ሰከንድ አንድ ጊዜ ብቻ መላክ።
- ስልክ ከጠፋና የ30 ቀን ገደቡ ካልደረሰ → አድሚን › ተጠቃሚዎች › "መሣሪያውን አላቅቅ" ይጫኑ። ተማሪው በአዲሱ ስልክ ሲገባ በራስ-ሰር ይያያዛል።
- አድሚኖች አይታሰሩም። ነባር ተማሪዎች ቀጣዩ ጥያቄያቸው ላይ በራስ-ሰር ይታሰራሉ።
- ማጥፋት ካስፈለገ፦ `DEVICE_LOCK=off`።

## ማዘጋጀት (አንድ ጊዜ)
1. **ኢሜይል መላኪያ (አስፈላጊ):** Render ነጻ እቅድ SMTP (Gmail) ይዘጋል፤ ስለዚህ HTTPS የሚጠቀም Brevo ተጠቅሜያለሁ።
   - brevo.com ላይ ነጻ መለያ ይክፈቱ (በቀን 300 ኢሜይል ነጻ)።
   - Senders › የራስዎን ኢሜይል (ለምሳሌ Gmail) ያረጋግጡ።
   - SMTP & API › API Keys › ቁልፍ ይፍጠሩ።
   - Render › Environment ላይ ያክሉ፦ `BREVO_API_KEY`, `MAIL_FROM` (ያረጋገጡት ኢሜይል)፣ ከፈለጉ `MAIL_FROM_NAME`።
   - (Resend ከመረጡ `RESEND_API_KEY` + `MAIL_FROM`፤ ነገር ግን የራስዎ domain ያስፈልገዋል።)
2. **መተግበሪያ (client):** `cd client && npm install` (አዲስ `@capacitor/device` ይጭናል)።
3. **Android:** `npm run build:android` ከዚያ አዲስ APK ይገንቡ። የድሮ APK ያላቸው ተማሪዎች አዲሱን መጫን አለባቸው (የድሮው መለያ አይልክም)።
4. GitHub ላይ push ያድርጉ → Render በራሱ ይሰራጫል (ድረ-ገጹም ይገነባል)።

## የተቀየሩ/አዲስ ፋይሎች
- server: `src/device.js` (አዲስ)፣ `src/mailer.js` (አዲስ)፣ `src/auth.js`፣ `src/routes/auth.js`፣ `src/routes/admin.js`፣ `src/models/index.js`፣ `src/config.js`፣ `src/i18n.js`
- client: `src/lib/device.js` (አዲስ)፣ `src/i18n/deviceExtra.js` (አዲስ)፣ `src/api.js`፣ `src/pages/Login.jsx`፣ `src/pages/admin/Users.jsx`፣ `src/i18n/index.jsx`፣ `package.json`
- `render.yaml`

## ማወቅ ያለብዎት
- ድረ-ገጽ ላይ የብራውዘር ዳታ ቢጠፋ እንደ "አዲስ መሣሪያ" ይቆጠራል (ተማሪው በኮድ ይመልሳል)። ጠንካራው ጥበቃ በመተግበሪያው ውስጥ ነው።
- Root የተደረገ ስልክ መለያ ሊያጭበርብር ይችላል፤ ለአብዛኛው መጋራት ግን በቂ ነው።
- ኮዱ ወደ መለያው ኢሜይል ስለሚላክ፣ የይለፍ ቃል ብቻ የሚያጋራ ሰው ስልኩን ማዛወር አይችልም (ኢሜይሉንም ካጋራ ግን ይችላል)።
