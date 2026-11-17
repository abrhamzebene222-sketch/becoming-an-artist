import { useI18n } from '../i18n/index.jsx';

const TONE = {
  pending: 'bg-[#3A3420] text-[#F2D98A]', requested: 'bg-[#3A3420] text-[#F2D98A]', open: 'bg-[#3A3420] text-[#F2D98A]', new: 'bg-[#3A3420] text-[#F2D98A]',
  reviewing: 'bg-line text-mint',
  approved: 'bg-teal-active text-mint', paid: 'bg-teal-active text-mint', completed: 'bg-teal-active text-mint',
  planned: 'bg-teal-active text-mint', done: 'bg-teal-active text-mint', accepted: 'bg-teal-active text-mint',
  rejected: 'bg-[#3A2220] text-[#F2A7A0]', declined: 'bg-[#3A2220] text-[#F2A7A0]',
};

export default function StatusPill({ status }) {
  const { t } = useI18n();
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TONE[status] || 'bg-line text-muted-soft'}`}>
      {t(`common.status.${status}`)}
    </span>
  );
}
