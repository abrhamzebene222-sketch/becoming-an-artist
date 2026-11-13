import { Link } from 'react-router-dom';
import { useApi, useAuth, etb, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import PaymentForm from '../../components/PaymentForm.jsx';

export default function Subscribe() {
  const { t } = useI18n();
  const { user } = useAuth();
  const pricing = useApi('/pricing');
  const summary = useApi(user ? '/me/summary' : null, [user?.id]);
  const p = pricing.data;
  const sub = summary.data?.subscription;

  return (
    <div className="grid xl:grid-cols-[1fr_420px] gap-8 items-start">
      <div className="flex flex-col gap-6">
        <div>
          <span className="eyebrow">{t('subscribe.eyebrow')}</span>
          <h1 className="text-3xl font-semibold mt-1">{t('subscribe.title')}</h1>
          <p className="text-muted-soft mt-2 max-w-xl">{t('subscribe.text')}</p>
        </div>
        {p && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card p-5"><p className="text-sm text-muted">{t('subscribe.separately')}</p><p className="text-2xl font-semibold mt-2 line-through decoration-muted-dim">{etb(p.allCoursesTotal)}</p></div>
            <div className="card p-5 border-teal"><p className="text-sm text-muted">{t('subscribe.monthly')}</p><p className="text-2xl font-semibold mt-2 text-teal-soft">{etb(p.monthlyPrice)}</p></div>
            <div className="card p-5"><p className="text-sm text-muted">{t('subscribe.youSave')}</p><p className="text-2xl font-semibold mt-2">{p.savingsPercent}%</p></div>
          </div>
        )}
        {sub && <p className="rounded-xl bg-teal-active p-4 text-mint">{t('subscribe.active', { date: fmtDate(sub.endsAt, false) })}</p>}
      </div>
      <aside className="card p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t('subscribe.payMonth')}</h2>
        {user
          ? <PaymentForm purpose="subscription" amount={p?.monthlyPrice} onDone={summary.reload} />
          : <Link to="/login" state={{ from: '/subscribe' }} className="btn-primary">{t('subscribe.signIn')}</Link>}
      </aside>
    </div>
  );
}
