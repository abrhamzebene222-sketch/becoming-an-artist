import { useEffect } from 'react';
import { useAuth } from '../api.js';
import { presync } from '../lib/presync.js';

/** Renders nothing. Quietly refreshes the saved data when the app opens online, comes back to the front, or the phone reconnects. */
export default function PreSync() {
  const { user } = useAuth();
  const checking = user === undefined; // still reading the saved login
  const id = user?.id || null;
  const role = user?.role || null;

  useEffect(() => {
    if (checking) return undefined;
    const me = id ? { id, role } : null;
    const run = (why) => { presync(me, why).catch(() => {}); };
    const onOnline = () => run('online');
    const onVisible = () => { if (document.visibilityState === 'visible') run('start'); };
    run('start');
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [checking, id, role]);

  return null;
}
