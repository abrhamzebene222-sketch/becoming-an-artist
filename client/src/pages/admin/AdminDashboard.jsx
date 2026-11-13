import { Link } from 'react-router-dom';
import { useApi, useAuth, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import { useNotificationText } from '../../components/NotificationBell.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const text = useNotificationText();
  const o = useApi('/admin/overview');
  const notes = useApi('/notifications');
  const d = o.data;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{t('admin.welcome', { name: user.name })}</h1>
        <Link to="/admin/courses" className="btn-primary">{t('admin.newCourse')}</Link>
      </div>
      <section className="grid grid-cols-2 xl:grid-cols-5 gap-4" aria-label={t('nav.dashboard')}>
        <Stat to="/admin/payments" label={t('admin.pendingPayments')} value={d?.pendingPayments} highlight />
        <Stat to="/admin/bookings" label={t('admin.bookingRequests')} value={d?.bookingRequests} />
        <Stat to="/admin/requests" label={t('admin.openRequests')} value={d?.openCourseRequests} />
        <Stat to="/admin/teachers" label={t('admin.teacherApps')} value={d?.newTeacherApplications} />
        <Stat to="/admin/users" label={t('admin.activeSubs')} value={d ? `${d.activeSubscribers} / ${d.students}` : undefined} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t('admin.recent')}</h2>
        <div className="card p-2">
          {notes.data?.length === 0 && <p className="p-4 text-muted text-sm">{t('admin.recentEmpty')}</p>}
          {notes.data?.slice(0, 15).map((n) => {
            const tx = text(n);
            return (
              <Link key={n.id} to={n.link || '#'} className="block p-4 rounded-xl hover:bg-ink border-b border-line last:border-0">
                <span className="block text-sm font-semibold text-mint">{tx.title}</span>
                <span className="block text-[13px] text-muted-soft">{tx.body}</span>
                <span className="block text-xs text-muted-dim mt-1">{fmtDate(n.createdAt)}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, to, highlight }) {
  return (
    <Link to={to} className="card p-5 hover:border-teal">
      <p className="text-[13px] text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${highlight ? 'text-teal-soft' : ''}`}>{value ?? '…'}</p>
    </Link>
  );
}
