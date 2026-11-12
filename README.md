# Becoming an Artist — online art education platform

Student Portal + Instructor/Admin Portal. Lesson **videos and PDFs are hosted on Cloudinary** (fast CDN, automatic compression). The small app server and database run on your PC.

```
Student's browser / Android app
   ├──HTTPS──▶ Cloudflare Tunnel ──▶ your PC: Node/Express :4000
   │                                   ├─ SQLite database (storage/app.db)
   │                                   └─ storage/receipts (payment screenshots)
   │            (server checks the student paid, then returns a signed Cloudinary link)
   └──HTTPS──▶ Cloudinary CDN (res.cloudinary.com) ── private lesson videos & PDFs
```

## Project structure

```
becoming-an-artist/
├── server/                      Node.js + Express API (runs on your PC)
│   ├── .env.example             copy to .env and fill in
│   └── src/
│       ├── index.js             app entry: security headers, routes, serves the built client
│       ├── config.js            env settings
│       ├── schema.sql           database schema (SQLite)
│       ├── db.js                DB connection, access checks, subscription price formula
│       ├── seed.js              4 major groups × 4 sub-courses with outcomes & rubrics, default contacts
│       ├── auth.js              JWT auth, admin guard, short-lived signed media/SSE tokens
│       ├── cloudinary.js        Cloudinary SDK: signed URLs, posters, upload signatures
│       ├── notify.js            real-time notifications (Server-Sent Events)
│       └── routes/
│           ├── auth.js          register / login / me
│           ├── catalog.js       curriculum, course detail, pricing, payment accounts, contacts
│           ├── media.js         🔒 checks access, returns signed Cloudinary video/PDF links
│           ├── student.js       payments (CBE/Telebirr upload), bookings, course requests, notifications
│           └── admin.js         verify payments, bookings, requests, courses/lessons, media browser, settings
└── client/                      React + Vite + Tailwind (dark/teal brand theme)
    ├── tailwind.config.js       brand palette: ink #111B1A, teal #1FA69B/#168078, mint #BFF5F0
    └── src/
        ├── components/          Layout (sidebar), Logo, NotificationBell, PaymentForm, CourseCard, Icon
        ├── pages/Login.jsx
        ├── pages/student/       Dashboard, Catalog (search), CourseDetail (player + outcomes + checkout),
        │                        Enrolled (+ payment history), Sessions (1-on-1), RequestCourse, Subscribe
        └── pages/admin/         AdminDashboard, Payments, Bookings, CourseRequests, CourseManager, Settings
```

## 1. Install (once)

Requires **Node.js 20 or 22 LTS** (https://nodejs.org).

```bash
cd server
npm install
copy .env.example .env        # macOS/Linux: cp .env.example .env
```

Edit `server/.env`:

| Setting | What to put |
|---|---|
| `JWT_SECRET` | run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and paste the result |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from your Cloudinary console (see “Cloudinary setup” below) |
| `ADMIN_PASSWORD` | your admin password (account is created on first start with `ADMIN_EMAIL`) |
| `PUBLIC_ORIGIN` | your public URL once the tunnel is set up (step 3) |

```bash
cd ../client
npm install
npm run build                 # creates client/dist, served by the Node server
```

## 2. Run

```bash
cd server
npm start                     # http://localhost:4000
```

Sign in with `Artistabrham@gmail.com` + your `ADMIN_PASSWORD` → you land in the Instructor Studio.

**First things to do in the admin panel**
1. **Settings & Pricing** → enter your CBE account name/number and Telebirr details, the subscription discount %, and 1-on-1 prices.
2. **Courses & Media** → every seeded course starts at price `0` (“Price soon”). Set real prices, then add lessons by uploading videos/PDFs (they go straight to Cloudinary).

For development with hot reload: run `npm run dev` in `server/` and `npm run dev` in `client/` (Vite proxies `/api` to :4000), then open http://localhost:5173.

## 3. Put it online from your PC (free, no port-forwarding)

Use **Cloudflare Tunnel** — it gives a public HTTPS address that forwards to your PC, hides your home IP, and works behind Ethio Telecom NAT.

Quick test (random URL, changes each time):
```bash
cloudflared tunnel --url http://localhost:4000
```

Permanent address (needs a domain on Cloudflare, e.g. `learn.yourdomain.com`):
```bash
cloudflared tunnel login
cloudflared tunnel create becoming-an-artist
cloudflared tunnel route dns becoming-an-artist learn.yourdomain.com
cloudflared tunnel run --url http://localhost:4000 becoming-an-artist
```
Then set `PUBLIC_ORIGIN=https://learn.yourdomain.com` in `.env`. On Windows, `cloudflared service install` makes it start with your PC.

> The site is reachable only while your PC, the server and the tunnel are running. Keep the PC on power, disable sleep during teaching hours, and consider a UPS for power cuts. Because videos now come from Cloudinary, the server itself is light: if you later want the site always online, it can move to a small VPS unchanged.

## Cloudinary setup (videos & PDFs)

**Where your keys go: only in `server/.env`** on the computer that runs the server:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Find all three at https://console.cloudinary.com → **Settings → API Keys** (the cloud name is at the top of the Dashboard). Restart the server after editing (`npm start`).

- **Do not** put these in `client/`, `client/.env.android`, or the APK. The website and the app never need them. They ask the server, and the server signs everything.
- **GitHub:** the APK workflow does **not** need any Cloudinary values. If you ever deploy the *server* through GitHub Actions or a hosting service, store them as **Secrets** (repo → Settings → Secrets and variables → Actions → **Secrets** tab, not Variables) with the same three names, and pass them to the server as environment variables. `server/.env` is in `.gitignore`, so it won't be pushed by accident.
- **Allow PDFs:** free Cloudinary accounts block PDF delivery by default. Turn on **Settings → Security → “Allow delivery of PDF and ZIP files”**.
- **Plan limits:** check your plan's maximum video file size and monthly credits (storage + bandwidth + transformations) in the Cloudinary console before uploading a full course.

### Adding a lesson (Admin › Courses & Media)
1. Choose a course → **Upload a video or PDF**. The file goes **directly from your browser to Cloudinary** in 20 MB pieces with a progress bar (your server only signs the request). It is stored as a **private** asset in the `becoming-an-artist/lessons` folder.
2. Enter a title, tick “Free preview” if wanted → **Add lesson**.

Already uploaded something in the Cloudinary website? Paste its **public ID** instead. The server checks it exists. Files uploaded there as normal *public* assets work, but are marked “public file” because anyone with the link could open them. Upload through the admin panel to keep them private.

Removing a lesson only removes it from the course; delete the file in your Cloudinary Media Library if you no longer need it.

### How playback is protected
1. Student opens a lesson → the app calls `GET /api/media/token/:lessonId` with their login.
2. The server checks the student bought the course, has an active subscription, or the lesson is a free preview.
3. Only then does it return a **signed** Cloudinary URL (plus a poster image). Private assets can't be opened without a valid signature, and signatures can't be made without your API secret.
4. The video plays straight from Cloudinary's CDN as an optimised MP4 (max 1280 px wide, automatic quality). That version is prepared right after upload, so students don't wait.

Signed links don't expire on their own, so a student could share one. If your Cloudinary plan includes **token-based authentication**, set `CLOUDINARY_AUTH_TOKEN_KEY` in `server/.env` and links will expire after 2 hours. No web player can fully stop screen recording.

## Payments (CBE & Telebirr)

1. Student picks a course or the monthly plan → chooses **CBE** or **Telebirr** → sees the exact amount and your account details (from Settings).
2. Student pays in their banking app, then uploads the **screenshot** + **transaction reference ID** (duplicate references are rejected).
3. You get a live notification → **Payments** shows the receipt; **Approve & unlock** grants access instantly and notifies the student. Rejecting sends your note back.
4. Subscription approval adds one month (stacks if already subscribed).

**Subscription price** = sum of all published course prices × (1 − discount %). Or set a fixed monthly price in Settings.

## 1-on-1 sessions

Request (online / in person, date & time, topic) → you approve with a price and a meeting link/address → the student is notified and pays the same way → booking becomes **paid** → mark **completed**.

## Notifications

In-app bell updates live through Server-Sent Events. Students are notified when you publish a new course, approve/reject a payment, or answer a booking; you are notified of new payments, bookings and course requests. If the student allows browser notifications, they also get a system pop-up when the tab is in the background.

## Database schema (summary — full DDL in `server/src/schema.sql`)

| Table | Purpose |
|---|---|
| `users` | students and admin (role) |
| `categories` | major groups (Drawing Fundamentals, Color Theory, …) |
| `courses` | sub-courses: summary, learning outcomes, deliverables, evaluation criteria (JSON with weights), price, submission link, published |
| `lessons` | video/PDF lessons → Cloudinary public ID, resource type, private/public, size, duration, free-preview flag |
| `enrollments` | per-course purchases |
| `subscriptions` | monthly all-access periods |
| `payments` | CBE/Telebirr submissions: amount, reference, screenshot, status, admin note |
| `bookings` | 1-on-1 requests, price, meeting details, status |
| `course_requests` | custom topics requested by students |
| `notifications` | per-user in-app notifications |
| `contact_info` | editable email/phone/Telegram/addresses |
| `submission_links` | Telegram / Email / Google Form critique links (default + per-course) |
| `settings` | payment accounts, discount %, fixed monthly price, session prices |

## Backups

Everything important is in `server/storage/` (database + receipts). Copy that folder to a USB drive or Google Drive weekly. Lesson files live in Cloudinary; keep your original video files too.

## Android app (APK)

The `client/android/` folder is a ready Android project (Capacitor) that packages the same student and admin portals as an installable app, with your logo as the app icon and splash screen. The app connects to your server over the internet (videos load from Cloudinary), so set up the Cloudflare Tunnel with a permanent address first (section 3).

**Option A: build in the cloud, no Android tools needed (recommended)**
1. Push this project to a GitHub repository (it can be private).
2. In the repository, open **Settings → Secrets and variables → Actions → Variables** and add `API_URL` = your tunnel address, e.g. `https://learn.yourdomain.com`.
3. Open **Actions → Build Android APK → Run workflow**. When the run finishes (about 5–8 minutes), download `becoming-an-artist-apk` from **Artifacts**.
4. Send the `.apk` to students on Telegram. On Android they tap it and allow "Install unknown apps".

**Option B: build on your PC with Android Studio**
1. Install Android Studio (it includes the Android SDK and Java).
2. Put your server address in `client/.env.android` (`VITE_API_URL=https://learn.yourdomain.com`).
3. In `client/`: `npm install`, then `npm run build:android`, then `npm run android:open`.
4. In Android Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.

Notes
- Rebuild the APK whenever you change the server address or the app's screens. Course content, prices and settings come live from your server and need no rebuild.
- In `server/.env`, keep `PUBLIC_ORIGIN` set to your website address; the app's own origin (`https://localhost`) is already allowed.
- The workflow builds a *debug* APK, which is fine for direct sharing. Publishing on Google Play needs a signed release build (Android Studio → Build → Generate Signed Bundle) and a Play Console account.
- To change the icon, replace the images in `client/assets/` and run `npm run android:icons`.
