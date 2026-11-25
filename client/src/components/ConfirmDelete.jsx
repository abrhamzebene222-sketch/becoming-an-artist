import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import PasswordInput from './PasswordInput.jsx';

/**
 * Delete guard: asks for the admin's sign-in password before a destructive delete.
 *   const { ask, dialog } = useConfirmDelete();
 *   ask(message, async (password) => api(url, { method: 'DELETE', body: { password } }));
 *   ...render {dialog} anywhere in the component.
 * A wrong password keeps the dialog open and shows the server's error; nothing is deleted.
 */
export function useConfirmDelete() {
  const [state, setState] = useState(null);
  const ask = (message, action) => setState({ message, action });
  const dialog = state ? <ConfirmDeleteDialog message={state.message} action={state.action} onClose={() => setState(null)} /> : null;
  return { ask, dialog };
}

function ConfirmDeleteDialog({ message, action, onClose }) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr('');
    try { await action(password); onClose(); }
    catch (e2) { setErr(e2.message); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="card p-6 w-full max-w-md flex flex-col gap-4">
        <p className="text-sm leading-relaxed whitespace-pre-line">{message}</p>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted">{t('confirmDelete.passwordLabel')}</span>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} minLength={1} />
        </label>
        {err && <p className="text-sm text-red-300" role="alert">{err}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" className="px-4 py-2 rounded-lg text-sm border border-line-strong text-muted" onClick={onClose} disabled={busy}>{t('confirmDelete.cancel')}</button>
          <button type="submit" className="btn-danger" disabled={busy || !password}>{busy ? '…' : t('confirmDelete.confirm')}</button>
        </div>
      </form>
    </div>
  );
}
