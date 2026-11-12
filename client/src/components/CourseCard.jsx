import { Link } from 'react-router-dom';
import { etb } from '../api.js';

export default function CourseCard({ course, category, owned }) {
  return (
    <Link to={`/courses/${course.slug}`} className="card p-5 flex flex-col gap-3 hover:border-teal transition group">
      {category && <span className="eyebrow">{category}</span>}
      <span className="text-lg font-semibold group-hover:text-mint">{course.title}</span>
      <span className="text-sm text-muted-soft leading-relaxed line-clamp-3">{course.summary}</span>
      <span className="mt-auto pt-2 flex items-center justify-between text-sm">
        <span className="text-muted-dim">{course.lesson_count ?? 0} lessons</span>
        <span className={owned ? 'text-teal-soft font-semibold' : 'font-semibold'}>
          {owned ? 'Enrolled' : course.price_etb ? etb(course.price_etb) : 'Price soon'}
        </span>
      </span>
    </Link>
  );
}
