import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, API_BASE, fmtDate } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';

/** Renders a stored notification in the reader's current language (from its type + params). */
export function useNotificationText() {
  const { t, lang } = useI18n();
  return (n) => {
    const p = n.params || {};
    const base = `notif.${n.type}`;
    const title = t(`${base}.title`);
    if (title === `${base}.title`) return { title: n.title, body: n.body }; // unknown type → English fallback
    let body;
    switch (n.type) {
      case 'payment_approved': body = t(`${base}.${p.purpose || 'course'}`); break;
      case 'payment_rejected': body = p.note || t(`${base}.body`); break;
      case 'booking_rejected': body = p.note || t(`${base}.body`); break;
      case 'booking_new': body = t(`${base}.body`, { name: p.name, mode: p.mode === 'online' ? t('common.online') : t('common.inPerson') }) + (p.when ? ` · ${fmtDate(p.when)}` : ''); break;
      case 'payment_new': body = t(`${base}.body`, { ...p, method: p.method === 'TELEBIRR' ? t('pay.telebirr') : t('pay.cbe') }); break;
      case 'course_new': body = t(`${base}.body`, { title: (lang === 'am' && p.titleAm) || p.title }); break;
      default: body = t(`${base}.body`, p);
    }
    return { title, body };
  };
}

export default function NotificationBell({ onNew }) {
  const { t } = useI18n();
  const text = useNotificationText();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;
  const unread = items.filter((n) => !n.isRead).length;

  useEffect(() => {
    let es; let stopped = false; let timer;
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
            const tx = text(n);
            try { new Notification(tx.title, { body: tx.body }); } catch { /* not supported in this browser */ }
          }
        });
        es.onerror = () => { es.close(); if (!stopped) timer = setTimeout(connect, 5000); };
      } catch { if (!stopped) timer = setTimeout(connect, 15000); }
    };
    connect();
    return () => { stopped = true; clearTimeout(timer); es?.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async () => {
    setOpen(!open);
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
    if (!open && unread) {
      await api('/notifications/read', { method: 'POST' }).catch(() => {});
      setTimeout(() => setItems((p) => p.map((n) => ({ ...n, isRead: true }))), 1500);
    }
  };

  return (
    <div className="relative">
      <button type="button" onClick={toggle} aria-label={t('notif.aria', { n: unread })} aria-expanded={open}
        className="relative w-11 h-11 rounded-xl border border-line-strong bg-ink-panel grid place-items-center hover:border-teal">
        <Icon name="bell" size={20} />
        {unread > 0 && <span className="absolute -top-1.5 -right-1.5 bg-teal text-[#0B1312] text-[11px] font-bold rounded-full px-1.5 min-w-5">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(360px,calc(100vw-2rem))] card p-2 z-30 shadow-2xl max-h-[70vh] overflow-auto">
          <p className="px-3 pt-2 pb-1 text-xs eyebrow">{t('notif.title')}</p>
          {items.length === 0 && <p className="p-4 text-sm text-muted">{t('notif.empty')}</p>}
          {items.map((n) => {
            const tx = text(n);
            return (
              <Link key={n.id} to={n.link || '#'} onClick={() => setOpen(false)}
                className={`block p-3.5 rounded-xl hover:bg-ink ${n.isRead ? '' : 'bg-teal-active/40'}`}>
                <span className="block text-sm font-semibold text-mint">{tx.title}</span>
                {tx.body && <span className="block text-[13px] text-muted-soft mt-0.5">{tx.body}</span>}
                <span className="block text-xs text-muted-dim mt-1">{fmtDate(n.createdAt)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

