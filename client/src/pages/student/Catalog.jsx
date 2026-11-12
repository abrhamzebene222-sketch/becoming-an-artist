import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../api.js';
import CourseCard from '../../components/CourseCard.jsx';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const catalog = useApi(`/catalog?q=${encodeURIComponent(q)}`);
  const summary = useApi('/me/summary');
  const ownedIds = new Set(summary.data?.subscription ? [] : summary.data?.enrolled.map((c) => c.id));
  const subscribed = !!summary.data?.subscription;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Course Catalog</h1>
          <p className="text-muted mt-1">An academic path through drawing, color, composition and anatomy.</p>
        </div>
        <label className="label w-full sm:w-80">Filter
          <input type="search" className="input" value={q} placeholder="Search by name or topic"
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })} />
        </label>
      </div>
      {catalog.data?.length === 0 && <p className="text-muted">No courses match "{q}". <a href="/request">Request it</a>?</p>}
      {catalog.data?.map((cat, i) => (
        <section key={cat.id} id={cat.slug} className="flex flex-col gap-4">
          <div>
            <span className="eyebrow">Major group {i + 1}</span>
            <h2 className="text-2xl font-semibold">{cat.title}</h2>
            {cat.description && <p className="text-muted-soft text-sm mt-1">{cat.description}</p>}
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cat.courses.map((c) => <CourseCard key={c.id} course={c} owned={subscribed || ownedIds.has(c.id)} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
