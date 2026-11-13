import { useOutletContext } from 'react-router-dom';
import { api, useApi, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';

export default function CourseRequests() {
  const { t } = useI18n();
  const list = useApi('/admin/course-requests');
  const { refreshOverview } = useOutletContext();
  const setStatus = async (id, status) => {
    await api(`/admin/course-requests/${id}`, { method: 'PATCH', body: { status } });
    list.reload(); refreshOverview?.();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">{t('admin.requests.title')}</h1>
      {list.data?.length === 0 && <p className="text-muted">{t('admin.requests.none')}</p>}
      {list.data?.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th className="p-3 font-medium">{t('admin.requests.topic')}</th><th className="p-3 font-medium">{t('admin.requests.student')}</th>
              <th className="p-3 font-medium">{t('admin.requests.level')}</th><th className="p-3 font-medium">{t('admin.requests.date')}</th>
              <th className="p-3 font-medium">{t('admin.requests.status')}</th>
            </tr></thead>
            <tbody>
              {list.data?.map((r) => (
                <tr key={r.id} className="border-t border-line align-top">
                  <td className="p-3"><p className="font-semibold">{r.topic}</p>{r.description && <p className="text-muted-soft mt-1">{r.description}</p>}</td>
                  <td className="p-3">{r.user?.name}<br /><span className="text-xs text-muted">{r.user?.email}</span></td>
                  <td className="p-3">{r.level ? t(`request.levels.${r.level}`) : '—'}</td>
                  <td className="p-3">{fmtDate(r.createdAt, false)}</td>
                  <td className="p-3">
                    <select aria-label={t('admin.requests.status')} className="input py-2" value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}>
                      {['open', 'planned', 'done', 'declined'].map((s) => <option key={s} value={s}>{t(`common.status.${s}`)}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
