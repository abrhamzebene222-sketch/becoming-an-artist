import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, useApi, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import StatusPill from '../../components/StatusPill.jsx';

const STATUSES = ['new', 'reviewing', 'accepted', 'rejected'];

export default function TeacherApplications() {
  const { t } = useI18n();
  const [filter, setFilter] = useState('');
  const list = useApi(`/admin/teacher-applications${filter ? `?status=${filter}` : ''}`, [filter]);
  const { refreshOverview } = useOutletContext();
  const [notes, setNotes] = useState({});

  const update = async (id, body) => {
    await api(`/admin/teacher-applications/${id}`, { method: 'PATCH', body });
    list.reload(); refreshOverview?.();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{t('admin.teachers.title')}</h1>
        <div className="flex flex-wrap gap-2" role="tablist">
          {['', ...STATUSES].map((s) => (
            <button key={s || 'all'} role="tab" aria-selected={filter === s} onClick={() => setFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-sm ${filter === s ? 'bg-teal text-[#0B1312] font-semibold' : 'border border-line-strong text-muted-soft'}`}>
              {s ? t(`common.status.${s}`) : t('common.all')}
            </button>
          ))}
        </div>
      </div>
      {list.data?.length === 0 && <p className="text-muted">{t('admin.teachers.none')}</p>}
      <div className="grid xl:grid-cols-2 gap-5">
        {list.data?.map((a) => (
          <article key={a.id} className="card p-6 flex flex-col gap-4">
            <div className="flex justify-between gap-3 flex-wrap">
              <div>
                <p className="text-lg font-semibold">{a.fullName}</p>
                <p className="text-xs text-muted">{t('admin.teachers.received', { date: fmtDate(a.createdAt) })}</p>
              </div>
              <StatusPill status={a.status} />
            </div>
            <dl className="text-sm grid grid-cols-[130px_1fr] gap-x-3 gap-y-2">
              <dt className="text-muted">{t('admin.teachers.age')}</dt><dd>{a.age}</dd>
              <dt className="text-muted">{t('admin.teachers.contact')}</dt>
              <dd className="break-all"><a href={`tel:${a.phone}`}>{a.phone}</a> · <a href={`mailto:${a.email}`}>{a.email}</a></dd>
              <dt className="text-muted">{t('admin.teachers.location')}</dt><dd>{t(`teach.subCities.${a.subCity}`)}{a.location ? ` — ${a.location}` : ''}</dd>
              <dt className="text-muted">{t('admin.teachers.education')}</dt><dd className="whitespace-pre-line">{a.education}</dd>
              <dt className="text-muted">{t('admin.teachers.experience')}</dt>
              <dd className="whitespace-pre-line">{a.yearsExperience ? <strong>{t('admin.teachers.years', { n: a.yearsExperience })}. </strong> : null}{a.experience}</dd>
              {(a.portfolioLinks.length > 0 || a.portfolioDescription) && <>
                <dt className="text-muted">{t('admin.teachers.portfolio')}</dt>
                <dd className="flex flex-col gap-1">
                  {a.portfolioLinks.map((l) => <a key={l} href={l} target="_blank" rel="noreferrer noopener" className="break-all">{l}</a>)}
                  {a.portfolioDescription && <span className="text-muted-soft whitespace-pre-line">{a.portfolioDescription}</span>}
                </dd>
              </>}
              <dt className="text-muted">{t('admin.teachers.courses')}</dt>
              <dd>{a.teachAllCourses ? t('teach.allCourses') : a.courses.join(', ')}{a.otherSubjects ? ` · ${a.otherSubjects}` : ''}</dd>
              <dt className="text-muted">{t('admin.teachers.mode')}</dt><dd>{t(`teach.modes.${a.teachingMode}`)}</dd>
              <dt className="text-muted">{t('admin.teachers.availability')}</dt>
              <dd>{a.availabilityFlexible ? t('teach.flexible') : a.availableDays.map((d) => t(`teach.days.${d}`)).join(', ')}{a.availableTimes ? ` · ${a.availableTimes}` : ''}</dd>
              {a.message && <><dt className="text-muted">{t('admin.teachers.message')}</dt><dd className="whitespace-pre-line">{a.message}</dd></>}
            </dl>
            <div className="grid sm:grid-cols-[180px_1fr_auto] gap-2 items-end border-t border-line pt-4">
              <label className="label">{t('admin.requests.status')}
                <select className="input py-2" value={a.status} onChange={(e) => update(a.id, { status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{t(`common.status.${s}`)}</option>)}
                </select>
              </label>
              <label className="label">{t('admin.teachers.note')}
                <input className="input py-2" value={notes[a.id] ?? a.adminNote ?? ''} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} />
              </label>
              <button className="btn-ghost py-2" onClick={() => update(a.id, { adminNote: notes[a.id] ?? a.adminNote ?? '' })}>{t('common.save')}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
