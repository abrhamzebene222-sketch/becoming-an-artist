import { Link } from 'react-router-dom';
import { cdn, fmtDate } from '../api.js';
import { useI18n } from '../i18n/index.jsx';

const isExternal = (u) => /^https?:\/\//i.test(u);

/** One news item: image, title, date, short summary, "Read more" + a button that opens the lesson / course / link. */
export default function NewsCard({ item }) {
  const { t, loc } = useI18n();
  const title = loc(item, 'title');
  const summary = loc(item, 'summary');
  const openLabel = item.linkKind === 'lesson' ? t('news.openLesson') : item.linkKind === 'course' ? t('news.openCourse') : t('news.openLink');
  return (
    <article className="card overflow-hidden flex flex-col sm:flex-row">
      {item.imageUrl && (
        <img src={cdn(item.imageUrl, 800)} alt="" loading="lazy" className="w-full sm:w-52 h-40 sm:h-auto object-cover shrink-0" />
      )}
      <div className="p-5 flex flex-col gap-2 min-w-0 flex-1">
        <span className="text-xs text-muted-dim">{fmtDate(item.createdAt, false)}</span>
        <h3 className="text-lg font-semibold leading-snug">{title}</h3>
        {summary && <p className="text-sm text-muted-soft leading-relaxed line-clamp-3">{summary}</p>}
        <div className="flex flex-wrap gap-2 mt-2">
          <Link to={`/news/${item.id}`} className="btn-ghost py-2 px-3 text-sm">{t('news.readMore')}</Link>
          {item.link && (isExternal(item.link)
            ? <a href={item.link} target="_blank" rel="noreferrer" className="btn-primary py-2 px-3 text-sm">{openLabel}</a>
            : <Link to={item.link} className="btn-primary py-2 px-3 text-sm">{openLabel}</Link>)}
        </div>
      </div>
    </article>
  );
}
