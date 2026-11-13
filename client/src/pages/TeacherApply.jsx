import { useState } from 'react';
import { api, useApi, useAuth } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import Icon from '../components/Icon.jsx';

const SUB_CITIES = ['Addis Ketema', 'Akaky Kaliti', 'Arada', 'Bole', 'Gullele', 'Kirkos', 'Kolfe Keranio',
  'Lemi Kura', 'Lideta', 'Nifas Silk-Lafto', 'Yeka', 'Outside Addis Ababa'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const Section = ({ title, n, children }) => (
  <fieldset className="card p-6 flex flex-col gap-4">
    <legend className="sr-only">{title}</legend>
    <h2 className="text-lg font-semibold flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-teal-active text-mint grid place-items-center text-sm">{n}</span>{title}
    </h2>
    {children}
  </fieldset>
);

/** Public teacher application — no photo upload. */
export default function TeacherApply() {
  const { t, loc } = useI18n();
  const { user } = useAuth();
  const catalog = useApi('/catalog');
  const [f, setF] = useState({
    fullName: user?.name || '', age: '', email: user?.email || '', phone: user?.phone || '', education: '', subCity: '', location: '',
    experience: '', yearsExperience: '', portfolioLinks: [''], portfolioDescription: '',
    teachAllCourses: false, courses: [], otherSubjects: '', teachingMode: '', availabilityFlexible: false, availableDays: [],
    availableTimes: '', message: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleIn = (k, v) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!f.teachAllCourses && !f.courses.length && !f.otherSubjects.trim()) return setErr(t('teach.pickCourse'));
    if (!f.availabilityFlexible && !f.availableDays.length) return setErr(t('teach.pickDay'));
    setBusy(true);
    try {
      await api('/teacher-applications', { method: 'POST', body: { ...f, portfolioLinks: f.portfolioLinks.filter((l) => l.trim()) } });
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  if (done) {
    return (
      <div className="max-w-2xl card p-8 flex flex-col gap-3 items-start">
        <span className="w-12 h-12 rounded-full bg-teal text-[#0B1312] grid place-items-center"><Icon name="check" size={24} /></span>
        <h1 className="text-2xl font-semibold">{t('teach.thanksTitle')}</h1>
        <p className="text-muted-soft">{t('teach.thanksText')}</p>
      </div>
    );
  }

  const allCourses = catalog.data?.flatMap((cat) => cat.courses.map((c) => ({ ...c, group: loc(cat, 'title') }))) || [];

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold">{t('teach.title')}</h1>
        <p className="text-muted mt-1">{t('teach.subtitle')}</p>
      </div>

      <Section n="1" title={t('teach.personal')}>
        <div className="grid sm:grid-cols-[1fr_140px] gap-4">
          <label className="label">{t('teach.fullName')} *<input className="input" required value={f.fullName} onChange={set('fullName')} autoComplete="name" /></label>
          <label className="label">{t('teach.age')} *<input type="number" min="16" max="100" className="input" required value={f.age} onChange={set('age')} /></label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="label">{t('teach.email')} *<input type="email" className="input" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
          <label className="label">{t('teach.phone')} *<input type="tel" className="input" required value={f.phone} onChange={set('phone')} placeholder="+2519…" autoComplete="tel" /></label>
        </div>
        <label className="label">{t('teach.education')} *
          <textarea className="input min-h-20" required value={f.education} onChange={set('education')} placeholder={t('teach.educationPh')} />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="label">{t('teach.subCity')} *
            <select className="input" required value={f.subCity} onChange={set('subCity')}>
              <option value="">{t('teach.subCityPh')}</option>
              {SUB_CITIES.map((s) => <option key={s} value={s}>{t(`teach.subCities.${s}`)}</option>)}
            </select>
          </label>
          <label className="label">{t('teach.location')}<input className="input" value={f.location} onChange={set('location')} placeholder={t('teach.locationPh')} /></label>
        </div>
      </Section>

      <Section n="2" title={t('teach.professional')}>
        <div className="grid sm:grid-cols-[1fr_180px] gap-4 items-start">
          <label className="label">{t('teach.experience')} *
            <textarea className="input min-h-28" required value={f.experience} onChange={set('experience')} placeholder={t('teach.experiencePh')} />
          </label>
          <label className="label">{t('teach.years')}<input type="number" min="0" max="80" className="input" value={f.yearsExperience} onChange={set('yearsExperience')} /></label>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t('teach.portfolio')}</span>
          {f.portfolioLinks.map((l, i) => (
            <input key={i} type="url" className="input" value={l} placeholder={t('teach.portfolioPh')} aria-label={`${t('teach.portfolio')} ${i + 1}`}
              onChange={(e) => setF({ ...f, portfolioLinks: f.portfolioLinks.map((x, j) => (j === i ? e.target.value : x)) })} />
          ))}
          {f.portfolioLinks.length < 10 && (
            <button type="button" className="text-sm text-teal-soft self-start" onClick={() => setF({ ...f, portfolioLinks: [...f.portfolioLinks, ''] })}>{t('teach.addLink')}</button>
          )}
        </div>
        <label className="label">{t('teach.portfolioDesc')}<textarea className="input min-h-20" value={f.portfolioDescription} onChange={set('portfolioDescription')} /></label>
      </Section>

      <Section n="3" title={t('teach.preferences')}>
        <div className="flex flex-col gap-3">
          <span className="text-sm text-muted">{t('teach.whichCourses')} *</span>
          <label className={`chip self-start ${f.teachAllCourses ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
            <input type="checkbox" className="accent-teal w-4 h-4" checked={f.teachAllCourses} onChange={(e) => setF({ ...f, teachAllCourses: e.target.checked })} />
            {t('teach.allCourses')}
          </label>
          {!f.teachAllCourses && (
            <div className="grid sm:grid-cols-2 gap-2">
              {allCourses.map((c) => (
                <label key={c.id} className={`chip ${f.courses.includes(c.title) ? 'border-teal bg-teal-active/40' : 'border-line-strong'}`}>
                  <input type="checkbox" className="accent-teal w-4 h-4" checked={f.courses.includes(c.title)} onChange={() => toggleIn('courses', c.title)} />
                  <span>{loc(c, 'title')} <span className="text-xs text-muted-dim">· {c.group}</span></span>
                </label>
              ))}
            </div>
          )}
          <label className="label">{t('teach.other')}<input className="input" value={f.otherSubjects} onChange={set('otherSubjects')} placeholder={t('teach.otherPh')} /></label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-muted mb-2">{t('teach.mode')} *</legend>
          <div className="flex flex-wrap gap-2">
            {['online', 'in_person', 'both'].map((m) => (
              <label key={m} className={`chip ${f.teachingMode === m ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
                <input type="radio" name="mode" required className="accent-teal" checked={f.teachingMode === m} onChange={() => setF({ ...f, teachingMode: m })} />
                {t(`teach.modes.${m}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm text-muted mb-2">{t('teach.availability')} *</legend>
          <div className="flex flex-wrap gap-2">
            <label className={`chip ${f.availabilityFlexible ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
              <input type="radio" name="avail" className="accent-teal" checked={f.availabilityFlexible} onChange={() => setF({ ...f, availabilityFlexible: true })} />{t('teach.flexible')}
            </label>
            <label className={`chip ${!f.availabilityFlexible ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
              <input type="radio" name="avail" className="accent-teal" checked={!f.availabilityFlexible} onChange={() => setF({ ...f, availabilityFlexible: false })} />{t('teach.specificDays')}
            </label>
          </div>
          {!f.availabilityFlexible && (
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <label key={d} className={`chip ${f.availableDays.includes(d) ? 'border-teal bg-teal-active/40' : 'border-line-strong'}`}>
                  <input type="checkbox" className="accent-teal w-4 h-4" checked={f.availableDays.includes(d)} onChange={() => toggleIn('availableDays', d)} />{t(`teach.days.${d}`)}
                </label>
              ))}
            </div>
          )}
          <label className="label">{t('teach.times')}<input className="input" value={f.availableTimes} onChange={set('availableTimes')} placeholder={t('teach.timesPh')} /></label>
        </fieldset>
        <label className="label">{t('teach.message')}<textarea className="input min-h-20" value={f.message} onChange={set('message')} /></label>
      </Section>

      {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
      <button className="btn-primary self-start px-8" disabled={busy}>{busy ? t('common.sending') : t('teach.submit')}</button>
    </form>
  );
}
