import { useApi, fmtDate, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';

export default function Assignments() {
  const { t, loc } = useI18n();
  const list = useApi('/admin/assignments');
  const tone = { sent: 'text-teal-soft', failed: 'text-[#F2A7A0]', not_configured: 'text-[#F2D98A]' };
  const label = { sent: t('assignAdmin.sent'), failed: t('assignAdmin.failed'), not_configured: t('assignAdmin.notConfigured') };
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">{t('assignAdmin.title')}</h1>
      <div className="card p-2">
        {list.data?.length === 0 && <p className="p-4 text-sm text-muted">{t('assignAdmin.none')}</p>}
        {list.data?.map((a) => (
          <div key={a.id} className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-line last:border-0 text-sm">
            <div className="min-w-0">
              <p className="font-semibold">{a.user?.name} <span className="font-normal text-muted">{a.telegramUsername} · {a.email}</span></p>
              <p className="text-muted-soft">{a.course ? loc(a.course, 'title') : '—'} · {a.imageCount}{a.reviewType ? ` · ${t(`assign.type.${a.reviewType}`)}` : ''}</p>
              {a.feeEtb ? (
                <p className="text-teal-soft">
                  {etb(a.feeEtb)} · {a.paymentMethod === 'TELEBIRR' ? t('pay.telebirr') : t('pay.cbe')} · <span className="font-mono">{a.paymentReference}</span>
                  {a.payment?.status ? ` · ${t(`common.status.${a.payment.status}`)}` : ''}
                </p>
              ) : null}
              {a.notes && <p className="text-muted-soft mt-1 whitespace-pre-line line-clamp-3">{a.notes}</p>}
              <p className="text-xs text-muted-dim mt-1">{fmtDate(a.createdAt)} · <span className={tone[a.telegramStatus]}>{label[a.telegramStatus]}</span></p>
            </div>
            <div className="flex flex-col gap-2">
              {a.pdfUrl && <a href={a.pdfUrl} target="_blank" rel="noreferrer" className="btn-ghost py-2">{t('assignAdmin.pdf')} ↗</a>}
              {a.payment?.receiptUrl && <a href={a.payment.receiptUrl} target="_blank" rel="noreferrer" className="btn-ghost py-2">{t('admin.payments.openReceipt')} ↗</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
