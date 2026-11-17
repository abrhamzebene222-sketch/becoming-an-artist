import { useState } from 'react';
import { api, useApi, useAuth, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';

export default function Users() {
  const { t } = useI18n();
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const list = useApi(`/admin/users?q=${encodeURIComponent(q)}`, [q]);

  const setRole = async (id, role) => {
    try { await api(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }); list.reload(); } catch (e) { alert(e.message); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold">{t('admin.users.title')}</h1>
        <label className="label w-full sm:w-80">{t('admin.users.search')}
          <input type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      <p className="text-sm text-muted-soft card p-4">{t('admin.users.tip')}</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead><tr className="text-left text-xs uppercase tracking-wider text-muted">
            <th className="p-3 font-medium">{t('admin.users.name')}</th><th className="p-3 font-medium">{t('admin.users.email')}</th>
            <th className="p-3 font-medium">{t('admin.users.joined')}</th><th className="p-3 font-medium">{t('admin.users.role')}</th><th className="p-3" />
          </tr></thead>
          <tbody>
            {list.data?.map((u) => {
              const admin = u.role === 'admin';
              const self = u.id === me.id;
              return (
                <tr key={u.id} className="border-t border-line">
                  <td className="p-3">{u.name} {self && <span className="text-xs text-muted">{t('admin.users.you')}</span>}</td>
                  <td className="p-3 break-all">{u.email}</td>
                  <td className="p-3">{fmtDate(u.createdAt, false)}</td>
                  <td className="p-3"><span className={admin ? 'text-teal-soft font-semibold' : ''}>{t(`admin.users.roles.${admin ? 'admin' : 'student'}`)}</span></td>
                  <td className="p-3 text-right">
                    {!self && (
                      <button className={admin ? 'btn-danger py-2' : 'btn-ghost py-2'} onClick={() => setRole(u.id, admin ? 'student' : 'admin')}>
                        {admin ? t('admin.users.makeStudent') : t('admin.users.makeAdmin')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
