import { Fragment, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi, useAuth, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import GroupSlideshow from '../../components/GroupSlideshow.jsx';
import PromoBoard from '../../components/PromoBoard.jsx';
import GroupPurchase from '../../components/GroupPurchase.jsx';
import StudentCategoryTree from '../../components/StudentCategoryTree.jsx';
import useTelegramShare from '../../components/TelegramShare.jsx';
import Icon from '../../components/Icon.jsx';

export default function Catalog() {
  const { t, loc } = useI18n();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const catalog = useApi(`/catalog?q=${encodeURIComponent(q)}`);
  const promos = useApi('/promos');
  const summary = useApi(user ? '/me/summary' : null, [user?.id]);
  const share = useTelegramShare();
  const [buying, setBuying] = useState(null);
  
  // Track which major groups are expanded/collapsed by user click
  const [expandedMajorGroups, setExpandedMajorGroups] = useState(() => new Set());

  const toggleMajorGroup = (id) => {
    setExpandedMajorGroups((prev) => {
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
        const isOpen = expandedMajorGroups.has(cat.id);
        const hasChildren = (cat.children && cat.children.length > 0) || (cat.ownCourses && cat.ownCourses.length > 0);
        const unlocked = ownedGroups.has(cat.id) || subscribed;

        return (
          <Fragment key={cat.id}>
            <section id={cat.slug} className="flex flex-col gap-5 scroll-mt-6">
              {/* Major Group Slideshow (Untouched & intact) */}
              <GroupSlideshow group={cat} index={i}>
                <div className="flex items-center gap-3">
                  <GroupBadge node={cat} {...ctx} />
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleMajorGroup(cat.id)}
                      className="btn-ghost py-2 px-3.5 text-sm flex items-center gap-2 bg-ink/80 text-white border-line hover:border-teal"
                    >
                      <span>{isOpen ? 'Collapse Courses' : 'Explore Courses'}</span>
                      <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={16} />
                    </button>
                  )}
                </div>
              </GroupSlideshow>
              
              {/* Expandable Sub-groups & Courses Tree under this Major Group */}
              {isOpen && hasChildren && (
                <div className="flex flex-col gap-4 pl-2 sm:pl-4 border-l-2 border-teal/40 animate-fadeIn">
                  {cat.children && cat.children.length > 0 && (
                    <StudentCategoryTree groups={cat.children} {...ctx} />
                  )}
                  {cat.ownCourses && cat.ownCourses.length > 0 && (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-2">
                      {cat.ownCourses.map((c) => {
                        const isOwned = subscribed || unlocked || ownedIds.has(c.id);
                        return (
                          <Link
                            key={c.id}
                            to={`/courses/${c.slug}`}
                            className="rounded-xl border border-line bg-ink p-3.5 hover:border-teal transition-all flex flex-col gap-2 group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-sm group-hover:text-teal-soft transition-colors truncate">{loc(c, 'title')}</span>
                              {c.isFree ? (
                                <span className="rounded-full bg-teal/20 text-teal-soft px-2 py-0.5 text-[10px] font-bold shrink-0">{t('common.free')}</span>
                              ) : isOwned ? (
                                <span className="rounded-full bg-teal-active text-mint px-2 py-0.5 text-[10px] font-semibold shrink-0">✓</span>
                              ) : (
                                <Icon name="lock" size={14} className="text-[#F2D98A] shrink-0 mt-0.5" />
                              )}
                            </div>
                            <p className="text-xs text-muted line-clamp-2">{loc(c, 'summary')}</p>
                            <div className="flex items-center justify-between text-[11px] text-muted-dim pt-1 border-t border-line">
                              <span>{t('common.lessons', { n: c.lessons?.length || 0 })}</span>
                              <span className="text-teal-soft flex items-center gap-1 group-hover:underline">
                                {t('common.view')} <Icon name="chevronRight" size={12} />
                              </span>
                            </div>
                          </Link>
                        );
                      })}
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