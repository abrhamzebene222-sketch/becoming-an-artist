import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useApi } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';
import NotificationBell from './NotificationBell.jsx';
import LanguageToggle from './LanguageToggle.jsx';

// `auth: true` items are only shown to logged-in users
const STUDENT_NAV = [
  { to: '/', key: 'dashboard', icon: 'grid', end: true, auth: true },
  { to: '/catalog', key: 'catalog', icon: 'book' },
  { to: '/enrolled', key: 'enrolled', icon: 'play', auth: true },
  { to: '/sessions', key: 'sessions', icon: 'calendar', auth: true },
  { to: '/request', key: 'request', icon: 'plus', auth: true },
  { to: '/teach', key: 'teach', icon: 'brush' },
];

const ADMIN_NAV = [
  { to: '/admin', key: 'dashboard', icon: 'grid', end: true },
  { to: '/admin/payments', key: 'payments', icon: 'card', badge: 'pendingPayments' },
  { to: '/admin/bookings', key: 'bookings', icon: 'calendar', badge: 'bookingRequests' },
  { to: '/admin/requests', key: 'requests', icon: 'inbox', badge: 'openCourseRequests' },
  { to: '/admin/teachers', key: 'teachers', icon: 'brush', badge: 'newTeacherApplications' },
  { to: '/admin/courses', key: 'courses', icon: 'folder' },
  { to: '/admin/settings', key: 'settings', icon: 'settings' },
  { to: '/admin/users', key: 'users', icon: 'users' },
];

export default function Layout({ portal }) {
  const { user, signOut, isAdmin } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const adminPortal = portal === 'admin';
  const overview = useApi(adminPortal ? '/admin/overview' : null);
  const nav = (adminPortal ? ADMIN_NAV : STUDENT_NAV).filter((n) => !n.auth || user);

  const goSearch = (value) => navigate(`/catalog?q=${encodeURIComponent(value)}`, { replace: location.pathname === '/catalog' });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <aside className={`${open ? 'flex' : 'hidden'} lg:flex flex-col gap-6 bg-ink-deep border-b lg:border-b-0 lg:border-r border-line px-5 py-7 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto`}>
        <Link to="/" className="hidden lg:block" onClick={() => setOpen(false)}><Logo studio={adminPortal} /></Link>
        {!adminPortal && (
          <form onSubmit={(e) => { e.preventDefault(); goSearch(q); setOpen(false); }} role="search">
            <label className="label text-xs">{t('nav.search')}
              <input type="search" className="input text-sm" placeholder={t('nav.searchPlaceholder')} value={q}
                onChange={(e) => { setQ(e.target.value); if (location.pathname === '/catalog') goSearch(e.target.value); }} />
            </label>
          </form>
        )}
        <nav aria-label={adminPortal ? t('nav.adminNav') : t('nav.studentNav')} className="flex flex-col gap-1 text-[15px]">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="flex items-center gap-3"><Icon name={n.icon} />{t(`nav.${n.key}`)}</span>
              {n.badge && overview.data?.[n.badge] > 0 && (
                <span className="bg-teal text-[#0B1312] rounded-full px-2 text-xs font-bold">{overview.data[n.badge]}</span>
              )}
            </NavLink>
          ))}
          {adminPortal && (
            <NavLink to="/catalog" className="nav-link"><span className="flex items-center gap-3"><Icon name="book" />{t('nav.studentView')}</span></NavLink>
          )}
          {!adminPortal && isAdmin && (
            <NavLink to="/admin" className="nav-link"><span className="flex items-center gap-3"><Icon name="settings" />{t('app.studio')}</span></NavLink>
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          {!adminPortal && (
            <div className="card p-4 flex flex-col gap-2.5">
              <span className="eyebrow">{t('nav.monthlyAccess')}</span>
              <span className="text-[15px] leading-snug">{t('nav.monthlyAccessText')}</span>
              <NavLink to="/subscribe" className="btn-primary text-sm" onClick={() => setOpen(false)}>{t('nav.viewSubscription')}</NavLink>
            </div>
          )}
          {user ? (
            <button type="button" onClick={() => { signOut(); navigate('/catalog'); }} className="nav-link">
              <span className="flex items-center gap-3"><Icon name="logout" />{t('nav.signOut')}</span>
            </button>
          ) : (
            <Link to="/login" state={{ from: location.pathname }} className="btn-ghost"><Icon name="login" />{t('nav.signIn')}</Link>
          )}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between gap-3 px-4 lg:px-10 pt-5">
          <div className="flex items-center gap-3 lg:hidden min-w-0">
            <button type="button" aria-label={t('nav.menu')} aria-expanded={open} onClick={() => setOpen(!open)}
              className="w-11 h-11 shrink-0 rounded-xl border border-line-strong grid place-items-center"><Icon name="menu" /></button>
            <Link to="/" className="text-teal font-medium truncate" lang="en">Becoming <span className="font-script text-2xl text-mint-pale">an Artist</span></Link>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2.5">
            <LanguageToggle />
            {user ? (
              <>
                <NotificationBell onNew={() => adminPortal && overview.reload()} />
                <div className="w-11 h-11 rounded-full bg-[#1E3B37] grid place-items-center font-semibold text-mint" title={user.name}>
                  {user.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              </>
            ) : (
              <Link to="/login" state={{ from: location.pathname }} className="btn-primary py-2.5 hidden sm:inline-flex">{t('nav.signIn')}</Link>
            )}
          </div>
        </header>
        <main className="px-4 lg:px-10 pt-4 pb-12">
          <Outlet context={{ refreshOverview: overview.reload }} />
        </main>
      </div>
    </div>
  );
}
