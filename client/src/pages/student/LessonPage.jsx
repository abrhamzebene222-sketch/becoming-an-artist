import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useApi, useAuth } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import LessonContent from '../../components/LessonContent.jsx';
import TokenUnlock from '../../components/TokenUnlock.jsx';
import Icon from '../../components/Icon.jsx';
import { KidsBackdrop } from '../../components/KidsDecor.jsx';
import useKidsTheme, { isKidsCourse, isKidsSlug } from '../../lib/useKidsTheme.js';

// One lesson on its own page: /courses/:slug/lessons/:lessonId
// Same access rules as the course page: free courses and FREE PREVIEW lessons are open to everyone,
// paid lessons need login + purchase. The lesson list comes from the course (also cached for offline use).
export default function LessonPage() {
  const { slug, lessonId } = useParams();
  const { t, loc } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const course = useApi(`/courses/${slug}`, [slug, user?.id]);
  const pricing = useApi('/pricing');
  const c = course.data;
  // Young Artists Club lesson → the whole screen (background, menu, buttons) turns kids-colourful
  const kids = isKidsSlug(slug) || isKidsCourse(c);
  useKidsTheme(kids);

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
  const canOpen = (l) => access || l.isPreview || l.unlocked;     // unlocked = bought on its own with tokens
  const open = canOpen(lesson);
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;
  const lessonLink = (l) => `/courses/${slug}/lessons/${l.id}`;

  return (
    <div className="flex flex-col gap-5 max-w-3xl w-full mx-auto">
      {kids && <KidsBackdrop />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={backToCourse} className="btn-ghost py-2.5 text-sm">← {t('lessonPage.backToCourse')}</Link>
        <span className={kids ? 'kids-sticker' : 'text-sm text-muted'}>{t('lessonPage.position', { n: index + 1, total: lessons.length })}</span>
      </div>

      {kids && (
        <div role="progressbar" aria-valuemin={1} aria-valuemax={lessons.length} aria-valuenow={index + 1}
          className="h-3.5 rounded-full bg-ink-deep border-2 border-line overflow-hidden">
          <div className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${((index + 1) / lessons.length) * 100}%`, background: 'linear-gradient(90deg,#FF7A59,#FFD166,#9BE564,#4CC9F0,#FF8FB8)' }} />
        </div>
      )}

      <header>
        <span className="eyebrow">{loc(c, 'title')}</span>
        <h1 className={kids ? 'text-3xl sm:text-4xl font-bold mt-1.5 leading-tight [text-shadow:0_3px_0_rgba(0,0,0,0.25)]' : 'text-2xl sm:text-3xl font-semibold mt-1.5 leading-snug'}>{lesson.title}</h1>
        {pricing.data?.credit?.active && lesson.creditHours > 0 && <p className="text-xs text-muted-dim mt-1">{t('credit.hoursShort', { n: lesson.creditHours })}</p>}
        {loc(lesson, 'subtitle') && <p className="text-muted-soft mt-2 leading-relaxed">{loc(lesson, 'subtitle')}</p>}
      </header>

      <div className={`card overflow-hidden ${kids ? 'kids-card k-sky' : ''}`}>
        {open ? (
          <LessonContent key={lesson.id} lessonId={lesson.id} />
        ) : (
          <div className="p-6 flex flex-col gap-4 items-start">
            <p className="flex items-start gap-2 text-[#F2D98A]"><Icon name="lock" size={18} className="mt-0.5 shrink-0" />{user ? t('course.locked') : t('course.signInToWatch')}</p>
            {user && lesson.tokenPrice > 0 && (
              <TokenUnlock type="lesson" id={lesson.id} price={lesson.tokenPrice} onDone={course.reload} className="w-full" />
            )}
            {user
              ? <Link to={backToCourse} className={lesson.tokenPrice > 0 ? 'btn-ghost' : 'btn-primary'}>{t('lessonPage.unlockCourse')}</Link>
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
