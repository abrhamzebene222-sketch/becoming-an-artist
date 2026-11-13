import { Link } from 'react-router-dom';
import { useApi, useAuth, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, loc, lang } = useI18n();
  const summary = useApi('/me/summary');
  const catalog = useApi('/catalog');
  const contact = useApi('/contact');
  const s = summary.data;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-sm text-muted">{new Date().toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="text-3xl font-semibold mt-1">{t('dash.greeting', { name: user.name.split(' ')[0] })}</h1>
      </div>

      <section className="grid sm:grid-cols-3 gap-4" aria-label={t('nav.dashboard')}>
        <Stat label={t('dash.enrolledCourses')} value={s ? (s.subscription ? t('dash.subscribedAll') : s.enrolled.length) : '…'} />
        <Stat label={t('dash.pendingPayments')} value={s?.pendingPayments ?? '…'} />
        <Stat label={t('dash.nextSession')} value={s?.nextSession ? fmtDate(s.nextSession.preferredAt) : t('dash.noSession')} small />
      </section>

      <div className="grid xl:grid-cols-[1.6fr_1fr] gap-6">
        <section className="flex flex-col gap-4 min-w-0">
          <h2 className="text-xl font-semibold">{t('dash.continueLearning')}</h2>
          {s?.enrolled.length === 0 && (
            <div className="card p-6 text-muted-soft">{t('dash.noCourses')} <Link to="/catalog">{t('dash.browseCatalog')}</Link></div>
          )}
          {s?.enrolled.slice(0, 4).map((c) => (
            <Link key={c.id} to={`/courses/${c.slug}`} className="card p-4 flex items-center gap-4 hover:border-teal">
              <div className="w-20 h-14 rounded-lg bg-ink-deep border border-line-strong grid place-items-center text-teal-soft shrink-0">▶</div>
              <div className="min-w-0 flex-1">
                <span className="eyebrow">{loc(c.category, 'title')}</span>
                <p className="font-semibold truncate">{loc(c, 'title')}</p>
              </div>
              <span className="btn-primary py-2.5 hidden sm:inline-flex">{t('common.open')}</span>
            </Link>
          ))}

          <h2 className="text-xl font-semibold mt-3">{t('dash.curriculum')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {catalog.data?.map((cat, i) => (
              <Link key={cat.id} to={`/catalog#${cat.slug}`} className="card p-5 flex flex-col gap-2 hover:border-teal">
                <span className="eyebrow">{t('dash.group', { n: i + 1 })}</span>
                <span className="font-semibold">{loc(cat, 'title')}</span>
                <span className="text-sm text-muted leading-relaxed">{cat.courses.map((c) => loc(c, 'title')).join(' · ')}</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{t('dash.submitWork')}</h2>
          <div className="card p-5 flex flex-col gap-2.5">
            <span className="text-sm text-muted-soft">{t('dash.submitWorkText')}</span>
            {contact.data?.submissionLinks.map((l) => (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="text-sm">{l.label}</a>
            ))}
          </div>
          <h2 className="text-xl font-semibold">{t('dash.contact')}</h2>
          <div className="card p-5 flex flex-col gap-2 text-sm">
            {contact.data?.contacts.map((c) => (
              <div key={c.id} className="flex justify-between gap-3">
                <span className="text-muted">{t(`admin.settings.kinds.${c.kind}`)}</span><span className="text-right break-all">{c.value}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, small }) {
  return (
    <div className="card p-5">
      <p className="text-[13px] text-muted">{label}</p>
      <p className={`mt-2 font-semibold ${small ? 'text-lg' : 'text-3xl'}`}>{value}</p>
    </div>
  );
}
