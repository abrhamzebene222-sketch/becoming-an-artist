import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { useAuth } from '../api.js';
import { goBack, runBackHandlers } from '../lib/backButton.js';

/** Android hardware/system Back: close menu -> go back screen by screen -> at the main screen minimise the app. */
export default function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const latest = useRef({ navigate, pathname: location.pathname, user });
  latest.current = { navigate, pathname: location.pathname, user };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined; // browsers keep their own Back button
    let handle;
    let cancelled = false;
    CapApp.addListener('backButton', () => {
      if (runBackHandlers()) return;
      const { navigate: nav, pathname, user: u } = latest.current;
      if (goBack(nav, pathname, u)) return;
      CapApp.minimizeApp().catch(() => CapApp.exitApp());
    }).then((h) => { if (cancelled) h.remove(); else handle = h; });
    return () => { cancelled = true; if (handle) handle.remove(); };
  }, []);

  return null;
}
