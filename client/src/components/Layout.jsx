import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, useApi } from '../api.js';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';
import NotificationBell from './NotificationBell.jsx';

const STUDENT_NAV = [
  { to: '/', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/catalog', label: 'Course Catalog', icon: 'book' },
  { to: '/enrolled', label: 'My Enrolled Courses', icon: 'play' },
  { to: '/sessions', label: '1-on-1 Sessions', icon: 'calendar' },
  { to: '/request', label: 'Request a Course', icon: 'plus' },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/admin/payments', label: 'Payments', icon: 'card', badge: 'pendingPayments' },
  { to: '/admin/bookings', label: '1-on-1 Bookings', icon: 'calendar', badge: 'bookingRequests' },
  { to: '/admin/requests', label: 'Course Requests', icon: 'inbox', badge: 'openCourseRequests' },
  { to: '/admin/courses', label: 'Courses & Media', icon: 'folder' },
  { to: '/admin/settings', label: 'Settings & Pricing', icon: 'settings' },
];

export default function Layout({ portal }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const isAdmin = portal === 'admin';
  const overview = useApi(isAdmin ? '/admin/overview' : null);
  const nav = isAdmin ? ADMIN_NAV : STUDENT_NAV;

  const search = (e) => {
    e.preventDefault();
    navigate(`/catalog?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside className={`${open ? 'flex' : 'hidden'} lg:flex flex-col gap-6 bg-ink-deep border-b lg:border-b-0 lg:border-r border-line px-5 py-7 lg:sticky lg:top-0 lg:h-screen`}>
        <div className="hidden lg:block"><Logo subtitle={isAdmin ? 'INSTRUCTOR STUDIO' : undefined} /></div>
        {!isAdmin && (
          <form onSubmit={search} role="search">
            <label className="label text-xs">Search courses
              <input type="search" className="input text-sm" placeholder="e.g. perspective, chiaroscuro"
                value={q} onChange={(e) => { setQ(e.target.value); if (window.location.pathname === '/catalog') navigate(`/catalog?q=${encodeURIComponent(e.target.value)}`, { replace: true }); }} />
            </label>
          </form>
        )}
        <nav aria-label={isAdmin ? 'Admin navigation' : 'Student navigation'} className="flex flex-col gap-1 text-[15px]">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="flex items-center gap-3"><Icon name={n.icon} />{n.label}</span>
              {n.badge && overview.data?.[n.badge] > 0 && (
                <span className="bg-teal text-[#0B1312] rounded-full px-2 text-xs font-bold">{overview.data[n.badge]}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          {!isAdmin && (
            <div className="card p-4 flex flex-col gap-2.5">
              <span className="eyebrow">Monthly access</span>
              <span className="text-[15px] leading-snug">Unlock every course and save on per-course prices.</span>
              <NavLink to="/subscribe" className="btn-primary text-sm" onClick={() => setOpen(false)}>View subscription</NavLink>
            </div>
          )}
          <button type="button" onClick={signOut} className="nav-link"><span className="flex items-center gap-3"><Icon name="logout" />Sign out</span></button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between gap-4 px-5 lg:px-10 pt-6">
          <div className="flex items-center gap-3 lg:hidden">
            <button type="button" aria-label="Open menu" onClick={() => setOpen(!open)} className="w-11 h-11 rounded-xl border border-line-strong grid place-items-center"><Icon name="menu" /></button>
            <span className="text-teal font-medium">Becoming <span className="font-script text-2xl text-mint-pale">an Artist</span></span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <NotificationBell onNew={() => isAdmin && overview.reload()} />
            <div className="w-11 h-11 rounded-full bg-[#1E3B37] grid place-items-center font-semibold text-mint" title={user?.name}>
              {user?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="px-5 lg:px-10 pt-4 pb-12">
          <Outlet context={{ refreshOverview: overview.reload }} />
        </main>
      </div>
    </div>
  );
}
