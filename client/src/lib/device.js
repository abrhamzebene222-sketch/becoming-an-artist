// Automatic device id: the student never types anything.
//  • Android/iOS app (Capacitor): the phone's own id via @capacitor/device (survives app re-install on the same phone).
//  • Website: a random id kept in this browser (clearing browser data = a "new device").
import { Capacitor } from '@capacitor/core';

const KEY = 'baa_device';
let cached = null;

function browserId() {
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`);
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch { return `mem-${Math.random().toString(16).slice(2)}${Date.now()}`; }
}

export async function getDeviceId() {
  if (cached) return cached;
  if (Capacitor.isNativePlatform()) {
    try {
      const { Device } = await import('@capacitor/device');
      const { identifier } = await Device.getId();
      if (identifier) { cached = `app-${identifier}`; return cached; }
    } catch { /* plugin missing → fall back below */ }
  }
  cached = `web-${browserId()}`;
  return cached;
}
