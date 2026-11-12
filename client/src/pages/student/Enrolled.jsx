import { Link } from 'react-router-dom';
import { useApi, fmtDate, etb } from '../../api.js';
import CourseCard from '../../components/CourseCard.jsx';

export default function Enrolled() {
  const summary = useApi('/me/summary');
  const payments = useApi('/payments');
  const s = summary.data;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">My Enrolled Courses</h1>
        {s?.subscription && <p className="text-teal-soft mt-1">Monthly subscription active until {fmtDate(s.subscription.ends_at)}</p>}
      </div>
      {s && s.enrolled.length === 0 && <div className="card p-6 text-muted-soft">No unlocked courses yet. <Link to="/catalog">Browse the catalog</Link>.</div>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {s?.enrolled.map((c) => <CourseCard key={c.id} course={c} category={c.category_title} owned />)}
      </div>

      <section id="payments" className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Payment history</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th className="p-3 font-medium">Date</th><th className="p-3 font-medium">For</th><th className="p-3 font-medium">Method · Ref</th><th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {payments.data?.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-3">{fmtDate(p.created_at)}</td>
                  <td className="p-3 capitalize">{p.purpose}</td>
                  <td className="p-3">{p.method} · {p.reference_id}</td>
                  <td className="p-3">{etb(p.amount_etb)}</td>
                  <td className="p-3"><StatusPill status={p.status} />{p.admin_note && <span className="block text-xs text-muted mt-1">{p.admin_note}</span>}</td>
                </tr>
              ))}
              {payments.data?.length === 0 && <tr><td colSpan={5} className="p-4 text-muted">No payments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function StatusPill({ status }) {
  const tone = { pending: 'bg-[#3A3420] text-[#F2D98A]', requested: 'bg-[#3A3420] text-[#F2D98A]', open: 'bg-[#3A3420] text-[#F2D98A]',
    approved: 'bg-teal-active text-mint', paid: 'bg-teal-active text-mint', completed: 'bg-teal-active text-mint', planned: 'bg-teal-active text-mint', done: 'bg-teal-active text-mint',
    rejected: 'bg-[#3A2220] text-[#F2A7A0]', declined: 'bg-[#3A2220] text-[#F2A7A0]' }[status] || 'bg-line text-muted-soft';
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>{status.replace('_', ' ')}</span>;
}
