import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useApi, useAuth } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import LessonContent from '../../components/LessonContent.jsx';
import Icon from '../../components/Icon.jsx';

// One lesson on its own page: /courses/:slug/lessons/:lessonId
// Same access rules as the course page: free courses and FREE PREVIEW lessons are open to everyone,
// paid lessons need login + purchase. The lesson list comes from the course (also cached for offline use).
export default function LessonPage() {
  const { slug, lessonId } = useParams();
  const { t, loc } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const course = useApi(`/courses/${slug}`, [slug, user?.id]);
  const c = course.data;

  // Every new lesson starts at the top of the page
  useEffect(() => { window.scrollTo(0, 0); }, [lessonId]);

  if (course.error) return <p className="text-muted">{t('course.notFound')}</p>;
  if (!c) return <p className="text-muted">{t('common.loading')}</p>;

  const lessons = c.lessons || [];
  const index = lessons.findIndex((l) => l.id === lessonId);
  const backToCourse = `/courses/${slug}`;

  if (index < 0) {
    return (
      <div className="flex flex-col gap-4 items-start">
        <p className="text-muted">{t('lessonPage.notFound')}</p>
        <Link to={backToCourse} className="btn-ghost py-2.5 text-sm">← {t('lessonPage.backToCourse')}</Link>
      </div>
    );
  }

  const lesson = lessons[index];
  const access = !!c.hasAccess;
  const canOpen = (l) => access || l.isPreview;
  const open = canOpen(lesson);
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;
  const lessonLink = (l) => `/courses/${slug}/lessons/${l.id}`;

  return (
    <div className="flex flex-col gap-5 max-w-3xl w-full mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={backToCourse} className="btn-ghost py-2.5 text-sm">← {t('lessonPage.backToCourse')}</Link>
        <span className="text-sm text-muted">{t('lessonPage.position', { n: index + 1, total: lessons.length })}</span>
      </div>

      <header>
        <span className="eyebrow">{loc(c, 'title')}</span>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1.5 leading-snug">{lesson.title}</h1>
        {loc(lesson, 'subtitle') && <p className="text-muted-soft mt-2 leading-relaxed">{loc(lesson, 'subtitle')}</p>}
      </header>

      <div className="card overflow-hidden">
        {open ? (
          <LessonContent key={lesson.id} lessonId={lesson.id} />
        ) : (
          <div className="p-6 flex flex-col gap-4 items-start">
            <p className="flex items-start gap-2 text-[#F2D98A]"><Icon name="lock" size={18} className="mt-0.5 shrink-0" />{user ? t('course.locked') : t('course.signInToWatch')}</p>
            {user
              ? <Link to={backToCourse} className="btn-primary">{t('lessonPage.unlockCourse')}</Link>
              : <Link to="/login" state={{ from: location.pathname }} className="btn-primary">{t('nav.signIn')}</Link>}
          </div>
        )}
      </div>

      <nav aria-label={t('course.lessonsTitle')} className="grid grid-cols-2 gap-3">
        {prev
          ? <Link to={lessonLink(prev)} className="btn-ghost justify-center text-sm">← {t('lessonPage.previous')}</Link>
          : <span />}
        {next
          ? <Link to={lessonLink(next)} className="btn-primary justify-center text-sm">{t('lessonPage.next')} →</Link>
          : <Link to={backToCourse} className="btn-primary justify-center text-sm">{t('lessonPage.finish')}</Link>}
      </nav>
    </div>
  );
}
