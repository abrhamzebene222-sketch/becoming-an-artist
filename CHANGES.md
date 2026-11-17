# Becoming an Artist — v3 changes (drop-in)

Copy these files over your v2 project, keeping the folder paths. Then run `npm install` in `server/` (new packages: **pdfkit**, **sharp**) and redeploy. No new environment variables are needed. Existing data keeps working: current categories become major groups, and current lessons stay on the `.env` Cloudinary account.

## Backend (server/)
| File | Status | What it does |
|---|---|---|
| src/models/index.js | modified | Recursive `Category.parent`, group prices, slides. Lesson `blocks` (text/image/YouTube) and `cloudAccount`. New: GroupEnrollment, CloudinaryAccount, Promo, ReferralCampaign, ReferralShare, RewardTicket, CreditTransaction, Assignment. User gets Telegram fields + `creditEtb`. |
| src/tree.js | **new** | Helpers for the nested tree: ancestors, descendants, cycle check, selection normalising, breadcrumb. |
| src/lib.js | modified | Access through any ancestor group (purchase, credit or monthly plan). Group price. Discount tiers + `groupSubscriptionQuote`. `youtubeId`. |
| src/cloudinary.js | modified | Multi-account registry (env + DB). Primary/Secondary/specific routing. `uploadImage` overwrites (same account) or destroys (other account) the old file. `syncMedia`, `destroyMedia`, `uploadRaw`, `pingAccount`. |
| src/secret.js | **new** | AES-256-GCM encryption for stored Cloudinary secrets and the bot token. |
| src/upload.js | **new** | Memory-only multer configs (nothing written to disk). |
| src/telegram.js | **new** | Bot API over fetch, webhook setup, account linking, share menu (APK / web link / milestones / progress), referral tracking, admin Approve/Reject tickets, credits, PDF delivery. |
| src/routes/admin.js | modified | Nested category CRUD (move, reorder, recursive delete with media cleanup). `/media/upload`. Block lessons. Account-aware signing. Group and group-subscription payment approval. Discount-tier settings. |
| src/routes/adminGrowth.js | **new** | Cloudinary accounts CRUD/test, promo boards, Telegram settings, campaigns, reward tickets, credit adjustments, assignments list. |
| src/routes/catalog.js | modified | Nested `/catalog` (`children`, `ownCourses`, `courses` = whole subtree, `lessonCount`). Course breadcrumb + group offers + `hasPreview`. `/promos`, `/subscription/quote`. |
| src/routes/media.js | modified | `/media/lesson/:id` (blocks + signed file). Per-account signed URLs. |
| src/routes/student.js | modified | Group and group-subscription payments. Summary includes group-unlocked courses, credits and `unlockedGroups`. |
| src/routes/growth.js | **new** | Telegram webhook (processed in order), username guard, link token, referral progress, credits, redeem credit for a course or group. |
| src/routes/assignments.js | **new** | Multi-image submission → PDF (pdfkit + sharp) → admin Telegram chat + Cloudinary copy. |
| src/routes/auth.js | modified | Sign-ups through `?ref=…&c=…` count as shares. `/me` returns Telegram info. |
| src/index.js | modified | Mounts the new routers. CSP for YouTube embeds and the service worker. No-cache for `sw.js`/`manifest.json`. Long cache for `/assets`. |
| src/i18n.js, src/seed.js | modified | New messages (EN/AM). Seeds 6 promo units and default discount tiers. |
| package.json / package-lock.json | modified | + pdfkit, sharp |

## Frontend (client/)
| File | Status | What it does |
|---|---|---|
| public/manifest.json, public/sw.js, public/icons/* | **new** | PWA: offline app shell, network-first API cache, cache-first Cloudinary images; a lesson's images are pre-fetched when it is opened. |
| index.html, src/main.jsx | modified | Manifest/icons, SW registration, referral-link capture. |
| src/api.js | modified | `uploadImage`, `cdn()`, referral on sign-up, SW cache cleared on sign-out. |
| src/lib/tree.js, useRotator.js, youtube.js | **new** | Tree helpers, slideshow timer (pauses on hover or hidden tab), YouTube parsing. |
| components/CategoryTree.jsx | **new** | File-Explorer admin tree with ▸/▾ toggles and add sub-group / add course / delete actions. |
| components/BlockEditor.jsx | **new** | `+ Add Text Box` / `+ Add Image` / `+ Add YouTube video`, with reorder and remove. |
| components/ImageUploader.jsx | **new** | Image field + Primary/Secondary/account selector. |
| components/GroupSlideshow.jsx | **new** | Framed slideshow (object-contain + blurred fill, 9 s / 2.4 s fade, 40%→0% theme gradient). |
| components/PromoBoard.jsx | **new** | Promo board: 2 units flip together (5.5 s), cold cyan gradient, vertical cyan bar. |
| components/TelegramShare.jsx | **new** | Telegram username guard modal + bot deep link. |
| components/GroupPurchase.jsx, LessonContent.jsx | **new** | Buy a whole group (receipt or credit). In-app lesson viewer (video/PDF/text/images/YouTube, offline note). |
| pages/student/Catalog.jsx | modified | Major-group slideshows, nested collapsible sub-groups, boards placed between groups, group buy buttons, credit banner. |
| pages/student/CourseDetail.jsx | modified | Accordion lessons, 🔒 Locked indicators, free preview handling + "ለዚህ ኮርስ ነጻ ፕሪቪው የለም", group offers, unlock with credit, assignment link. |
| pages/student/Subscribe.jsx | modified | Group checklist tree, live lesson count, tier discount and price breakdown. Classic all-courses plan kept. |
| pages/student/Rewards.jsx, Assignment.jsx | **new** | Referral progress, links, tickets and credit history. Assignment form with multiple images. |
| pages/admin/CourseManager.jsx | modified | Explorer tree + group editor (parent, prices, slides) + course editor + block lessons + Free Preview checkbox. |
| pages/admin/CloudinaryAccounts.jsx, Promos.jsx, TelegramBot.jsx, Assignments.jsx | **new** | Admin pages for the new features. |
| pages/admin/Settings.jsx | modified | Discount-tier editor. |
| pages/admin/Payments.jsx, pages/student/Enrolled.jsx, components/PaymentForm.jsx, Layout.jsx, Icon.jsx, App.jsx | modified | Group payments, new routes, nav items, icons. |
| i18n/en.js, i18n/am.js | modified | All new strings in English and Amharic. |

## One-time setup after deploying
1. **Admin › Cloudinary Accounts:** optionally add more accounts and pick Primary/Secondary. The `.env` account still works as before.
2. **Admin › Telegram Bot:** paste the BotFather token and channel → **Save & connect**. Open the *link admin chat* URL from your admin Telegram account. Send the APK file to the bot with the caption `/setapk`. Create a campaign with milestones.
3. **Admin › Promo Boards:** add images and text for the 6 units.
4. **Admin › Courses & Media:** build sub-groups, set group prices and slideshow images, and mark free preview lessons.
5. **Admin › Settings:** adjust the monthly discount tiers.
