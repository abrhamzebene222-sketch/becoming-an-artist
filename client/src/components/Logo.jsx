import { useI18n } from '../i18n/index.jsx';

// The brand wordmark stays in English (it is the platform's name) in both languages.
export default function Logo({ size = 'md', studio }) {
  const { t } = useI18n();
  const big = size === 'lg';
  return (
    <div className="flex flex-col leading-none select-none" aria-label="Becoming an Artist" lang="en">
      <span className={`${big ? 'text-5xl' : 'text-3xl'} font-medium text-teal tracking-tight`}>Becoming</span>
      <span className={`font-script ${big ? 'text-6xl ml-8' : 'text-[40px] ml-[18px]'} text-mint-pale -mt-1`}>an Artist</span>
      {studio && <span className="mt-2.5 text-[11px] tracking-[0.2em] text-teal-soft">{t('app.studio')}</span>}
    </div>
  );
}
