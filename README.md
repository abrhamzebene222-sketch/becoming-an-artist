# Becoming an Artist — v2

Online art education platform with a **Student Portal** and an **Instructor/Admin Portal**.
**Amharic by default**, switchable to English. Runs on **Render**, stores data in **MongoDB Atlas**, and keeps videos, PDFs and payment screenshots on **Cloudinary**.

```
Browser / Android app ──HTTPS──▶ Render (Node + Express, serves the React site and /api)
                                   ├─▶ MongoDB Atlas  (users, courses, payments, bookings, applications…)
                                   └─▶ Cloudinary     (private lesson videos/PDFs + payment screenshots)
```

## What's new in v3 (advanced features)
- **Nested curriculum (any depth):** Admin › Courses & Media is now a File-Explorer tree (▸/▾ expand-collapse) — Fine Art → Oil Painting → Brushwork → Impasto → courses. Add, edit, move or delete sub-groups at any level.
- **Group pricing:** price tags on groups. Students buy one course, a sub-group, or a whole major group (CBE/Telebirr receipt, or referral credit).
- **Modular lessons:** `+ Add Text Box`, `+ Add Image`, `+ Add YouTube video` blocks (or video/PDF + extra blocks) and a **Free Preview Lesson** checkbox. Students open lessons in an in-app accordion; locked lessons show 🔒; if a paid course has no preview: “ለዚህ ኮርስ ነጻ ፕሪቪው የለም”.
- **Multiple Cloudinary accounts:** Admin › Cloudinary Accounts (add/edit/remove after deployment, secrets encrypted). Every upload picks Primary / Secondary / a specific account. Replacing a slide, news/promo image or lesson image overwrites or deletes the old file on Cloudinary.
- **Catalog slideshows & promo boards:** auto-flipping framed slideshows for major groups (9 s, slow fade) and 3 cyan promo boards (news · Telegram community · referral/sponsored), 2 flipping units each (5.5 s), edited in Admin › Promo Boards.
- **Modular monthly plans:** students tick whole groups; the lesson count picks the admin's discount tier (Admin › Settings › discount tiers) live.
- **Telegram bot referrals:** Admin › Telegram Bot — paste the BotFather token + channel; the server sets the webhook. Open the *link admin chat* link once, then send the APK to the bot with caption `/setapk`. Students must save a Telegram username before sharing; milestone tickets arrive in the admin chat with **Approve / Reject** (also in the web admin); approved rewards become course credit.
- **Assignments → PDF → Telegram:** students submit @username, email, notes and up to 12 images; the server builds a PDF and sends it to the admin chat (copy kept on Cloudinary, listed in Admin › Assignments).
- **PWA / offline:** `manifest.json` + `sw.js`. Opened lessons (text + every Cloudinary image) stay available offline.

> No new environment variables are needed. Telegram webhooks need the public **https** Render URL (they don't work on localhost).

## What's new in v2
- **MongoDB Atlas** instead of SQLite (Mongoose models). Data survives every Render deploy and restart.
- **Roles from the database:** the role is read from MongoDB on every request. Set a user's `role` to `"admin"` in Atlas Data Explorer and they get the Admin Studio on their next page load. You can also do this in **Admin › Users & Roles**.
- **Free vs paid courses:** tick **Free course** on any course. Free courses and "free preview" lessons play **without logging in**. Paid courses need login plus payment or a subscription.
- **Show/hide password** eye button on Sign in and Create account.
- **Teacher application form** (`/teach`, no photo upload) and an admin review page.
- **Built-in Amharic/English** translation: plain dictionary files, no extra packages.
- Payment screenshots now go to Cloudinary, because Render's disk is wiped on each deploy.

## Project structure
```
becoming-an-artist/
├── package.json              root scripts used by Render (build + start)
├── render.yaml               Render Blueprint (one web service)
├── .github/workflows/android-apk.yml   builds the Android APK on GitHub
├── server/                   Express API
│   ├── .env.example          every environment variable, explained
│   └── src/
│       ├── index.js          app entry: security, routes, serves client/dist
│       ├── config.js         reads process.env
│       ├── db.js             MongoDB Atlas connection (Mongoose)
│       ├── models/index.js   all Mongoose schemas
│       ├── seed.js           curriculum (EN + AM), contacts, settings, first admin
│       ├── auth.js           login tokens, optionalAuth / requireAuth / requireAdmin
│       ├── lib.js            access rules (free/paid), pricing, settings
│       ├── i18n.js           server messages in Amharic/English
│       ├── notify.js         live notifications (Server-Sent Events)
│       ├── cloudinary.js     signed lesson URLs, uploads, receipts
│       └── routes/           auth, catalog, media, student, teachers, admin
└── client/                   React + Vite + Tailwind (dark/teal brand)
    ├── src/i18n/             am.js (default), en.js, index.jsx (translation system)
    ├── src/components/       Layout, PasswordInput, LanguageToggle, NotificationBell, PaymentForm, …
    ├── src/pages/            Login, TeacherApply, student/*, admin/*
    └── android/              Capacitor Android project
```

## 1. MongoDB Atlas setup
1. **Database Access → Add New Database User:** username + password, role "Read and write to any database".
2. **Network Access → Add IP Address → Allow access from anywhere (`0.0.0.0/0`).** Render's free plan has no fixed IP address, so this is required.
3. Your connection string (`MONGO_URI`):
   ```
   mongodb+srv://USER:PASSWORD@cluster0.aqqojuk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
   Replace `USER` and `PASSWORD`. If the password contains `@ : / ? # [ ] %`, URL-encode those characters (for example `@` becomes `%40`), or choose a password with only letters and numbers.
   The database name comes from `MONGO_DB_NAME` (default `becoming-an-artist`). Collections and seed data are created automatically on first start.

## 2. Deploy on Render (from GitHub)
1. Push this folder to a GitHub repository. `.env` files are ignored, so no secrets get uploaded.
2. In Render: **New → Blueprint →** choose the repo. It reads `render.yaml`.
   (Or **New → Web Service** with Build Command `npm run build`, Start Command `npm start`, Health Check `/api/health`.)
3. Fill in the environment variables it asks for:

| Variable | Value |
|---|---|
| `MONGO_URI` | your Atlas string from step 1 |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from console.cloudinary.com → Settings → API Keys |
| `ADMIN_PASSWORD` | password for `Artistabrham@gmail.com` (8+ characters) |
| `PUBLIC_ORIGIN` | your Render URL, e.g. `https://becoming-an-artist.onrender.com` |
| `JWT_SECRET` | generated automatically by the Blueprint |

4. Deploy. The logs should show `Connected to MongoDB` and `Admin account ready`.
5. Open the site, sign in as the admin, then:
   - **Settings & Pricing:** CBE and Telebirr account details, subscription discount, 1-on-1 prices.
   - **Courses & Media:** set prices, or tick **Free course**. Add Amharic titles and summaries. Upload lessons.
   - In Cloudinary, go to **Settings → Security** and enable **"Allow delivery of PDF and ZIP files"**.

> The free Render plan sleeps after about 15 minutes without visitors, and the first visit afterwards takes about 30–60 seconds. A paid instance stays awake.

## 3. Roles: admin and student
- Everyone who signs up is a **student**.
- The first admin is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` the first time the server starts, if no admin exists yet.
- **Make someone an admin** in either of these ways:
  - **Admin › Users & Roles → Make admin**, or
  - **Atlas → Browse Collections (Data Explorer) → `users`** → edit the user's `role` field to `admin`. Capital letters are accepted too.
- The change applies the next time that person loads a page. Admin routes and pages are refused (403) for anyone whose role isn't admin.

## 4. Free and paid courses
| Course type | Guests (not logged in) | Logged-in student | After payment / subscription |
|---|---|---|---|
| **Free** | ✅ watch everything | ✅ | ✅ |
| **Paid**, "free preview" lesson | ✅ that lesson only | ✅ that lesson | ✅ all |
| **Paid**, other lessons | ❌ asked to sign in | ❌ asked to pay | ✅ |

A price of 0 on a course that isn't marked free shows "Price coming soon", and payment is blocked until you set a price.

## 5. Languages
- Default: **Amharic**. The 🌐 button switches to English, and the choice is remembered on that device.
- All interface text lives in `client/src/i18n/am.js` and `en.js` (same keys in both). To change a translation, edit the text there.
- Course and group titles and summaries have English and Amharic fields, which you edit in Admin. Learning outcomes and grading criteria are shown as written.
- Server messages (errors) follow the same language through the `Accept-Language` header (`server/src/i18n.js`).

## 6. Run on your own computer (optional)
```bash
cp server/.env.example server/.env      # fill it in
npm run build                           # installs everything + builds the site
npm start                               # http://localhost:4000
```
For hot reload during development, run `npm run dev:server` and `npm run dev:client`, then open http://localhost:5173.

## 7. Android app
1. In GitHub, go to **Settings → Secrets and variables → Actions → Variables** and add `API_URL` = your Render URL.
2. Go to **Actions → Build Android APK → Run workflow**, then download the APK from **Artifacts**.
No Cloudinary or MongoDB keys are needed for the app: it only talks to your server.

## API overview
| Area | Endpoints |
|---|---|
| Public | `GET /api/catalog?q=`, `GET /api/courses/:slug`, `GET /api/pricing`, `GET /api/contact`, `GET /api/payment-accounts`, `POST /api/teacher-applications`, `GET /api/media/token/:lessonId` (free/preview without login) |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Student (login) | `/api/me/summary`, `/api/payments`, `/api/bookings`, `/api/course-requests`, `/api/notifications` (+ live stream) |
| Admin | `/api/admin/overview`, `/users`, `/payments`, `/bookings`, `/course-requests`, `/teacher-applications`, `/curriculum`, `/categories`, `/courses`, `/lessons`, `/cloudinary/sign`, `/settings`, `/contacts`, `/submission-links` |

## Backups
In Atlas, download a copy from **Collections → Export**, or use `mongodump` with your `MONGO_URI`. Lesson files and receipts stay in your Cloudinary Media Library.
