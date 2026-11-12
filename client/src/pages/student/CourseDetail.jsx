import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, useApi, etb } from '../../api.js';
import PaymentForm from '../../components/PaymentForm.jsx';
import Icon from '../../components/Icon.jsx';

export default function CourseDetail() {
  const { slug } = useParams();
  const course = useApi(`/courses/${slug}`, [slug]);
  const summary = useApi('/me/summary');
  const pricing = useApi('/pricing');
  const [plan, setPlan] = useState('course');
  const [active, setActive] = useState(null);   // lesson being played
  const [src, setSrc] = useState(null);       // { url, poster } signed by our server, served by Cloudinary
  const [err, setErr] = useState('');
  const c = course.data;
  const owned = !!summary.data?.subscription || summary.data?.enrolled.some((e) => e.id === c?.id);

  useEffect(() => {
    if (!c) return;
    const first = c.lessons.find((l) => owned || l.is_preview);
    if (first) setActive(first);
  }, [c, owned]);

  useEffect(() => {
    if (!active) return;
    setSrc(null); setErr('');
    api(`/media/token/${active.id}`).then((r) => setSrc(r)).catch((e) => setErr(e.message));
  }, [active]);

  if (course.error) return <p className="text-muted">{course.error.message}</p>;
  if (!c) return <p className="text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted"><Link to="/catalog">Course Catalog</Link> › {c.category_title} › {c.title}</p>
      <div className="grid xl:grid-cols-[1.55fr_1fr] gap-7 items-start">
        <section className="flex flex-col gap-6 min-w-0">
          <div>
            <span className="eyebrow">{c.category_title}</span>
            <h1 className="text-3xl font-semibold mt-1.5 mb-2">{c.title}</h1>
            <p className="text-muted-soft leading-relaxed">{c.summary}</p>
          </div>

          {/* Player — streamed from the instructor's local server */}
          <div className="aspect-video bg-[#0A100F] border border-line rounded-2xl overflow-hidden grid place-items-center">
            {!active && <span className="flex flex-col items-center gap-2 text-muted"><Icon name="lock" size={28} />Unlock this course to start watching</span>}
            {active && err && <span className="text-muted p-6 text-center">{err}<br /><span className="text-xs">Please check your connection and try again.</span></span>}
            {active && src && active.kind === 'video' && (
              <video key={src.url} src={src.url} poster={src.poster || undefined} controls playsInline preload="metadata"
                controlsList="nodownload" disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()} className="w-full h-full bg-black" />
            )}
            {active && src && active.kind === 'pdf' && <iframe key={src.url} src={`${src.url}#toolbar=0`} title={active.title} className="w-full h-full bg-white" />}
          </div>

          <div className="card p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Learning outcomes &amp; evaluation</h2>
            <p className="text-sm text-muted-soft leading-relaxed"><strong className="text-white">After this course you can: </strong>{c.learning_outcomes}</p>
            <p className="text-sm text-muted-soft leading-relaxed"><strong className="text-white">Final deliverable: </strong>{c.deliverables}</p>
            <div className="flex flex-col gap-2.5 text-sm">
              {c.evaluation_criteria.map((k) => (
                <div key={k.criterion} className="flex justify-between gap-3 px-4 py-3 bg-ink rounded-xl">
                  <span>{k.criterion}</span><span className="text-teal-soft font-semibold">{k.weight}%</span>
                </div>
              ))}
            </div>
            {owned && c.submission_link && (
              <a href={c.submission_link.url} target="_blank" rel="noreferrer" className="btn-ghost self-start">Submit your work · {c.submission_link.label}</a>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-2">Lessons</h2>
            {c.lessons.length === 0 && <p className="text-sm text-muted">Lessons are being prepared.</p>}
            <ul>
              {c.lessons.map((l, i) => {
                const open = owned || l.is_preview;
                return (
                  <li key={l.id} className="border-b border-line last:border-0">
                    <button type="button" disabled={!open} onClick={() => setActive(l)}
                      className={`w-full flex justify-between gap-3 py-3 text-left text-sm ${active?.id === l.id ? 'text-mint font-semibold' : ''} disabled:cursor-not-allowed`}>
                      <span className="flex items-center gap-2"><Icon name={l.kind === 'pdf' ? 'file' : 'play'} size={15} />{i + 1} · {l.title}</span>
                      <span className={open ? 'text-teal-soft' : 'text-muted-dim'}>{owned ? (l.kind === 'pdf' ? 'PDF' : 'Watch') : l.is_preview ? 'Preview' : 'Locked'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {!owned && (
          <aside className="card p-6 flex flex-col gap-5 xl:sticky xl:top-6">
            <h2 className="text-lg font-semibold">Unlock this course</h2>
            <fieldset className="flex flex-col gap-2.5">
              <legend className="text-sm text-muted mb-2">Choose a plan</legend>
              <PlanOption checked={plan === 'course'} onChange={() => setPlan('course')} title="This course only" note="Lifetime access" price={c.price_etb ? etb(c.price_etb) : 'Price soon'} />
              <PlanOption checked={plan === 'subscription'} onChange={() => setPlan('subscription')} title="Monthly — all courses"
                note={pricing.data ? `Save ${pricing.data.savingsPercent}% vs buying separately` : ''} price={pricing.data ? `${etb(pricing.data.monthlyPrice)}/mo` : '…'} />
            </fieldset>
            <PaymentForm key={plan} purpose={plan} courseId={plan === 'course' ? c.id : undefined}
              amount={plan === 'course' ? c.price_etb : pricing.data?.monthlyPrice} onDone={summary.reload} />
          </aside>
        )}
      </div>
    </div>
  );
}

function PlanOption({ checked, onChange, title, note, price }) {
  return (
    <label className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer border ${checked ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
      <input type="radio" name="plan" checked={checked} onChange={onChange} className="accent-teal" />
      <span className="flex-1"><strong>{title}</strong><br /><span className="text-[13px] text-teal-soft">{note}</span></span>
      <span className="font-semibold text-right">{price}</span>
    </label>
  );
}
