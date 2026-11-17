import { Link } from 'react-router-dom';
import { etb } from '../api.js';
import { useI18n } from '../i18n/index.jsx';

export default function CourseCard({ course, category, owned }) {
  const { t, loc } = useI18n();
  let price;
  if (course.isFree) price = <span className="rounded-full bg-teal text-[#0B1312] px-2.5 py-0.5 text-xs font-bold">{t('common.free')}</span>;
  else if (owned) price = <span className="text-teal-soft font-semibold">{t('common.enrolled')}</span>;
  else price = <span className="font-semibold">{course.priceEtb ? etb(course.priceEtb) : t('common.priceSoon')}</span>;

  return (
    <Link to={`/courses/${course.slug}`} className="card p-5 flex flex-col gap-3 hover:border-teal transition group">
      {category && <span className="eyebrow">{category}</span>}
      <span className="text-lg font-semibold group-hover:text-mint">{loc(course, 'title')}</span>
      <span className="text-sm text-muted-soft leading-relaxed line-clamp-3">{loc(course, 'summary')}</span>
      <span className="mt-auto pt-2 flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-dim">{t('common.lessons', { n: course.lessonCount ?? 0 })}</span>
        {price}
      </span>
    </Link>
  );
}
