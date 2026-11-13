import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';

/** Password field with an eye button to show / hide what was typed. */
export default function PasswordInput({ value, onChange, autoComplete = 'current-password', id, minLength = 8, required = true }) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} className="input pr-12" value={value} onChange={onChange}
        autoComplete={autoComplete} minLength={minLength} required={required} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={show} title={show ? t('auth.hidePassword') : t('auth.showPassword')}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-lg text-muted hover:text-mint">
        <Icon name={show ? 'eyeOff' : 'eye'} size={19} />
      </button>
    </div>
  );
}
