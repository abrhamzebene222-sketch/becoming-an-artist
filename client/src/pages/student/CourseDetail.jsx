import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api, useApi, useAuth, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import PaymentForm from '../../components/PaymentForm.jsx';
import Icon from '../../components/Icon.jsx';

const mins = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '');

// Public page. Free courses open for everyone; admin-marked FREE PREVIEW lessons open for everyone;
// paid courses need login + purchase (course, sub-group, major group, monthly plan, or referral credit).
export default function CourseDetail() {
  const { slug } = useParams();
  const { t, loc, lang } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const course = useApi(`/courses/${slug}`, [slug, user?.id]);
  const pricing = useApi('/pricing');
  const summary = useApi(user ? '/me/summary' : null, [user?.id]);
  const [plan, setPlan] = useState('course');
  const [creditMsg, setCreditMsg] = useState(null);
  const c = course.data;
  const access = !!c?.hasAccess;
  const credit = summary.data?.creditEtb || 0;

  if (course.error) return <p className="text-muted">{t('course.notFound')}</p>;
  if (!c) return <p className="text-muted">{t('common.loading')}</p>;

  const canOpen = (l) => access || l.isPreview;

  // Purchase options: this course, each group above it that has a price, monthly plans
  const offers = [
    ...(c.priceEtb ? [{ key: 'course', title: t('detail.planCourse'), note: t('course.lifetime'), price: c.priceEtb, purpose: 'course' }] : []),
    ...c.groupOffers.filter((g) => !g.owned).map((g) => ({
      key: `group:${g.id}`, title: t('detail.planGroup', { name: loc(g, 'title') }), note: t('course.lifetime'), price: g.priceEtb, purpose: 'group', group: g,
    })),
    ...(pricing.data?.monthlyPrice ? [{
      key: 'subscription', title: t('course.monthlyAll'), note: t('course.save', { p: pricing.data.savingsPercent }),
      price: pricing.data.monthlyPrice, purpose: 'subscription', monthly: true,
    }] : []),
  ];
  const selected = offers.find((o) => o.key === plan) || offers[0];

  const redeem = async () => {
    setCreditMsg(null);
    try {
      await api('/credits/redeem', { method: 'POST', body: selected.purpose === 'group' ? { type: 'group', id: selected.group.id } : { type: 'course', id: c.id } });
      setCreditMsg({ ok: true, text: t('detail.creditDone') }); course.reload(); summary.reload();
    } catch (e) { setCreditMsg({ ok: false, text: e.message }); }
  };

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted flex flex-wrap gap-x-1.5">
        <Link to="/catalog">{t('nav.catalog')}</Link>
        {c.breadcrumb.map((b) => <span key={b.id}>› {loc(b, 'title')}</span>)}
        <span>› {loc(c, 'title')}</span>
      </nav>
      <div className="grid xl:grid-cols-[1.55fr_1fr] gap-7 items-start">
        <section className="flex flex-col gap-6 min-w-0">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">{loc(c.category, 'title')}</span>
              {c.isFree && <span className="rounded-full bg-teal text-[#0B1312] px-2.5 py-0.5 text-xs font-bold">{t('common.free')}</span>}
              {!c.isFree && !access && <span className="rounded-full border border-[#5A4A2A] bg-[#241E12] text-[#F2D98A] px-2.5 py-0.5 text-xs font-semibold">{t('detail.locked')}</span>}
              {!c.isFree && access && <span className="rounded-full bg-teal-active text-mint px-2.5 py-0.5 text-xs font-semibold">✓ {t('detail.unlocked')}</span>}
            </div>
            <h1 className="text-3xl font-semibold mt-1.5 mb-2">{loc(c, 'title')}</h1>
            <p className="text-muted-soft leading-relaxed">{loc(c, 'summary')}</p>
          </div>

          {/* Lessons list — each lesson opens on its own page (video / PDF / text / images / YouTube) */}
          <div className="card overflow-hidden">
            <div className="p-5 pb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{t('course.lessonsTitle')}</h2>
              <span className="text-sm text-muted">{t('common.lessons', { n: c.lessons.length })}</span>
            </div>
            {!access && !c.isFree && !c.hasPreview && c.lessons.length > 0 && (
              <p className="mx-5 mb-3 rounded-xl border border-[#5A4A2A] bg-[#241E12] p-3.5 text-sm text-[#F2D98A] flex items-start gap-2" role="note">
                <Icon name="lock" size={16} className="mt-0.5 shrink-0" />
                <span><span lang="am">{t('detail.noPreview')}</span>{lang === 'en' && <span className="block text-xs opacity-80">{t('detail.noPreviewEn')}</span>}</span>
              </p>
            )}
            {c.lessons.length === 0 && <p className="px-5 pb-5 text-sm text-muted">{t('course.noLessons')}</p>}
            <ul>
              {c.lessons.map((l, i) => {
                const open = canOpen(l);
                const icon = l.kind === 'pdf' ? 'file' : l.kind === 'video' ? 'play' : l.blockTypes?.includes('youtube') ? 'youtube' : 'text';
                const inner = (
                  <>
                    <Icon name={icon} size={16} className={open ? 'text-teal-soft shrink-0' : 'text-muted-dim shrink-0'} />
                    <span className="flex-1 min-w-0 truncate">{i + 1} · {l.title}</span>
                    {l.durationSec ? <span className="text-xs text-muted-dim hidden sm:inline">{mins(l.durationSec)}</span> : null}
                    {!access && l.isPreview && <span className="rounded-full bg-teal text-[#0B1312] px-2 py-0.5 text-[11px] font-bold shrink-0">{t('detail.previewTag')}</span>}
                    {!open && <span className="text-xs text-[#F2D98A] shrink-0">{t('detail.locked')}</span>}
                    {open && <span aria-hidden="true" className="shrink-0 text-muted text-xl leading-none">›</span>}
                  </>
                );
                return (
                  <li key={l.id} className="border-t border-line">
                    {open ? (
                      <Link to={`/courses/${slug}/lessons/${l.id}`}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-left text-sm min-h-12 hover:bg-ink/60">{inner}</Link>
                    ) : (
                      <div aria-disabled="true" className="w-full flex items-center gap-3 px-5 py-3.5 text-left text-sm min-h-12 cursor-not-allowed">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            {!access && !user && !c.isFree && (
              <div className="p-5 border-t border-line flex flex-wrap items-center gap-3 text-sm text-muted">
                <Icon name="lock" />{t('course.signInToWatch')}
                <Link to="/login" state={{ from: location.pathname }} className="btn-primary py-2.5">{t('nav.signIn')}</Link>
              </div>
            )}
          </div>

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
            <div className="flex flex-wrap gap-3">
              {access && user && (
                <Link to={`/assignment?course=${c.id}`} className="btn-primary self-start"><Icon name="send" size={16} />Submit assignment to instructor</Link>
              )}
              {access && c.submissionLink && (
                <a href={c.submissionLink.url} target="_blank" rel="noreferrer" className="btn-ghost self-start">Get help</a>
              )}
            </div>
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
              <p className="text-2xl font-semibold">{offers[0] ? etb(offers[0].price) : t('common.priceSoon')}</p>
              <p className="text-sm text-muted-soft">{t('course.signInToBuy')}</p>
              <Link to="/login" state={{ from: location.pathname }} className="btn-primary">{t('nav.signIn')}</Link>
              <Link to="/login?mode=register" state={{ from: location.pathname }} className="btn-ghost">{t('nav.signUp')}</Link>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">{t('course.unlockTitle')}</h2>
              {offers.length === 0 && <p className="text-sm text-muted">{t('pay.priceSoon')}</p>}
              {offers.length > 0 && (
                <fieldset className="flex flex-col gap-2.5">
                  <legend className="text-sm text-muted mb-2">{t('course.choosePlan')}</legend>
                  {offers.map((o) => (
                    <PlanOption key={o.key} checked={selected?.key === o.key} onChange={() => { setPlan(o.key); setCreditMsg(null); }}
                      title={o.title} note={o.note} price={`${etb(o.price)}${o.monthly ? t('common.perMonth') : ''}`} />
                  ))}
                  <Link to="/subscribe" className="text-sm text-teal-soft self-start">{t('detail.planMonthly')} →</Link>
                </fieldset>
              )}
              {selected && !selected.monthly && credit >= selected.price && (
                <button type="button" className="btn-ghost border-cyan-300/50" onClick={redeem}>
                  <Icon name="gift" />{t('detail.useCredit')} · {etb(credit)}
                </button>
              )}
              {creditMsg && <p className={`text-sm ${creditMsg.ok ? 'text-mint' : 'text-[#F2A7A0]'}`} role={creditMsg.ok ? 'status' : 'alert'}>{creditMsg.text}</p>}
              {selected && (
                <PaymentForm key={selected.key} purpose={selected.purpose}
                  courseId={selected.purpose === 'course' ? c.id : undefined}
                  categoryId={selected.purpose === 'group' ? selected.group.id : undefined}
                  amount={selected.price} onDone={course.reload} />
              )}
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