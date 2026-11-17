import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';

/**
 * File-Explorer style tree for infinitely nested groups.
 * Each group row: ▸/▾ expand-collapse toggle, folder, title, counts, and actions (sub-group, course, delete).
 * Courses appear as leaf rows inside their group.
 */
export default function CategoryTree({ roots, expanded, onToggle, selected, onSelectGroup, onSelectCourse, onAddSub, onAddCourse, onDelete }) {
  return (
    <ul role="tree" className="flex flex-col text-sm">
      {roots.map((n) => (
        <Node key={n.id} node={n} depth={0} {...{ expanded, onToggle, selected, onSelectGroup, onSelectCourse, onAddSub, onAddCourse, onDelete }} />
      ))}
    </ul>
  );
}

function Node({ node, depth, expanded, onToggle, selected, onSelectGroup, onSelectCourse, onAddSub, onAddCourse, onDelete }) {
  const { t, loc } = useI18n();
  const isOpen = expanded.has(node.id);
  const hasKids = node.children.length > 0 || node.courses.length > 0;
  const active = selected?.type === 'group' && selected.id === node.id;
  const name = loc(node, 'title');
  const pad = { paddingLeft: `${depth * 16 + 4}px` };

  return (
    <li role="treeitem" aria-expanded={hasKids ? isOpen : undefined} aria-selected={active}>
      <div className={`group flex items-center gap-1 rounded-lg pr-1 ${active ? 'bg-teal-active text-white' : 'hover:bg-ink'}`} style={pad}>
        <button type="button" onClick={() => onToggle(node.id)} disabled={!hasKids}
          aria-label={isOpen ? t('explorer.collapse', { name }) : t('explorer.expand', { name })}
          className="w-8 h-9 shrink-0 grid place-items-center text-muted disabled:opacity-20">
          <Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size={16} />
        </button>
        <button type="button" onClick={() => onSelectGroup(node)} className="flex-1 min-w-0 flex items-center gap-2 py-2 text-left">
          <Icon name="folder" size={16} className={depth === 0 ? 'text-teal-soft shrink-0' : 'text-muted shrink-0'} />
          <span className={`truncate ${depth === 0 ? 'font-semibold' : ''}`}>{name}</span>
          {node.priceEtb > 0 && !node.isFree && <span className="text-[11px] text-teal-soft shrink-0">{node.priceEtb}</span>}
          {node.isFree && <span className="text-[11px] text-teal-soft shrink-0">{t('common.free')}</span>}
        </button>
        <span className="flex shrink-0 opacity-70 group-hover:opacity-100 focus-within:opacity-100">
          <IconBtn icon="folderPlus" label={`${t('explorer.addSub')} · ${name}`} onClick={() => onAddSub(node)} />
          <IconBtn icon="plus" label={`${t('explorer.addCourse')} · ${name}`} onClick={() => onAddCourse(node)} />
          <IconBtn icon="trash" label={`${t('explorer.delete')} · ${name}`} onClick={() => onDelete(node)} danger />
        </span>
      </div>
      {isOpen && (
        <ul role="group" className="relative">
          <span aria-hidden="true" className="absolute top-0 bottom-2 border-l border-line" style={{ left: `${depth * 16 + 19}px` }} />
          {node.children.map((ch) => (
            <Node key={ch.id} node={ch} depth={depth + 1} {...{ expanded, onToggle, selected, onSelectGroup, onSelectCourse, onAddSub, onAddCourse, onDelete }} />
          ))}
          {node.courses.map((c) => {
            const on = selected?.type === 'course' && selected.id === c.id;
            return (
              <li key={c.id} role="treeitem" aria-selected={on}>
                <button type="button" onClick={() => onSelectCourse(c)} style={{ paddingLeft: `${(depth + 1) * 16 + 36}px` }}
                  className={`w-full flex items-center gap-2 py-2 pr-2 rounded-lg text-left ${on ? 'bg-teal-active text-white' : 'hover:bg-ink text-muted-soft'}`}>
                  <Icon name="play" size={13} className="shrink-0" />
                  <span className="truncate flex-1">{loc(c, 'title')}
                    {c.isFree && <span className="text-xs text-teal-soft"> · {t('common.free')}</span>}
                    {!c.isPublished && <span className="text-xs text-muted-dim"> · {t('admin.courses.draft')}</span>}
                  </span>
                  <span className="text-xs text-muted shrink-0">{c.lessons.length}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function IconBtn({ icon, label, onClick, danger }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={`w-8 h-9 grid place-items-center rounded-md ${danger ? 'text-[#F2A7A0] hover:bg-[#2A1B1A]' : 'text-muted hover:text-mint hover:bg-ink-panel'}`}>
      <Icon name={icon} size={15} />
    </button>
  );
}
