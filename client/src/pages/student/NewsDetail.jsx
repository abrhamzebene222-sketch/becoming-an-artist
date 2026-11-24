import { Link, useParams } from 'react-router-dom';
import { cdn, fmtDate, useApi } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';

const isExternal = (u) => /^https?:\/\//i.test(u);

// One full news item: /news/:id ("Read more")
export default function NewsDetail() {
  const { id } = useParams();
  const { t, loc } = useI18n();
  const news = useApi(`/news/${id}`);
  const n = news.data;

  if (news.error) return <div className="flex flex-col gap-4 items-start"><p className="text-muted">{t('news.notFound')}</p><Link to="/news" className="btn-ghost py-2.5 text-sm">← {t('news.title')}</Link></div>;
  if (!n) return <p className="text-muted">{t('common.loading')}</p>;

  const body = loc(n, 'body');
  const summary = loc(n, 'summary');
  const openLabel = n.linkKind === 'lesson' ? t('news.openLesson') : n.linkKind === 'course' ? t('news.openCourse') : t('news.openLink');
  return (
    <article className="flex flex-col gap-5 max-w-3xl w-full mx-auto">
      <header>
        <span className="text-xs text-muted-dim">{fmtDate(n.createdAt, false)}</span>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1.5 leading-snug">{loc(n, 'title')}</h1>
      </header>
      {n.imageUrl && <img src={cdn(n.imageUrl, 1400)} alt="" className="w-full rounded-2xl border border-line object-cover max-h-96" />}
      {summary && <p className="text-lg text-muted-soft leading-relaxed whitespace-pre-line">{summary}</p>}
      {body && <div className="leading-relaxed whitespace-pre-line">{body}</div>}
      {n.link && (isExternal(n.link)
        ? <a href={n.link} target="_blank" rel="noreferrer" className="btn-primary self-start">{openLabel}</a>
        : <Link to={n.link} className="btn-primary self-start">{openLabel}</Link>)}
    </article>
  );
}
