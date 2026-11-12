import { useApi, etb, fmtDate } from '../../api.js';
import PaymentForm from '../../components/PaymentForm.jsx';

export default function Subscribe() {
  const pricing = useApi('/pricing');
  const summary = useApi('/me/summary');
  const p = pricing.data;
  const sub = summary.data?.subscription;

  return (
    <div className="grid xl:grid-cols-[1fr_420px] gap-8 items-start">
      <div className="flex flex-col gap-6">
        <div>
          <span className="eyebrow">Monthly subscription</span>
          <h1 className="text-3xl font-semibold mt-1">Every course, one monthly price</h1>
          <p className="text-muted-soft mt-2 max-w-xl">All four major groups — Drawing, Color, Composition and Anatomy — plus every new course added during your month.</p>
        </div>
        {p && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card p-5"><p className="text-sm text-muted">Buying every course separately</p><p className="text-2xl font-semibold mt-2 line-through decoration-muted-dim">{etb(p.allCoursesTotal)}</p></div>
            <div className="card p-5 border-teal"><p className="text-sm text-muted">Monthly subscription</p><p className="text-2xl font-semibold mt-2 text-teal-soft">{etb(p.monthlyPrice)}</p></div>
            <div className="card p-5"><p className="text-sm text-muted">You save</p><p className="text-2xl font-semibold mt-2">{p.savingsPercent}%</p></div>
          </div>
        )}
        {sub && <p className="rounded-xl bg-teal-active p-4 text-mint">You're subscribed until {fmtDate(sub.ends_at)}. Paying again extends it by one month.</p>}
      </div>
      <aside className="card p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Pay for one month</h2>
        <PaymentForm purpose="subscription" amount={p?.monthlyPrice} onDone={summary.reload} />
      </aside>
    </div>
  );
}
