// Installed app version (Android/iOS app only) + "dismissed" memory for the update card.
// The website / PWA is always the newest build, so it has no installed version and never shows the card.
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

const DISMISS_KEY = 'baa_update_dismissed';

/** { code, name } of the installed app, or null (website, or the plugin could not be read). */
export async function installedVersion() {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const info = await CapApp.getInfo(); // { version: versionName, build: versionCode }
    const code = parseInt(info.build, 10);
    return Number.isFinite(code) ? { code, name: info.version || '' } : null;
  } catch { return null; }
}

export function dismissedCode() {
  try { return parseInt(localStorage.getItem(DISMISS_KEY), 10) || 0; } catch { return 0; }
}
export function dismissCode(code) {
  try { localStorage.setItem(DISMISS_KEY, String(code)); } catch { /* private mode */ }
}
