import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api, useApi, useAuth, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import PaymentForm from '../../components/PaymentForm.jsx';
import Icon from '../../components/Icon.jsx';

// Public page. Free courses play for everyone; paid courses need login + purchase (or a preview lesson).
export default function CourseDetail() {
  const { slug } = useParams();
  const { t, loc } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const course = useApi(`/courses/${slug}`, [slug, user?.id]);
  const pricing = useApi('/pricing');
  const [plan, setPlan] = useState('course');
  const [active, setActive] = useState(null);
  const [src, setSrc] = useState(null);      // { url, poster } — signed by our server, served by Cloudinary
  const [err, setErr] = useState('');
  const c = course.data;
  const access = !!c?.hasAccess;

  useEffect(() => {
    setActive(null);
    if (!c) return;
    const first = c.lessons.find((l) => access || l.isPreview);
    if (first) setActive(first);
  }, [c, access]);

  useEffect(() => {
    if (!active) return;
    setSrc(null); setErr('');
    api(`/media/token/${active.id}`).then(setSrc).catch((e) => setErr(e.message));
  }, [active]);

  if (course.error) return <p className="text-muted">{t('course.notFound')}</p>;
  if (!c) return <p className="text-muted">{t('common.loading')}</p>;

  const lessonLabel = (l) => {
    if (access) return l.kind === 'pdf' ? t('course.pdf') : t('course.watch');
    return l.isPreview ? t('course.preview') : t('course.lockedLabel');
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted"><Link to="/catalog">{t('nav.catalog')}</Link> › {loc(c.category, 'title')} › {loc(c, 'title')}</p>
      <div className="grid xl:grid-cols-[1.55fr_1fr] gap-7 items-start">
        <section className="flex flex-col gap-6 min-w-0">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">{loc(c.category, 'title')}</span>
              {c.isFree && <span className="rounded-full bg-teal text-[#0B1312] px-2.5 py-0.5 text-xs font-bold">{t('common.free')}</span>}
            </div>
            <h1 className="text-3xl font-semibold mt-1.5 mb-2">{loc(c, 'title')}</h1>
            <p className="text-muted-soft leading-relaxed">{loc(c, 'summary')}</p>
          </div>

          <div className="aspect-video bg-[#0A100F] border border-line rounded-2xl overflow-hidden grid place-items-center">
            {!active && (
              <span className="flex flex-col items-center gap-3 text-muted text-center p-6">
                <Icon name="lock" size={28} />
                {user ? t('course.locked') : t('course.signInToWatch')}
                {!user && <Link to="/login" state={{ from: location.pathname }} className="btn-primary py-2.5">{t('nav.signIn')}</Link>}
              </span>
            )}
            {active && err && <span className="text-muted p-6 text-center">{err}</span>}
            {active && src && active.kind === 'video' && (
              <video key={src.url} src={src.url} poster={src.poster || undefined} controls playsInline preload="metadata"
                controlsList="nodownload" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} className="w-full h-full bg-black" />
            )}
            {active && src && active.kind === 'pdf' && <iframe key={src.url} src={`${src.url}#toolbar=0`} title={active.title} className="w-full h-full bg-white" />}
          </div>
          {active && src?.kind === 'pdf' && <a href={src.url} target="_blank" rel="noreferrer" className="text-sm self-start">{t('course.pdf')} ↗</a>}

          <div className="card p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold">{t('course.outcomesTitle')}</h2>
            {c.learningOutcomes && <p className="text-sm text-muted-soft leading-relaxed"><strong className="text-white">{t('course.afterCourse')} </strong>{c.learningOutcomes}</p>}
            {c.deliverables && <p className="text-sm text-muted-soft leading-relaxed"><strong className="text-white">{t('course.deliverable')} </strong>{c.deliverables}</p>}
            <div className="flex flex-col gap-2.5 text-sm">
              {c.evaluationCriteria.map((k) => (
                <div key={k.criterion} className="flex justify-between gap-3 px-4 py-3 bg-ink rounded-xl">
                  <span>{k.criterion}</span><span className="text-teal-soft font-semibold">{k.weight}%</span>
                </div>
              ))}
            </div>
            {access && c.submissionLink && (
              <a href={c.submissionLink.url} target="_blank" rel="noreferrer" className="btn-ghost self-start">{t('course.submitWork', { label: c.submissionLink.label })}</a>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-2">{t('course.lessonsTitle')}</h2>
            {c.lessons.length === 0 && <p className="text-sm text-muted">{t('course.noLessons')}</p>}
            <ul>
              {c.lessons.map((l, i) => {
                const open = access || l.isPreview;
                return (
                  <li key={l.id} className="border-b border-line last:border-0">
                    <button type="button" disabled={!open} onClick={() => setActive(l)}
                      className={`w-full flex justify-between gap-3 py-3 text-left text-sm min-h-11 ${active?.id === l.id ? 'text-mint font-semibold' : ''} disabled:cursor-not-allowed`}>
                      <span className="flex items-center gap-2"><Icon name={l.kind === 'pdf' ? 'file' : 'play'} size={15} />{i + 1} · {l.title}</span>
                      <span className={open ? 'text-teal-soft' : 'text-muted-dim'}>{lessonLabel(l)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <aside className="card p-6 flex flex-col gap-5 xl:sticky xl:top-6">
          {c.isFree ? (
            <>
              <h2 className="text-lg font-semibold">{t('course.freeTitle')}</h2>
              <p className="text-sm text-muted-soft">{t('course.freeText')}</p>
            </>
          ) : access ? (
            <p className="text-mint flex items-center gap-2"><Icon name="check" />{t('course.youHaveAccess')}</p>
          ) : !user ? (
            <>
              <h2 className="text-lg font-semibold">{t('course.unlockTitle')}</h2>
              <p className="text-2xl font-semibold">{c.priceEtb ? etb(c.priceEtb) : t('common.priceSoon')}</p>
              <p className="text-sm text-muted-soft">{t('course.signInToBuy')}</p>
              <Link to="/login" state={{ from: location.pathname }} className="btn-primary">{t('nav.signIn')}</Link>
              <Link to="/login?mode=register" state={{ from: location.pathname }} className="btn-ghost">{t('nav.signUp')}</Link>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">{t('course.unlockTitle')}</h2>
              <fieldset className="flex flex-col gap-2.5">
                <legend className="text-sm text-muted mb-2">{t('course.choosePlan')}</legend>
                <PlanOption checked={plan === 'course'} onChange={() => setPlan('course')} title={t('course.thisCourse')} note={t('course.lifetime')}
                  price={c.priceEtb ? etb(c.priceEtb) : t('common.priceSoon')} />
                <PlanOption checked={plan === 'subscription'} onChange={() => setPlan('subscription')} title={t('course.monthlyAll')}
                  note={pricing.data ? t('course.save', { p: pricing.data.savingsPercent }) : ''}
                  price={pricing.data ? `${etb(pricing.data.monthlyPrice)}${t('common.perMonth')}` : '…'} />
              </fieldset>
              <PaymentForm key={plan} purpose={plan} courseId={plan === 'course' ? c.id : undefined}
                amount={plan === 'course' ? c.priceEtb : pricing.data?.monthlyPrice} onDone={course.reload} />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function PlanOption({ checked, onChange, title, note, price }) {
  return (
    <label className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer border ${checked ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
      <input type="radio" name="plan" checked={checked} onChange={onChange} className="accent-teal" />
      <span className="flex-1"><strong>{title}</strong><br /><span className="text-[13px] text-teal-soft">{note}</span></span>
      <span className="font-semibold text-right">{price}</span>
    </label>
  );
}
