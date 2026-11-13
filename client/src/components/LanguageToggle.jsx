import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';

/** Switches between Amharic (default) and English. */
export default function LanguageToggle({ className = '' }) {
  const { t, toggle, lang } = useI18n();
  return (
    <button type="button" onClick={toggle} aria-label={t('lang.aria')}
      className={`h-11 px-3.5 rounded-xl border border-line-strong bg-ink-panel flex items-center gap-2 text-sm hover:border-teal ${className}`}>
      <Icon name="globe" size={17} />
      <span lang={lang === 'am' ? 'en' : 'am'}>{t('lang.toggle')}</span>
    </button>
  );
}
