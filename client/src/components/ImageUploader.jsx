import { useEffect, useId, useState } from 'react';
import { api, cdn, uploadImage } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';

let accountsPromise = null;
/** Admin's Cloudinary accounts (cached for the session; call refreshCloudAccounts() after editing them). */
export function useCloudAccounts() {
  const [list, setList] = useState([]);
  useEffect(() => {
    accountsPromise ||= api('/admin/cloudinary-accounts').catch(() => []);
    accountsPromise.then(setList);
  }, []);
  return list;
}
export const refreshCloudAccounts = () => { accountsPromise = null; };

/** Primary / Secondary / specific account picker used by every upload in the admin. */
export function AccountSelect({ value, onChange, className = '' }) {
  const { t } = useI18n();
  const accounts = useCloudAccounts();
  const id = useId();
  return (
    <label htmlFor={id} className={`flex items-center gap-2 text-xs text-muted ${className}`}>
      <span className="flex items-center gap-1"><Icon name="cloud" size={14} />{t('media.account')}</span>
      <select id={id} className="input py-1.5 px-2 text-xs w-auto" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="primary">{t('media.primary')}</option>
        <option value="secondary">{t('media.secondary')}</option>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.label} ({a.cloudName})</option>)}
      </select>
    </label>
  );
}

/**
 * Single image field. `replaceOnUpload` = overwrite/delete the previous file right away on Cloudinary
 * (use it when the parent saves immediately after onChange). Otherwise the server deletes the old file
 * when the parent record is saved.
 */
export default function ImageUploader({ value, onChange, folder = 'misc', replaceOnUpload = false, compact = false }) {
  const { t } = useI18n();
  const [account, setAccount] = useState('primary');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const inputId = useId();

  const pick = async (file) => {
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const media = await uploadImage(file, { account, folder, replace: replaceOnUpload ? value : null });
      onChange(media);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex ${compact ? 'items-center' : 'flex-wrap items-end'} gap-3`}>
        {value?.url ? (
          <img src={cdn(value.url, 400)} alt="" className={`${compact ? 'w-16 h-12' : 'w-36 h-24'} rounded-lg object-cover border border-line`} />
        ) : (
          <span className={`${compact ? 'w-16 h-12' : 'w-36 h-24'} rounded-lg border border-dashed border-line-strong grid place-items-center text-muted-dim`}><Icon name="image" /></span>
        )}
        <div className="flex flex-col gap-2">
          <AccountSelect value={account} onChange={setAccount} />
          <div className="flex gap-2">
            <label htmlFor={inputId} className={`btn-ghost py-2 px-3 text-sm cursor-pointer ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
              <Icon name="upload" size={15} />{busy ? t('media.uploading') : value?.url ? t('media.replace') : t('media.upload')}
            </label>
            <input id={inputId} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy}
              onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />
            {value?.url && <button type="button" className="btn-danger py-2 px-3 text-sm" onClick={() => onChange(null)}>{t('media.remove')}</button>}
          </div>
        </div>
      </div>
      {err && <p className="text-xs text-[#F2A7A0]" role="alert">{err}</p>}
    </div>
  );
}
