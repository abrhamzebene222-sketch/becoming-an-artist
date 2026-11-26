import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import BlocksView from '../../components/BlocksView.jsx';

// One self-evaluation document, read inside the app: /self-evals/:id (buyers and admins only)
export default function SelfEvalView() {
  const { id } = useParams();
  const { t, loc } = useI18n();
  const doc = useApi(`/self-evals/${id}`);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  const d = doc.data;

  if (doc.loading && !d) return <p className="text-muted">{t('common.loading')}</p>;
  if (doc.error) {
    return (
      <div className="flex flex-col gap-4 items-start">
        <p className="text-muted">{doc.error.status === 403 ? t('selfEval.locked') : doc.error.message}</p>
        <Link to="/self-evals" className="btn-ghost py-2.5 text-sm">← {t('selfEval.back')}</Link>
      </div>
    );
  }
  return (
    <article className="flex flex-col gap-5 max-w-3xl w-full mx-auto">
      <Link to="/self-evals" className="text-sm text-teal-soft self-start min-h-11 inline-flex items-center">← {t('selfEval.back')}</Link>
      <header className="flex flex-col gap-1">
        <span className="eyebrow">{t('selfEval.docOf')}</span>
        <h1 className="text-2xl font-semibold">{loc(d, 'title')}</h1>
        <p className="text-sm text-muted">{loc({ title: d.courseTitle, titleAm: d.courseTitleAm }, 'title')}</p>
      </header>
      <BlocksView blocks={d.blocks} title={d.title} labelBase={d.labelBase} labelBaseAm={d.labelBaseAm} />
      {d.courseSlug && <Link to={`/courses/${d.courseSlug}/lessons/${d.lessonId}`} className="btn-ghost self-start text-sm">{t('selfEval.openLesson')}</Link>}
    </article>
  );
}
