import { api, useApi, fmtDate } from '../../api.js';
import { useOutletContext } from 'react-router-dom';

export default function CourseRequests() {
  const list = useApi('/admin/course-requests');
  const { refreshOverview } = useOutletContext();
  const setStatus = async (id, status) => {
    await api(`/admin/course-requests/${id}`, { method: 'PATCH', body: { status } });
    list.reload(); refreshOverview?.();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Course requests</h1>
      {list.data?.length === 0 && <p className="text-muted">No requests yet.</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead><tr className="text-left text-xs uppercase tracking-wider text-muted">
            <th className="p-3 font-medium">Topic</th><th className="p-3 font-medium">Student</th><th className="p-3 font-medium">Level</th><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Status</th>
          </tr></thead>
          <tbody>
            {list.data?.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="p-3"><p className="font-semibold">{r.topic}</p>{r.description && <p className="text-muted-soft mt-1">{r.description}</p>}</td>
                <td className="p-3">{r.student_name}<br /><span className="text-xs text-muted">{r.student_email}</span></td>
                <td className="p-3">{r.level || '—'}</td>
                <td className="p-3">{fmtDate(r.created_at)}</td>
                <td className="p-3">
                  <select aria-label="Status" className="input py-2" value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}>
                    <option value="open">Open</option><option value="planned">Planned</option><option value="done">Done</option><option value="declined">Declined</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
