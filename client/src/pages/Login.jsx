import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const user = await signIn(mode, f);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <Logo size="lg" />
        <form onSubmit={submit} className="card w-full p-6 sm:p-8 flex flex-col gap-4">
          <h1 className="text-xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your student account'}</h1>
          {mode === 'register' && <>
            <label className="label">Full name<input className="input" required value={f.name} onChange={set('name')} /></label>
            <label className="label">Phone (optional)<input className="input" value={f.phone} onChange={set('phone')} placeholder="+2519…" /></label>
          </>}
          <label className="label">Email<input type="email" className="input" required value={f.email} onChange={set('email')} /></label>
          <label className="label">Password<input type="password" className="input" required minLength={8} value={f.password} onChange={set('password')} /></label>
          {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
          <button className="btn-primary" disabled={busy}>{mode === 'login' ? 'Sign in' : 'Create account'}</button>
          <button type="button" className="text-sm text-teal-soft hover:text-mint" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
