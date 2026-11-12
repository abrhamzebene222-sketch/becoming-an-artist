import { useState } from 'react';
import { api, useApi, fmtDate } from '../../api.js';
import { StatusPill } from './Enrolled.jsx';

export default function RequestCourse() {
  const mine = useApi('/course-requests');
  const [f, setF] = useState({ topic: '', level: 'Beginner', description: '' });
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api('/course-requests', { method: 'POST', body: f });
      setMsg({ ok: true, text: 'Thank you! Your request was sent to the instructor.' });
      setF({ topic: '', level: 'Beginner', description: '' });
      mine.reload();
    } catch (err) { setMsg({ ok: false, text: err.message }); }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold">Request a Course</h1>
        <p className="text-muted mt-1">Can't find a topic? Tell us what you'd like to learn next.</p>
      </div>
      <form onSubmit={submit} className="card p-6 flex flex-col gap-4">
        <label className="label">Topic<input className="input" required value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="e.g. Watercolor landscapes, Ethiopian iconography, Portrait in oil" /></label>
        <label className="label">Your level
          <select className="input" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </label>
        <label className="label">What should the course cover?<textarea className="input min-h-32" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
        {msg && <p className={`text-sm ${msg.ok ? 'text-mint' : 'text-[#F2A7A0]'}`} role="status">{msg.text}</p>}
        <button className="btn-primary self-start">Send request</button>
      </form>
      {mine.data?.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Your requests</h2>
          {mine.data.map((r) => (
            <div key={r.id} className="card p-4 flex justify-between gap-3 flex-wrap">
              <span>{r.topic} <span className="text-xs text-muted-dim ml-2">{fmtDate(r.created_at)}</span></span><StatusPill status={r.status} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
