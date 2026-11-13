import { Link, useSearchParams } from 'react-router-dom';
import { useApi, useAuth } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import CourseCard from '../../components/CourseCard.jsx';

// Public page — guests can browse everything and open free courses.
export default function Catalog() {
  const { t, loc } = useI18n();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const catalog = useApi(`/catalog?q=${encodeURIComponent(q)}`);
  const summary = useApi(user ? '/me/summary' : null, [user?.id]);
  const subscribed = !!summary.data?.subscription;
  const ownedIds = new Set(summary.data?.enrolled?.map((c) => c.id));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('catalog.title')}</h1>
          <p className="text-muted mt-1">{t('catalog.subtitle')}</p>
        </div>
        <label className="label w-full sm:w-80">{t('catalog.filter')}
          <input type="search" className="input" value={q} placeholder={t('catalog.filterPlaceholder')}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })} />
        </label>
      </div>
      {user === null && (
        <p className="rounded-xl bg-teal-active/60 border border-line p-4 text-sm text-mint">
          {t('catalog.guestBanner')} <Link to="/login" state={{ from: '/catalog' }} className="font-semibold">{t('nav.signIn')}</Link>
        </p>
      )}
      {catalog.data?.length === 0 && (
        <p className="text-muted">{t('catalog.noMatch', { q })} {user && <Link to="/request">{t('catalog.requestIt')}</Link>}</p>
      )}
      {catalog.data?.map((cat, i) => (
        <section key={cat.id} id={cat.slug} className="flex flex-col gap-4">
          <div>
            <span className="eyebrow">{t('catalog.majorGroup', { n: i + 1 })}</span>
            <h2 className="text-2xl font-semibold">{loc(cat, 'title')}</h2>
            {loc(cat, 'description') && <p className="text-muted-soft text-sm mt-1">{loc(cat, 'description')}</p>}
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cat.courses.map((c) => <CourseCard key={c.id} course={c} owned={subscribed || ownedIds.has(c.id)} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
