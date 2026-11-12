import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, API_BASE } from '../api.js';
import Icon from './Icon.jsx';

/** In-app notifications (live via Server-Sent Events) + optional browser push-style alerts. */
export default function NotificationBell({ onNew }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;
  const unread = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    let es;
    let stopped = false;
    api('/notifications').then(setItems).catch(() => {});
    const connect = async () => {
      try {
        const { token } = await api('/notifications/stream-token');
        if (stopped) return;
        es = new EventSource(`${API_BASE}/api/notifications/stream?t=${token}`);
        es.addEventListener('notification', (e) => {
          const n = JSON.parse(e.data);
          setItems((prev) => [n, ...prev]);
          onNewRef.current?.(n);
          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            new Notification(n.title, { body: n.body });
          }
        });
        es.onerror = () => { es.close(); if (!stopped) setTimeout(connect, 5000); };
      } catch { if (!stopped) setTimeout(connect, 10000); }
    };
    connect();
    return () => { stopped = true; es?.close(); };
  }, []);

  const toggle = async () => {
    setOpen(!open);
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    if (!open && unread) {
      await api('/notifications/read', { method: 'POST' }).catch(() => {});
      setTimeout(() => setItems((p) => p.map((n) => ({ ...n, is_read: 1 }))), 1500);
    }
  };

  return (
    <div className="relative">
      <button type="button" onClick={toggle} aria-label={`Notifications, ${unread} unread`} aria-expanded={open}
        className="relative w-11 h-11 rounded-xl border border-line-strong bg-ink-panel grid place-items-center hover:border-teal">
        <Icon name="bell" size={20} />
        {unread > 0 && <span className="absolute -top-1.5 -right-1.5 bg-teal text-[#0B1312] text-[11px] font-bold rounded-full px-1.5 min-w-5">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(360px,calc(100vw-2rem))] card p-2 z-30 shadow-2xl max-h-[70vh] overflow-auto">
          {items.length === 0 && <p className="p-4 text-sm text-muted">No notifications yet.</p>}
          {items.map((n) => (
            <Link key={n.id} to={n.link || '#'} onClick={() => setOpen(false)}
              className={`block p-3.5 rounded-xl hover:bg-ink ${n.is_read ? '' : 'bg-teal-active/40'}`}>
              <span className="block text-sm font-semibold text-mint">{n.title}</span>
              {n.body && <span className="block text-[13px] text-muted-soft mt-0.5">{n.body}</span>}
              <span className="block text-xs text-muted-dim mt-1">{new Date(n.created_at.replace(' ', 'T') + 'Z').toLocaleString()}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
