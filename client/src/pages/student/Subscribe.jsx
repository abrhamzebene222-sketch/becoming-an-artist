import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, useAuth, etb, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import PaymentForm from '../../components/PaymentForm.jsx';
import Icon from '../../components/Icon.jsx';
import { indexTree } from '../../lib/tree.js';

/** Monthly base price of a group: monthly price → group price → sum of its paid course prices. */
const monthlyOf = (n) => n.monthlyPriceEtb || n.priceEtb || n.courses.filter((c) => !c.isFree).reduce((s, c) => s + (c.priceEtb || 0), 0);
const tierFor = (tiers, lessons) => tiers.find((t) => lessons >= t.minLessons && (!t.maxLessons || lessons <= t.maxLessons)) || null;

// Modular monthly plan: tick whole course groups → live lesson count, admin discount tier, price breakdown.
// The server recalculates the same quote when the payment is submitted.
export default function Subscribe() {
  const { t, loc } = useI18n();
  const { user } = useAuth();
  const pricing = useApi('/pricing');
  const catalog = useApi('/catalog');
  const summary = useApi(user ? '/me/summary' : null, [user?.id]);
  const [picked, setPicked] = useState(() => new Set());
  const [mode, setMode] = useState('groups');
  const p = pricing.data;
  const sub = summary.data?.subscription;
  const tiers = p?.tiers || [];
  const roots = catalog.data || [];
  const index = useMemo(() => indexTree(roots), [roots]);

  const coveredByParent = (id) => {
    let cur = index.get(id)?.parent;
    while (cur) { if (picked.has(cur)) return true; cur = index.get(cur)?.parent; }
    return false;
  };
  const effective = [...picked].filter((id) => index.has(id) && !coveredByParent(id));
  const items = effective.map((id) => index.get(id).node);
  const lessons = items.reduce((s, n) => s + (n.lessonCount || 0), 0);
  const base = items.reduce((s, n) => s + monthlyOf(n), 0);
  const tier = tierFor(tiers, lessons);
  const pct = tier?.percent || 0;
  const discount = Math.round(base * (pct / 100));
  const total = base - discount;
  const nextTier = tiers.find((x) => x.minLessons > lessons && x.percent > pct);

  const toggle = (id) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="grid xl:grid-cols-[1fr_420px] gap-8 items-start">
      <div className="flex flex-col gap-6 min-w-0">
        <div>
          <span className="eyebrow">{t('plan.eyebrow')}</span>
          <h1 className="text-3xl font-semibold mt-1">{t('plan.title')}</h1>
          <p className="text-muted-soft mt-2 max-w-xl">{t('plan.text')}</p>
        </div>
        {sub && <p className="rounded-xl bg-teal-active p-4 text-mint">{t('subscribe.active', { date: fmtDate(sub.endsAt, false) })}</p>}
        {summary.data?.groupSubscriptions?.map((g) => (
          <p key={g.endsAt} className="rounded-xl bg-teal-active p-4 text-mint text-sm">
            {t('plan.active', { date: fmtDate(g.endsAt, false) })}: {g.groups.map((x) => loc(x, 'title')).join(' · ')}
          </p>
        ))}

        {tiers.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm text-muted mb-3">{t('plan.tiers')}</h2>
            <div className="flex flex-wrap gap-2">
              {tiers.map((x) => (
                <span key={`${x.minLessons}-${x.maxLessons}`} className={`px-3 py-2 rounded-xl text-sm border ${tier === x ? 'border-teal bg-teal-active text-mint' : 'border-line-strong text-muted-soft'}`}>
                  {x.maxLessons ? t('plan.tierRow', { min: x.minLessons, max: x.maxLessons, p: x.percent }) : t('plan.tierRowOpen', { min: x.minLessons, p: x.percent })}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="card p-4 sm:p-5">
          <ul role="tree" aria-label={t('plan.title')} className="flex flex-col">
            {roots.map((n) => <PickNode key={n.id} node={n} depth={0} picked={picked} toggle={toggle} covered={coveredByParent} />)}
          </ul>
        </div>
      </div>

      <aside className="card p-6 flex flex-col gap-4 xl:sticky xl:top-6">
        <div className="grid grid-cols-2 gap-2" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'groups'} onClick={() => setMode('groups')}
            className={`btn py-2.5 text-sm ${mode === 'groups' ? 'bg-teal text-[#0B1312]' : 'border border-line-strong text-muted-soft'}`}>{t('plan.selected')}</button>
          <button type="button" role="tab" aria-selected={mode === 'all'} onClick={() => setMode('all')}
            className={`btn py-2.5 text-sm ${mode === 'all' ? 'bg-teal text-[#0B1312]' : 'border border-line-strong text-muted-soft'}`}>{t('course.monthlyAll')}</button>
        </div>

        {mode === 'groups' ? (
          <>
            {items.length === 0 ? <p className="text-sm text-muted">{t('plan.none')}</p> : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {items.map((n) => (
                  <li key={n.id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{loc(n, 'title')} <span className="text-muted-dim">· {t('plan.lessons', { n: n.lessonCount })}</span></span>
                    <span className="shrink-0">{etb(monthlyOf(n))}</span>
                  </li>
                ))}
              </ul>
            )}
            <dl className="rounded-xl bg-ink p-4 text-sm grid grid-cols-[1fr_auto] gap-y-1.5" aria-live="polite">
              <dt className="text-muted">{t('plan.lessons', { n: lessons })}</dt><dd />
              <dt className="text-muted">{t('plan.base')}</dt><dd>{etb(base)}</dd>
              <dt className="text-muted">{t('plan.discount', { p: pct })}</dt><dd className="text-teal-soft">− {etb(discount)}</dd>
              <dt className="font-semibold text-white border-t border-line pt-2 mt-1">{t('plan.total')}</dt>
              <dd className="font-semibold text-xl text-teal-soft border-t border-line pt-2 mt-1">{etb(total)}</dd>
            </dl>
            {nextTier && items.length > 0 && <p className="text-xs text-[#F2D98A]">{t('plan.nextTier', { n: nextTier.minLessons - lessons, p: nextTier.percent })}</p>}
            {user
              ? <PaymentForm key={[...effective].sort().join(",")} purpose="group_subscription" groups={effective} amount={total} onDone={summary.reload} />
              : <Link to="/login" state={{ from: '/subscribe' }} className="btn-primary">{t('subscribe.signIn')}</Link>}
          </>
        ) : (
          <>
            {p && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-ink p-3"><p className="text-[11px] text-muted">{t('subscribe.separately')}</p><p className="font-semibold mt-1 line-through decoration-muted-dim">{etb(p.allCoursesTotal)}</p></div>
                <div className="rounded-xl bg-ink p-3 border border-teal"><p className="text-[11px] text-muted">{t('subscribe.monthly')}</p><p className="font-semibold mt-1 text-teal-soft">{etb(p.monthlyPrice)}</p></div>
                <div className="rounded-xl bg-ink p-3"><p className="text-[11px] text-muted">{t('subscribe.youSave')}</p><p className="font-semibold mt-1">{p.savingsPercent}%</p></div>
              </div>
            )}
            {user
              ? <PaymentForm purpose="subscription" amount={p?.monthlyPrice} onDone={summary.reload} />
              : <Link to="/login" state={{ from: '/subscribe' }} className="btn-primary">{t('subscribe.signIn')}</Link>}
          </>
        )}
      </aside>
    </div>
  );
}

function PickNode({ node, depth, picked, toggle, covered }) {
  const { t, loc } = useI18n();
  const [open, setOpen] = useState(depth === 0);
  const isCovered = covered(node.id);
  const checked = picked.has(node.id) || isCovered;
  const kids = node.children || [];
  if (!node.lessonCount && !kids.length) return null; // nothing paid inside
  return (
    <li role="treeitem" aria-expanded={kids.length ? open : undefined} aria-selected={checked}>
      <div className="flex items-center gap-1 rounded-lg hover:bg-ink" style={{ paddingLeft: `${depth * 18}px` }}>
        <button type="button" onClick={() => setOpen(!open)} disabled={!kids.length} aria-label={open ? t('explorer.collapse', { name: loc(node, 'title') }) : t('explorer.expand', { name: loc(node, 'title') })}
          className="w-9 h-11 grid place-items-center text-muted disabled:opacity-0 shrink-0">
          <Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} />
        </button>
        <label className="flex-1 flex items-center gap-3 py-2.5 cursor-pointer min-w-0">
          <input type="checkbox" className="accent-teal w-4 h-4 shrink-0" checked={checked} disabled={isCovered} onChange={() => toggle(node.id)} />
          <span className={`flex-1 min-w-0 truncate ${depth === 0 ? 'font-semibold' : ''}`}>{loc(node, 'title')}</span>
          <span className="text-xs text-muted shrink-0">{isCovered ? t('plan.covered') : t('plan.lessons', { n: node.lessonCount })}</span>
          {!isCovered && <span className="text-xs text-teal-soft shrink-0 w-20 text-right">{etb(monthlyOf(node))}</span>}
        </label>
      </div>
      {open && kids.length > 0 && (
        <ul role="group">{kids.map((k) => <PickNode key={k.id} node={k} depth={depth + 1} picked={picked} toggle={toggle} covered={covered} />)}</ul>
      )}
    </li>
  );
}
