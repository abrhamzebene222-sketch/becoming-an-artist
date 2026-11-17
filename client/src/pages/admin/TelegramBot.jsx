import { useEffect, useState } from 'react';
import { api, useApi, etb, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import Icon from '../../components/Icon.jsx';

const EMPTY = { kind: 'app', title: '', titleAm: '', description: '', sponsorName: '', sponsorUrl: '', isActive: true,
  milestones: [{ shares: 10, rewardEtb: 500, rewardText: '' }, { shares: 20, rewardEtb: 1000, rewardText: '' }, { shares: 50, rewardEtb: 1500, rewardText: '' }, { shares: 100, rewardEtb: 0, rewardText: 'Sponsored brand reward' }] };

// Bot linker (token + channel, set after deployment), campaigns with milestones, and the reward approval queue.
export default function TelegramBot() {
  const { t, loc } = useI18n();
  const status = useApi('/admin/telegram');
  const campaigns = useApi('/admin/campaigns');
  const [ticketStatus, setTicketStatus] = useState('pending');
  const tickets = useApi(`/admin/reward-tickets?status=${ticketStatus}`, [ticketStatus]);
  const [cfg, setCfg] = useState({ token: '', channel: '', webUrl: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(null);
  const s = status.data;

  useEffect(() => { if (s) setCfg({ token: '', channel: s.channel || '', webUrl: s.webUrl || window.location.origin }); }, [s]);

  const saveBot = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setMsg('');
    try {
      const r = await api('/admin/telegram', { method: 'PUT', body: cfg });
      setMsg(r.webhook?.ok ? t('bot.connected', { name: r.username }) : `${t('bot.connected', { name: r.username })} — ${r.webhook?.error || ''}`);
      status.reload();
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  const saveCampaign = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (edit.id) await api(`/admin/campaigns/${edit.id}`, { method: 'PUT', body: edit });
      else await api('/admin/campaigns', { method: 'POST', body: edit });
      setEdit(null); campaigns.reload();
    } catch (e2) { setErr(e2.message); }
  };
  const decide = async (id, decision) => { await api(`/admin/reward-tickets/${id}/decide`, { method: 'POST', body: { decision } }).catch(() => {}); tickets.reload(); };
  const ms = edit?.milestones || [];
  const setMs = (i, patch) => setEdit({ ...edit, milestones: ms.map((m, j) => (j === i ? { ...m, ...patch } : m)) });

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-3xl font-semibold">{t('bot.title')}</h1>

      <div className="grid xl:grid-cols-2 gap-6 items-start">
        <form onSubmit={saveBot} className="card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Icon name="send" />{t('bot.setup')}</h2>
          <p className={`text-sm ${s?.configured ? 'text-teal-soft' : 'text-muted'}`}>{s?.configured ? t('bot.connected', { name: s.username }) : t('bot.notConnected')}</p>
          <label className="label">{t('bot.token')}
            <input className="input font-mono text-sm" type="password" autoComplete="new-password" value={cfg.token} placeholder={s?.tokenMasked || '123456789:AA…'}
              onChange={(e) => setCfg({ ...cfg, token: e.target.value })} required={!s?.configured} />
          </label>
          <label className="label">{t('bot.channel')}<input className="input" value={cfg.channel} placeholder="@ArtistAbrham" onChange={(e) => setCfg({ ...cfg, channel: e.target.value })} /></label>
          <label className="label">{t('bot.webUrl')}<input className="input font-mono text-sm" value={cfg.webUrl} onChange={(e) => setCfg({ ...cfg, webUrl: e.target.value })} /></label>
          {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
          {msg && <p className="text-sm text-mint" role="status">{msg}</p>}
          <button className="btn-primary self-start" disabled={busy}>{busy ? t('common.sending') : t('bot.save')}</button>
        </form>

        <section className="card p-6 flex flex-col gap-4 text-sm">
          <div>
            <h3 className="font-semibold">{t('bot.adminChat')}</h3>
            <p className={s?.adminChatLinked ? 'text-teal-soft' : 'text-[#F2D98A]'}>{s?.adminChatLinked ? `✓ ${t('bot.adminLinked')}` : t('bot.adminNotLinked')}</p>
            {s?.adminLinkUrl && (
              <p className="mt-2 text-muted-soft">{t('bot.linkAdmin')}: <a href={s.adminLinkUrl} target="_blank" rel="noreferrer" className="break-all">{s.adminLinkUrl}</a></p>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{t('bot.apk')}</h3>
            <p className={s?.apkUploaded ? 'text-teal-soft' : 'text-muted'}>{s?.apkUploaded ? `✓ ${t('bot.apkOk')}` : '—'}</p>
            <p className="text-muted-soft mt-1">{t('bot.apkHow')}</p>
          </div>
          {s?.webhook && (
            <div>
              <h3 className="font-semibold">{t('bot.webhook')}</h3>
              <p className="text-muted-soft font-mono text-xs break-all">{s.webhook.url || '—'}</p>
              {s.webhook.lastError && <p className="text-[#F2A7A0] text-xs">{t('bot.webhookErr', { e: s.webhook.lastError })}</p>}
            </div>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t('bot.campaigns')}</h2>
          {!edit && <button className="btn-primary" onClick={() => { setErr(''); setEdit(structuredClone(EMPTY)); }}>{t('bot.newCampaign')}</button>}
        </div>
        {edit && (
          <form onSubmit={saveCampaign} className="card p-6 flex flex-col gap-4 border-cyan-300/30">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="label">{t('bot.kind')}
                <select className="input" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })}>
                  <option value="app">{t('bot.kinds.app')}</option><option value="sponsored">{t('bot.kinds.sponsored')}</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm min-h-11 self-end"><input type="checkbox" className="accent-teal w-4 h-4" checked={edit.isActive} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} />{t('bot.active')}</label>
              <label className="label">{t('bot.titleEn')}<input className="input" required value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></label>
              <label className="label">{t('bot.titleAm')}<input className="input" lang="am" value={edit.titleAm} onChange={(e) => setEdit({ ...edit, titleAm: e.target.value })} /></label>
              <label className="label md:col-span-2">{t('bot.description')}<textarea className="input min-h-16" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></label>
              {edit.kind === 'sponsored' && (
                <>
                  <label className="label">{t('bot.sponsorName')}<input className="input" value={edit.sponsorName} onChange={(e) => setEdit({ ...edit, sponsorName: e.target.value })} /></label>
                  <label className="label">{t('bot.sponsorUrl')}<input className="input font-mono text-sm" value={edit.sponsorUrl} placeholder="https://…" onChange={(e) => setEdit({ ...edit, sponsorUrl: e.target.value })} /></label>
                </>
              )}
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm text-muted mb-2">{t('bot.milestones')}</legend>
              <div className="hidden sm:grid grid-cols-[100px_130px_1fr_44px] gap-2 text-xs text-muted"><span>{t('bot.shares')}</span><span>{t('bot.rewardEtb')}</span><span>{t('bot.rewardText')}</span></div>
              {ms.map((m, i) => (
                <div key={i} className="grid grid-cols-[100px_130px_1fr_44px] gap-2">
                  <input aria-label={t('bot.shares')} type="number" min="1" className="input py-2" value={m.shares} onChange={(e) => setMs(i, { shares: Number(e.target.value) })} />
                  <input aria-label={t('bot.rewardEtb')} type="number" min="0" className="input py-2" value={m.rewardEtb} onChange={(e) => setMs(i, { rewardEtb: Number(e.target.value) })} />
                  <input aria-label={t('bot.rewardText')} className="input py-2" value={m.rewardText} onChange={(e) => setMs(i, { rewardText: e.target.value })} />
                  <button type="button" aria-label={t('common.remove')} className="btn-ghost p-0" onClick={() => setEdit({ ...edit, milestones: ms.filter((_, j) => j !== i) })}>×</button>
                </div>
              ))}
              <button type="button" className="text-sm text-teal-soft self-start" onClick={() => setEdit({ ...edit, milestones: [...ms, { shares: 0, rewardEtb: 0, rewardText: '' }] })}>{t('bot.addMilestone')}</button>
            </fieldset>
            {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
            <div className="flex gap-3">
              <button className="btn-primary">{t('bot.saveCampaign')}</button>
              <button type="button" className="btn-ghost" onClick={() => setEdit(null)}>{t('cloud.cancel')}</button>
            </div>
          </form>
        )}
        <div className="grid lg:grid-cols-2 gap-4">
          {campaigns.data?.map((c) => (
            <article key={c.id} className={`card p-5 flex flex-col gap-2 ${!c.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="eyebrow">{t(`bot.kinds.${c.kind}`)} · {t('bot.code')} <code>{c.code}</code></span>
                  <h3 className="font-semibold">{loc(c, 'title')}{c.sponsorName ? ` · ${c.sponsorName}` : ''}</h3>
                </div>
                <span className="text-sm text-cyan-200 shrink-0">{t('bot.shareCount', { n: c.shareCount })}</span>
              </div>
              <p className="text-xs text-muted">{c.milestones.map((m) => `${m.shares} → ${[m.rewardEtb ? etb(m.rewardEtb) : '', m.rewardText].filter(Boolean).join(' + ')}`).join(' · ')}</p>
              <div className="flex gap-2 mt-1">
                <button className="btn-ghost py-2 px-3 text-xs" onClick={() => { setErr(''); setEdit(structuredClone(c)); }}>{t('cloud.edit')}</button>
                <button className="btn-danger py-2 px-3 text-xs" onClick={async () => { await api(`/admin/campaigns/${c.id}`, { method: 'DELETE' }); campaigns.reload(); }}>{t('bot.delete')}</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t('bot.tickets')}</h2>
          <div className="flex gap-2" role="tablist">
            {['pending', 'approved', 'rejected'].map((st) => (
              <button key={st} role="tab" aria-selected={ticketStatus === st} onClick={() => setTicketStatus(st)}
                className={`chip ${ticketStatus === st ? 'border-teal bg-teal-active text-white' : 'border-line-strong text-muted-soft'}`}>{t(`common.status.${st}`)}</button>
            ))}
          </div>
        </div>
        <div className="card p-2">
          {tickets.data?.length === 0 && <p className="p-4 text-sm text-muted">{t('bot.noTickets')}</p>}
          {tickets.data?.map((tk) => (
            <div key={tk.id} className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-line last:border-0">
              <div className="text-sm min-w-0">
                <p className="font-semibold">{tk.user?.name} <span className="text-muted font-normal">{tk.user?.telegramUsername || tk.user?.email}</span></p>
                <p className="text-muted-soft">{tk.campaign?.title} · {tk.shares} · {[tk.rewardEtb ? etb(tk.rewardEtb) : '', tk.rewardText].filter(Boolean).join(' + ')}</p>
                <p className="text-xs text-muted-dim">{fmtDate(tk.createdAt)}{tk.decidedVia ? ` · ${t('bot.via', { v: tk.decidedVia })}` : ''}</p>
              </div>
              {tk.status === 'pending' && (
                <div className="flex gap-2">
                  <button className="btn-primary py-2" onClick={() => decide(tk.id, 'approved')}>{t('bot.approve')}</button>
                  <button className="btn-danger py-2" onClick={() => decide(tk.id, 'rejected')}>{t('bot.reject')}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
