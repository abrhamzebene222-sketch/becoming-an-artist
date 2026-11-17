import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';
import { etb } from '../api.js';

export default function StudentCategoryTree({ groups, ownedIds, ownedGroups, subscribed, onBuy }) {
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const toggle = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <StudentNode
          key={group.id}
          node={group}
          depth={0}
          expanded={expandedIds}
          onToggle={toggle}
          ownedIds={ownedIds}
          ownedGroups={ownedGroups}
          subscribed={subscribed}
          onBuy={onBuy}
        />
      ))}
    </div>
  );
}

function StudentNode({ node, depth, expanded, onToggle, ownedIds, ownedGroups, subscribed, onBuy }) {
  const { t, loc } = useI18n();
  const isOpen = expanded.has(node.id);
  const courses = node.courses || node.ownCourses || [];
  const children = node.children || [];
  const hasKids = children.length > 0 || courses.length > 0;
  const unlocked = ownedGroups.has(node.id) || subscribed;
  const name = loc(node, 'title');

  return (
    <div className={`flex flex-col gap-3 ${depth > 0 ? 'ml-3 sm:ml-5 pl-3 sm:pl-4 border-l border-line/60 my-2' : ''}`}>
      <div className="rounded-2xl border border-line bg-ink-panel/40 overflow-hidden transition-all shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-ink/60">
          <button
            type="button"
            onClick={() => hasKids && onToggle(node.id)}
            disabled={!hasKids}
            aria-expanded={hasKids ? isOpen : undefined}
            className="flex items-center gap-3 text-left flex-1 min-w-0 min-h-10 disabled:cursor-default"
          >
            <span className={`w-8 h-8 rounded-lg grid place-items-center bg-ink text-teal-soft shrink-0 ${!hasKids ? 'opacity-30' : ''}`}>
              <Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size={18} />
            </span>
            <Icon name="folder" size={18} className="text-muted shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-sm sm:text-base text-white truncate">{name}</span>
              <span className="block text-xs text-muted">
                {t('explorer.courses', { n: courses.length })}
                {children.length ? ` · ${t('explorer.subgroups', { n: children.length })}` : ''}
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {node.isFree ? (
              <span className="rounded-full bg-teal text-[#0B1312] px-3 py-1 text-xs font-bold">{t('common.free')}</span>
            ) : unlocked ? (
              <span className="rounded-full bg-teal-active text-mint px-3 py-1 text-xs font-semibold">✓ {t('detail.unlocked')}</span>
            ) : node.groupPriceEtb || node.groupPriceEtb === 0 ? (
              <button type="button" onClick={() => onBuy(node)} className="btn-primary py-1.5 px-3 text-xs">
                <Icon name="lock" size={13} /> {etb(node.groupPriceEtb || 0)}
              </button>
            ) : null}
          </div>
        </div>

        {isOpen && hasKids && (
          <div className="px-3 sm:px-4 pb-4 pt-1 border-t border-line/60 flex flex-col gap-3">
            {loc(node, 'description') && (
              <p className="text-sm text-muted-soft px-1 pt-2">{loc(node, 'description')}</p>
            )}

            {/* Recursive Sub-groups */}
            {children.length > 0 && (
              <div className="flex flex-col gap-2 pt-2">
                {children.map((ch) => (
                  <StudentNode
                    key={ch.id}
                    node={ch}
                    depth={depth + 1}
                    expanded={expanded}
                    onToggle={onToggle}
                    ownedIds={ownedIds}
                    ownedGroups={unlocked ? new Set([...ownedGroups, ch.id]) : ownedGroups}
                    subscribed={subscribed}
                    onBuy={onBuy}
                  />
                ))}
              </div>
            )}

            {/* Courses inside this node */}
            {courses.length > 0 && (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-3">
                {courses.map((c) => {
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
      </div>
    </div>
  );
}