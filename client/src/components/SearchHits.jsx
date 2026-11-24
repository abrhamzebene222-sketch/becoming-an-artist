import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';
import { courseHref, lessonHref } from '../lib/useSearch.js';

/** One lesson result: icon by lesson type, lesson title, and the course it belongs to. */
export function LessonRow({ hit, onNavigate }) {
  const { t, loc } = useI18n();
  const icon = hit.kind === 'pdf' ? 'file' : hit.kind === 'video' ? 'play' : 'text';
  const free = hit.isPreview || hit.courseIsFree;
  return (
    <Link to={lessonHref(hit)} onClick={onNavigate}
      className="flex items-start gap-3 rounded-xl px-3 py-2.5 min-h-11 hover:bg-ink text-left">
      <Icon name={icon} size={15} className="text-teal-soft shrink-0 mt-1" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm truncate">{loc(hit, 'title')}</span>
        <span className="block text-xs text-muted truncate">{loc({ title: hit.courseTitle, titleAm: hit.courseTitleAm }, 'title')}</span>
      </span>
      {free && <span className="text-[11px] text-teal-soft shrink-0 mt-0.5">{t('search.free')}</span>}
    </Link>
  );
}

/** One course result: course title and the group path above it. */
export function CourseRow({ hit, onNavigate }) {
  const { t, loc } = useI18n();
  return (
    <Link to={courseHref(hit)} onClick={onNavigate}
      className="flex items-start gap-3 rounded-xl px-3 py-2.5 min-h-11 hover:bg-ink text-left">
      <Icon name="book" size={15} className="text-teal-soft shrink-0 mt-1" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm truncate">{loc(hit, 'title')}</span>
        {hit.path?.length > 0 && <span className="block text-xs text-muted truncate">{hit.path.map((p) => loc(p, 'title')).join(' › ')}</span>}
      </span>
      {hit.isFree && <span className="text-[11px] text-teal-soft shrink-0 mt-0.5">{t('common.free')}</span>}
    </Link>
  );
}

/** Live suggestions shown under the menu search box (courses first, then lessons). */
export function SearchPanel({ q, search, onNavigate, onSeeAll }) {
  const { t } = useI18n();
  if (!search.active) return null;
  const d = search.data;
  const empty = !!d && !d.courses.length && !d.lessons.length;
  return (
    <div className={`flex flex-col gap-0.5 rounded-xl border border-line bg-ink p-1.5 ${search.loading ? 'opacity-70' : ''}`}
      role="region" aria-label={t('search.results')} aria-live="polite">
      {search.error && <p className="px-3 py-2 text-xs text-[#F2D98A]">{search.error.message}</p>}
      {!search.error && !d && <p className="px-3 py-2 text-xs text-muted">{t('search.searching')}</p>}
      {!search.error && empty && !search.loading && <p className="px-3 py-2 text-xs text-muted">{t('search.noResults', { q: q.trim() })}</p>}
      {d?.courses.length > 0 && (
        <>
          <span className="eyebrow px-3 pt-1.5">{t('search.courses')}</span>
          {d.courses.map((c) => <CourseRow key={c.id} hit={c} onNavigate={onNavigate} />)}
        </>
      )}
      {d?.lessons.length > 0 && (
        <>
          <span className="eyebrow px-3 pt-1.5">{t('search.lessons')}</span>
          {d.lessons.map((l) => <LessonRow key={l.id} hit={l} onNavigate={onNavigate} />)}
        </>
      )}
      {d && !empty && (
        <button type="button" onClick={onSeeAll} className="px-3 py-2.5 min-h-11 text-xs text-teal-soft text-left">{t('search.seeAll')} →</button>
      )}
    </div>
  );
}
