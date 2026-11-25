import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import Logo from '../components/Logo.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import LanguageToggle from '../components/LanguageToggle.jsx';

export default function Login() {
  const { signIn, requestDeviceChange, confirmDeviceChange } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const from = location.state?.from;
  // Device lock: 'none' → normal form; 'ask' → account is on another device; 'code' → waiting for the emailed code
  const [dev, setDev] = useState({ step: 'none', code: '', info: '' });
  const goHome = (user) => navigate(from && from !== '/login' ? from : user.role === 'admin' ? '/admin' : '/', { replace: true });

  const sendCode = async () => {
    setBusy(true); setErr('');
    try {
      const r = await requestDeviceChange(f);
      setDev({ step: 'code', code: '', info: t('device.sent', { email: r.emailHint, min: r.expiresInMinutes }) });
    } catch (e2) {
      setErr(e2.code === 'deviceChangeLimit' && e2.data?.nextAllowedAt ? `${e2.message} (${new Date(e2.data.nextAllowedAt).toLocaleDateString()})` : e2.message);
    }
    setBusy(false);
  };
  const confirmCode = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { goHome(await confirmDeviceChange({ ...f, code: dev.code })); } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const user = await signIn(mode, f);
      // Go back to the page that asked for login (e.g. a paid course), otherwise to the right portal
      goHome(user);
    } catch (e2) {
      if (e2.code === 'deviceMismatch') setDev({ step: 'ask', code: '', info: '' });
      else setErr(e2.message);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="flex justify-end"><LanguageToggle /></div>
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-8 pt-6">
        <Logo size="lg" />
        {dev.step !== 'none' && (
          <form onSubmit={confirmCode} className="card w-full p-6 sm:p-8 flex flex-col gap-4">
            <h1 className="text-xl font-semibold">{t('device.title')}</h1>
            <p className="text-sm text-muted-soft">{t('device.explain')}</p>
            {dev.step === 'code' && <>
              <p className="text-sm text-teal-soft">{dev.info}</p>
              <label className="label">{t('device.codeLabel')}
                <input className="input tracking-[0.4em] text-center text-lg" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required
                  value={dev.code} onChange={(e) => setDev({ ...dev, code: e.target.value.replace(/\D/g, '') })} />
              </label>
            </>}
            {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
            {dev.step === 'ask'
              ? <button type="button" className="btn-primary" disabled={busy} onClick={sendCode}>{t('device.send')}</button>
              : <>
                  <button className="btn-primary" disabled={busy || dev.code.length !== 6}>{t('device.confirm')}</button>
                  <button type="button" className="text-sm text-teal-soft hover:text-mint" disabled={busy} onClick={sendCode}>{t('device.resend')}</button>
                </>}
            <button type="button" className="text-sm text-muted hover:text-mint" onClick={() => { setDev({ step: 'none', code: '', info: '' }); setErr(''); }}>{t('device.back')}</button>
          </form>
        )}
        <form onSubmit={submit} className={`card w-full p-6 sm:p-8 flex flex-col gap-4 ${dev.step !== 'none' ? 'hidden' : ''}`}>
          <h1 className="text-xl font-semibold">{mode === 'login' ? t('auth.welcomeBack') : t('auth.createTitle')}</h1>
          {mode === 'register' && <>
            <label className="label">{t('auth.fullName')}<input className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></label>
            <label className="label">{t('auth.phone')}<input className="input" value={f.phone} onChange={set('phone')} placeholder="+2519…" autoComplete="tel" /></label>
          </>}
          <label className="label">{t('auth.email')}<input type="email" className="input" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
          <div className="label">
            <label htmlFor="password">{t('auth.password')}</label>
            <PasswordInput id="password" value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {mode === 'register' && <span className="text-xs text-muted-dim">{t('auth.passwordHint')}</span>}
          </div>
          {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
          <button className="btn-primary" disabled={busy}>{mode === 'login' ? t('auth.signIn') : t('auth.create')}</button>
          <button type="button" className="text-sm text-teal-soft hover:text-mint" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
            {mode === 'login' ? t('auth.toRegister') : t('auth.toLogin')}
          </button>
        </form>
        <div className="text-center flex flex-col gap-2">
          <p className="text-sm text-muted">{t('auth.guestNote')}</p>
          <Link to="/catalog" className="text-sm">{t('auth.browseFree')} →</Link>
        </div>
      </div>
    </div>
  );
}
