import { useState } from 'react';
import { useApi, etb, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import useTelegramShare from '../../components/TelegramShare.jsx';
import StatusPill from '../../components/StatusPill.jsx';
import Icon from '../../components/Icon.jsx';
import TokenTopUp from '../../components/TokenTopUp.jsx';

// Referral progress (synced with the Telegram bot), reward requests and course credit.
export default function Rewards() {
  const { t, loc } = useI18n();
  const data = useApi('/me/referrals');
  const credits = useApi('/me/credits');
  const share = useTelegramShare();
  const [copied, setCopied] = useState('');
  const d = data.data;

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 2000); } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('rewards.title')}</h1>
          <p className="text-muted-soft mt-1 max-w-2xl">{t('rewards.text')}</p>
        </div>
        <button type="button" className="btn py-3 bg-cyan-300 text-[#062027] hover:bg-cyan-200" onClick={share.start}>
          <Icon name="send" />{t('rewards.linkTelegram')}
        </button>
      </div>

      <section className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 border-cyan-300/30">
          <p className="text-[13px] text-muted">{t('rewards.credit')}</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-200">{d ? t('tokens.count', { n: Number(d.creditEtb || 0).toLocaleString('en-US') }) : '…'}</p>
        </div>
        <div className="card p-5">
          <p className="text-[13px] text-muted">Telegram</p>
          <p className="mt-2 font-semibold">{d?.telegramUsername || '—'}</p>
          <p className={`text-xs mt-1 ${d?.telegramLinked ? 'text-teal-soft' : 'text-muted-dim'}`}>{d?.telegramLinked ? `✓ ${t('rewards.linked')}` : t('rewards.notLinked')}</p>
        </div>
        <div className="card p-5 text-sm text-muted-soft flex flex-col justify-center gap-2"><p>{t('tokens.rule')}</p><p>{t('rewards.spend')}</p></div>
      </section>

      <TokenTopUp onDone={() => { data.reload(); credits.reload(); }} />

      <section className="flex flex-col gap-4">
        {d?.campaigns.length === 0 && <p className="text-muted">{t('rewards.noCampaigns')}</p>}
        {d?.campaigns.map((c) => {
          const goals = c.milestones.slice().sort((a, b) => a.shares - b.shares);
          const next = goals.find((m) => m.shares > c.shares);
          const top = goals.at(-1)?.shares || 1;
          return (
            <article key={c.id} className="card p-5 flex flex-col gap-4 relative overflow-hidden">
              <span aria-hidden="true" className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r-full bg-cyan-300" />
              <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
                <div>
                  {c.kind === 'sponsored' && <span className="eyebrow text-cyan-200">{t('rewards.sponsored')}{c.sponsorName ? ` · ${c.sponsorName}` : ''}</span>}
                  <h2 className="text-lg font-semibold">{loc(c, 'title')}</h2>
                  {c.description && <p className="text-sm text-muted-soft">{c.description}</p>}
                </div>
                <p className="text-sm text-cyan-100">{next ? t('rewards.progress', { n: c.shares, goal: next.shares }) : t('rewards.done')}</p>
              </div>
              <div className="pl-2">
                <div className="h-2 rounded-full bg-line relative" role="progressbar" aria-valuemin={0} aria-valuemax={top} aria-valuenow={Math.min(c.shares, top)}>
                  <div className="h-2 rounded-full bg-cyan-300 transition-all" style={{ width: `${Math.min(100, (c.shares / top) * 100)}%` }} />
                </div>
                <ol className="mt-3 flex flex-wrap gap-2 text-xs">
                  {goals.map((m) => (
                    <li key={m.shares} className={`px-2.5 py-1.5 rounded-lg border ${c.shares >= m.shares ? 'border-cyan-300 text-cyan-100' : 'border-line-strong text-muted'}`}>
                      {m.shares} → {[m.rewardEtb ? etb(m.rewardEtb) : '', m.rewardText].filter(Boolean).join(' + ')}
                    </li>
                  ))}
                </ol>
              </div>
              {(c.botLink || c.webLink) && (
                <div className="pl-2 grid md:grid-cols-2 gap-3">
                  {[[t('rewards.botLink'), c.botLink], [t('rewards.webLink'), c.webLink]].filter(([, v]) => v).map(([label, v]) => (
                    <div key={label} className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted">{label}</span>
                      <div className="flex gap-2">
                        <input readOnly value={v} aria-label={label} className="input py-2 text-xs font-mono" onFocus={(e) => e.target.select()} />
                        <button type="button" className="btn-ghost py-2 px-3 text-xs shrink-0" onClick={() => copy(v)}>{copied === v ? t('rewards.copied') : t('rewards.copy')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <div className="grid xl:grid-cols-2 gap-6 items-start">
        <section className="card p-5 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('rewards.tickets')}</h2>
          {d?.tickets.length === 0 && <p className="text-sm text-muted">{t('rewards.noTickets')}</p>}
          {d?.tickets.map((tk) => (
            <div key={tk.id} className="flex items-center justify-between gap-3 text-sm border-b border-line pb-2.5 last:border-0">
              <span>{loc(tk.campaign, 'title')} · {tk.shares} · {[tk.rewardEtb ? etb(tk.rewardEtb) : '', tk.rewardText].filter(Boolean).join(' + ')}</span>
              <StatusPill status={tk.status} />
            </div>
          ))}
        </section>
        <section className="card p-5 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('rewards.history')}</h2>
          {credits.data?.transactions.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-3 text-sm border-b border-line pb-2.5 last:border-0">
              <span className="min-w-0">
                {t(`rewards.reasons.${x.reason}`)}{x.lesson ? ` · ${loc(x.lesson, 'title')}` : x.course ? ` · ${loc(x.course, 'title')}` : ''}{x.category ? ` · ${loc(x.category, 'title')}` : ''}
                <span className="block text-xs text-muted-dim">{fmtDate(x.createdAt)}</span>
              </span>
              <span className={x.amountEtb > 0 ? 'text-cyan-200 font-semibold' : 'text-muted-soft'}>{x.amountEtb > 0 ? '+' : ''}{t('tokens.count', { n: Number(x.amountEtb).toLocaleString('en-US') })}</span>
            </div>
          ))}
        </section>
      </div>
      {share.modal}
    </div>
  );
}
