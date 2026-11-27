# App update notice — what changed

Copy the files over the project (same folders). No new npm packages. No env changes.

## How it works
- Admin › **App updates**: version name, version code, notes EN/AM, mandatory, Telegram post link.
  Optionally attach the APK and tick "Send to channel": the bot posts it to the channel set in Admin › Telegram bot
  (bot must be a channel admin; limit ~50 MB) and the post link is filled in for you when the channel is public.
  Over 50 MB: post it in the channel yourself and paste the link.
- Students (Android app) see a dismissible "New update available" card on every student page when the
  newest active version code is higher than the installed one. Mandatory = no dismiss button
  (it also stays mandatory if any skipped version in between was mandatory). Offline/errors = nothing shown.
- Public endpoint: `GET /api/app-version?code=<installed>` (never cached by the service worker).

## Important
- The installed version is read from the native app (`@capacitor/app` getInfo): **versionCode** in
  `client/android/app/build.gradle` must be raised for every APK you release, and match the code you publish here.
- The website/PWA never shows the card (it is always the latest build).
- If a version has no post link and no public channel username, students do not see it (admin list warns).
