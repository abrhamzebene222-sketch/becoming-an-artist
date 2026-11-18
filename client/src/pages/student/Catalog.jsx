import { Fragment, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi, useAuth, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import CourseCard from '../../components/CourseCard.jsx';
import GroupSlideshow from '../../components/GroupSlideshow.jsx';
import PromoBoard from '../../components/PromoBoard.jsx';
import GroupPurchase from '../../components/GroupPurchase.jsx';
import useTelegramShare from '../../components/TelegramShare.jsx';
import Icon from '../../components/Icon.jsx';

export default function Catalog() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const catalog = useApi(`/catalog?q=${encodeURIComponent(q)}`);
  const promos = useApi('/promos');
  const summary = useApi(user ? '/me/summary' : null, [user?.id]);
  const share = useTelegramShare();
  const [buying, setBuying] = useState(null);
  
  // የትኞቹ ሜጀር ግሩፖች እንደተከፈቱ (expanded) ለመቆጣጠር
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const subscribed = !!summary.data?.subscription;
  const ownedIds = new Set(summary.data?.enrolled?.map((c) => c.id));
  const ownedGroups = new Set(summary.data?.unlockedGroups || []);
  const credit = summary.data?.creditEtb || 0;
  const boards = promos.data?.boards || {};
  const groups = catalog.data || [];

  const board = (n) => (
    <PromoBoard key={`board-${n}`} board={n} items={boards[n] || []} telegram={promos.data?.telegram} onShare={share.start} />
  );
  const ctx = { ownedIds, ownedGroups, subscribed, onBuy: setBuying };

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
      {credit > 0 && (
        <Link to="/rewards" className="rounded-xl border border-cyan-300/30 bg-[#0E1A20] p-4 text-sm text-cyan-50 flex items-center gap-2">
          <Icon name="gift" size={16} />{t('rewards.credit')}: <strong>{etb(credit)}</strong> — {t('rewards.spend')}
        </Link>
      )}
      {catalog.data?.length === 0 && (
        <p className="text-muted">{t('catalog.noMatch', { q })} {user && <Link to="/request">{t('catalog.requestIt')}</Link>}</p>
      )}

      {groups.map((cat, i) => {
        const isExpanded = expandedGroups.has(cat.id);
        const hasSubChildren = cat.children && cat.children.length > 0;
        const hasOwnCourses = cat.ownCourses && cat.ownCourses.length > 0;
        const hasContent = hasSubChildren || hasOwnCourses;

        return (
          <Fragment key={cat.id}>
            <section id={cat.slug} className="flex flex-col gap-4 scroll-mt-6">
              {/* ሜጀር ግሩፕ ባነር - አሮይቷን እና ኤክስፓንድ ሎጂኩን የያዘ */}
              <GroupSlideshow 
                group={cat} 
                index={i} 
                expanded={isExpanded} 
                onToggle={() => toggleGroup(cat.id)}
              >
                <GroupBadge node={cat} {...ctx} />
              </GroupSlideshow>

              {/* ሲከፈት ብቻ ከስሩ የሚዘረጉ ኮርሶች እና ንዑስ ግሩፖች */}
              {isExpanded && hasContent && (
                <div className="flex flex-col gap-4 pl-2 sm:pl-4 pt-2">
                  {hasOwnCourses && (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {cat.ownCourses.map((c) => (
                        <CourseCard key={c.id} course={c} owned={ctx.subscribed || ownedGroups.has(cat.id) || ctx.ownedIds.has(c.id)} />
                      ))}
                    </div>
                  )}
                  {hasSubChildren && (
                    <div className="flex flex-col gap-3">
                      {cat.children.map((ch) => (
                        <SubGroup 
                          key={ch.id} 
                          node={ch} 
                          depth={1} 
                          {...ctx} 
                          ownedGroups={ownedGroups.has(cat.id) ? new Set([...ownedGroups, ch.id]) : ownedGroups} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
            {!q && i < 3 && board(i + 1)}
          </Fragment>
        );
      })}

      {!q && catalog.data && [1, 2, 3].filter((n) => n > groups.length).map(board)}

      {buying && (
        <GroupPurchase group={buying} credit={credit} onClose={() => setBuying(null)} onDone={() => { summary.reload(); }} />
      )}
      {share.modal}
    </div>
  );
}

function GroupBadge({ node, ownedGroups, subscribed, onBuy }) {
  const { t } = useI18n();
  if (node.isFree) return <span className="rounded-full bg-teal text-[#0B1312] px-3 py-1 text-xs font-bold">{t('common.free')}</span>;
  if (ownedGroups.has(node.id) || subscribed) return <span className="rounded-full bg-teal-active text-mint px-3 py-1 text-xs font-semibold">✓ {t('detail.unlocked')}</span>;
  if (!node.groupPriceEtb) return null;
  return (
    <button type="button" onClick={() => onBuy(node)} className="btn-primary py-2 px-3.5 text-sm">
      <Icon name="lock" size={14} />{t('detail.buyGroup')} · {etb(node.groupPriceEtb)}
    </button>
  );
}

/** ሪኩርሲቭ ንዑስ ግሩፕ ኮምፖነንት - በውስጡ ሌላ ንዑስ ግሩፕ ወይም ኮርስ ሲኖረው አሮ በመንካት እየከፈተ ይሄዳል */
function SubGroup({ node, depth, ...ctx }) {
  const { t, loc } = useI18n();
  const [open, setOpen] = useState(false);
  const id = `sg-${node.id}`;
  
  const hasSubChildren = node.children && node.children.length > 0;
  const hasOwnCourses = node.ownCourses && node.ownCourses.length > 0;

  return (
    <section className="rounded-xl border border-line bg-ink-panel/40" aria-labelledby={`${id}-h`}>
      <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={id}
          className="flex items-center gap-2 text-left flex-1 min-w-0 min-h-11 hover:text-mint transition-colors">
          <Icon name={open ? 'chevronDown' : 'chevronRight'} size={18} className="text-teal-soft shrink-0" />
          <span className="min-w-0">
            <span id={`${id}-h`} className="block font-semibold truncate">{loc(node, 'title')}</span>
            <span className="block text-xs text-muted">
              {t('explorer.courses', { n: node.courses?.length || node.ownCourses?.length || 0 })}
              {hasSubChildren ? ` · ${t('explorer.subgroups', { n: node.children.length })}` : ''}
            </span>
          </span>
        </button>
        <GroupBadge node={node} {...ctx} />
      </div>
      
      {open && (
        <div id={id} className="px-3 sm:px-4 pb-4 flex flex-col gap-4 border-t border-line/50 pt-3">
          {loc(node, 'description') && <p className="text-sm text-muted-soft">{loc(node, 'description')}</p>}
          
          {hasOwnCourses && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {node.ownCourses.map((c) => (
                <CourseCard key={c.id} course={c} owned={ctx.subscribed || ctx.ownedGroups.has(node.id) || ctx.ownedIds.has(c.id)} />
              ))}
            </div>
          )}

          {hasSubChildren && (
            <div className="flex flex-col gap-3 pl-3 sm:pl-5 border-l border-line/40">
              {node.children.map((childSub) => (
                <SubGroup 
                  key={childSub.id} 
                  node={childSub} 
                  depth={depth + 1} 
                  {...ctx} 
                  ownedGroups={ctx.ownedGroups.has(node.id) ? new Set([...ctx.ownedGroups, childSub.id]) : ctx.ownedGroups} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}