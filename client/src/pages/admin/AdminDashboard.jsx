import { Link } from 'react-router-dom';
import { useApi, useAuth, fmtDate } from '../../api.js';

export default function AdminDashboard() {
  const { user } = useAuth();
  const o = useApi('/admin/overview');
  const notes = useApi('/notifications');
  const d = o.data;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Welcome, {user.name}</h1>
        <Link to="/admin/courses" className="btn-primary">+ New course</Link>
      </div>
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Overview">
        <Stat to="/admin/payments" label="Payments to verify" value={d?.pendingPayments} highlight />
        <Stat to="/admin/bookings" label="Booking requests" value={d?.bookingRequests} />
        <Stat to="/admin/requests" label="Open course requests" value={d?.openCourseRequests} />
        <Stat label="Active subscribers" value={d?.activeSubscribers} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Recent activity</h2>
        <div className="card p-2">
          {notes.data?.length === 0 && <p className="p-4 text-muted text-sm">Nothing yet — new payments, bookings and requests will appear here instantly.</p>}
          {notes.data?.slice(0, 12).map((n) => (
            <Link key={n.id} to={n.link || '#'} className="block p-4 rounded-xl hover:bg-ink border-b border-line last:border-0">
              <span className="block text-sm font-semibold text-mint">{n.title}</span>
              <span className="block text-[13px] text-muted-soft">{n.body}</span>
              <span className="block text-xs text-muted-dim mt-1">{fmtDate(n.created_at)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, to, highlight }) {
  const body = (
    <>
      <p className="text-[13px] text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${highlight ? 'text-teal-soft' : ''}`}>{value ?? '…'}</p>
    </>
  );
  return to ? <Link to={to} className="card p-5 hover:border-teal">{body}</Link> : <div className="card p-5">{body}</div>;
}
