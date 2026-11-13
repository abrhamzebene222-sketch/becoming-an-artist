import { Link } from 'react-router-dom';
import { useApi, fmtDate, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import CourseCard from '../../components/CourseCard.jsx';
import StatusPill from '../../components/StatusPill.jsx';

export default function Enrolled() {
  const { t, loc } = useI18n();
  const summary = useApi('/me/summary');
  const payments = useApi('/payments');
  const s = summary.data;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">{t('enrolled.title')}</h1>
        {s?.subscription && <p className="text-teal-soft mt-1">{t('enrolled.subscribedUntil', { date: fmtDate(s.subscription.endsAt, false) })}</p>}
      </div>
      {s && s.enrolled.length === 0 && <div className="card p-6 text-muted-soft">{t('enrolled.none')} <Link to="/catalog">{t('dash.browseCatalog')}</Link></div>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {s?.enrolled.map((c) => <CourseCard key={c.id} course={c} category={loc(c.category, 'title')} owned />)}
      </div>

      <section id="payments" className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t('enrolled.history')}</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th className="p-3 font-medium">{t('enrolled.date')}</th><th className="p-3 font-medium">{t('enrolled.for')}</th>
              <th className="p-3 font-medium">{t('enrolled.methodRef')}</th><th className="p-3 font-medium">{t('enrolled.amount')}</th>
              <th className="p-3 font-medium">{t('enrolled.status')}</th>
            </tr></thead>
            <tbody>
              {payments.data?.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-3">{fmtDate(p.createdAt)}</td>
                  <td className="p-3">{t(`enrolled.purpose.${p.purpose}`)}{p.course ? ` · ${loc(p.course, 'title')}` : ''}</td>
                  <td className="p-3">{p.method === 'TELEBIRR' ? t('pay.telebirr') : t('pay.cbe')} · {p.referenceId}</td>
                  <td className="p-3">{etb(p.amountEtb)}</td>
                  <td className="p-3"><StatusPill status={p.status} />{p.adminNote && <span className="block text-xs text-muted mt-1">{p.adminNote}</span>}</td>
                </tr>
              ))}
              {payments.data?.length === 0 && <tr><td colSpan={5} className="p-4 text-muted">{t('enrolled.noPayments')}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
