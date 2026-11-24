// Telegram bot ⇄ web app integration (no extra packages: plain Bot API over fetch, webhook mode).
//
// Admin › Telegram bot: paste the BotFather token + channel username → the server calls getMe + setWebhook.
// Then open the "link admin chat" deep link once, so reward tickets and assignment PDFs reach the admin.
//
// Flow:
//  • Student (web, Board 3) → enters Telegram username (guard) → opens t.me/<bot>?start=link_<code> → account linked.
//  • Bot menu: Share App (APK) · Share Web Link · Milestones & Rewards · My Progress.
//  • Every NEW Telegram user who opens t.me/<bot>?start=r_<referralCode>_<campaign> counts as one share
//    (web sign-ups through <site>/?ref=<code>&c=<campaign> count too).
//  • Milestone reached → ticket sent to the admin chat with [Approve] [Reject] (also visible in the web admin).
//  • Approve → credit (ETB) added to the student's account → student unlocks premium courses/groups with it.
import crypto from 'node:crypto';
import {
  User, ReferralCampaign, ReferralShare, RewardTicket, CreditTransaction,
} from './models/index.js';
import { getSetting, setSetting } from './lib.js';
import { encrypt, decrypt } from './secret.js';
import { notifyUser, notifyAdmins } from './notify.js';

const API = 'https://api.telegram.org';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- Settings ----------
let cfgCache = null;
let cfgAt = 0;
export async function botConfig() {
  if (cfgCache && Date.now() - cfgAt < 10_000) return cfgCache;
  cfgCache = {
    token: decrypt(await getSetting('telegramBotTokenEnc', '')),
    username: await getSetting('telegramBotUsername', ''),
    channel: await getSetting('telegramChannel', ''),
    adminChatId: await getSetting('telegramAdminChatId', ''),
    webhookSecret: await getSetting('telegramWebhookSecret', ''),
    adminLinkCode: await getSetting('telegramAdminLinkCode', ''),
    apkFileId: await getSetting('telegramApkFileId', ''),
    webUrl: (await getSetting('telegramWebUrl', '')) || (process.env.PUBLIC_ORIGIN || '').split(',')[0].trim(),
  };
  cfgAt = Date.now();
  return cfgCache;
}
export const invalidateBotConfig = () => { cfgCache = null; };
export const isBotReady = async () => { const c = await botConfig(); return !!(c.token && c.username); };

// ---------- Bot API ----------
export async function tg(method, payload = {}, token) {
  const tk = token || (await botConfig()).token;
  if (!tk) throw new Error('Telegram bot is not configured');
  const res = await fetch(`${API}/bot${tk}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  if (!data.ok) throw new Error(data.description || 'Telegram error');
  return data.result;
}

const send = (chatId, text, extra = {}) =>
  tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });

/** Send a generated file (e.g. assignment PDF) to the admin chat. */
export async function sendAdminDocument(buffer, filename, caption, mimeType = 'application/pdf') {
  const cfg = await botConfig();
  if (!cfg.token || !cfg.adminChatId) return { ok: false, status: 'not_configured' };
  const fd = new FormData();
  fd.append('chat_id', String(cfg.adminChatId));
  fd.append('caption', String(caption || '').slice(0, 1024));
  fd.append('parse_mode', 'HTML');
  fd.append('document', new Blob([buffer], { type: mimeType }), filename);
  const res = await fetch(`${API}/bot${cfg.token}/sendDocument`, { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  return data.ok ? { ok: true, status: 'sent' } : { ok: false, status: 'failed', error: data.description };
}

export async function sendAdminMessage(text, extra) {
  const cfg = await botConfig();
  if (!cfg.token || !cfg.adminChatId) return null;
  return send(cfg.adminChatId, text, extra).catch((e) => { console.warn('Telegram admin message failed:', e.message); return null; });
}

/** Admin › Telegram bot › Save. `token` may be empty (keep the stored one). */
export async function configureBot({ token, channel, webUrl, origin }) {
  const current = await botConfig();
  const useToken = token && !token.includes('…') ? token.trim() : current.token;
  if (!useToken) throw Object.assign(new Error('telegramTokenInvalid'), { code: 'telegramTokenInvalid' });
  let me;
  try { me = await tg('getMe', {}, useToken); } catch { throw Object.assign(new Error('telegramTokenInvalid'), { code: 'telegramTokenInvalid' }); }

  const secret = current.webhookSecret || crypto.randomBytes(24).toString('hex');
  await setSetting('telegramBotTokenEnc', encrypt(useToken));
  await setSetting('telegramBotUsername', me.username);
  await setSetting('telegramWebhookSecret', secret);
  if (channel !== undefined) await setSetting('telegramChannel', String(channel || '').trim().replace(/^https?:\/\/t\.me\//, '@'));
  if (webUrl !== undefined) await setSetting('telegramWebUrl', String(webUrl || '').trim().replace(/\/$/, ''));
  if (!current.adminLinkCode) await setSetting('telegramAdminLinkCode', crypto.randomBytes(9).toString('base64url'));
  invalidateBotConfig();

  let webhook = { ok: false };
  if (origin && origin.startsWith('https://')) {
    try {
      await tg('setWebhook', {
        url: `${origin}/api/telegram/webhook`, secret_token: secret,
        allowed_updates: ['message', 'callback_query'],
      }, useToken);
      webhook = { ok: true, url: `${origin}/api/telegram/webhook` };
    } catch (e) { webhook = { ok: false, error: e.message }; }
  } else webhook = { ok: false, error: 'Webhook needs a public https address (deploy on Render first).' };

  await tg('setMyCommands', {
    commands: [
      { command: 'start', description: 'Menu / ዋና ማውጫ' },
      { command: 'progress', description: 'My shares & rewards / የኔ ሂደት' },
    ],
  }, useToken).catch(() => {});
  return { username: me.username, webhook };
}

export async function botStatus() {
  const cfg = await botConfig();
  let webhook = null;
  if (cfg.token) webhook = await tg('getWebhookInfo').catch((e) => ({ error: e.message }));
  return {
    configured: !!cfg.token,
    tokenMasked: cfg.token ? `${cfg.token.slice(0, 6)}…${cfg.token.slice(-4)}` : '',
    username: cfg.username,
    channel: cfg.channel,
    webUrl: cfg.webUrl,
    adminChatLinked: !!cfg.adminChatId,
    adminLinkUrl: cfg.username && cfg.adminLinkCode ? `https://t.me/${cfg.username}?start=admin_${cfg.adminLinkCode}` : '',
    apkUploaded: !!cfg.apkFileId,
    webhook: webhook ? { url: webhook.url, pending: webhook.pending_update_count, lastError: webhook.last_error_message, error: webhook.error } : null,
  };
}

// ---------- Links ----------
export async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode;
  for (let i = 0; i < 5; i += 1) {
    const code = crypto.randomBytes(6).toString('base64url').replace(/[-_]/g, '').slice(0, 8).toUpperCase();
    if (code.length < 6) continue;
    const r = await User.updateOne({ _id: user._id, referralCode: { $exists: false } }, { referralCode: code }).catch(() => ({ modifiedCount: 0 }));
    if (r.modifiedCount) { user.referralCode = code; return code; }
    const fresh = await User.findById(user._id, 'referralCode').lean();
    if (fresh?.referralCode) { user.referralCode = fresh.referralCode; return fresh.referralCode; }
  }
  throw new Error('Could not create referral code');
}

export const botLink = (cfg, payload) => `https://t.me/${cfg.username}${payload ? `?start=${payload}` : ''}`;
export const referralBotLink = (cfg, user, campaign) => botLink(cfg, `r_${user.referralCode}_${campaign.code}`);
export const referralWebLink = (cfg, user, campaign) => (cfg.webUrl ? `${cfg.webUrl}/?ref=${user.referralCode}&c=${campaign.code}` : '');

/** One-time deep link that connects the student's web account to their Telegram account. */
export async function createLinkUrl(userId) {
  const cfg = await botConfig();
  const code = crypto.randomBytes(12).toString('base64url');
  await User.updateOne({ _id: userId }, { telegramLinkCode: code, telegramLinkExpires: new Date(Date.now() + 30 * 60 * 1000) });
  return botLink(cfg, `link_${code}`);
}

// ---------- Referral tracking ----------
async function afterShare(referrer, campaign) {
  const count = await ReferralShare.countDocuments({ referrer: referrer._id, campaign: campaign._id });
  const next = campaign.milestones.filter((m) => m.shares > count).sort((a, b) => a.shares - b.shares)[0];
  if (referrer.telegramChatId) {
    await send(referrer.telegramChatId,
      `🎉 +1 · <b>${count}</b> ${esc('ማጋራቶች / shares')} — ${esc(campaign.title)}${next ? `\n${esc('ቀጣይ ግብ / Next goal')}: ${next.shares}` : ''}`).catch(() => {});
  }
  for (const m of campaign.milestones.filter((x) => count >= x.shares)) {
    let ticket;
    try {
      ticket = await RewardTicket.create({
        user: referrer._id, campaign: campaign._id, shares: m.shares, rewardEtb: m.rewardEtb || 0, rewardText: m.rewardText || '',
      });
    } catch (e) { if (e.code === 11000) continue; throw e; }
    await announceTicket(ticket, referrer, campaign);
  }
}

async function announceTicket(ticket, user, campaign) {
  const reward = [ticket.rewardEtb ? `${ticket.rewardEtb} ETB credit` : '', ticket.rewardText].filter(Boolean).join(' + ');
  const text = `🎫 <b>Reward request / የሽልማት ጥያቄ</b>\n`
    + `👤 ${esc(user.name)} (${esc(user.telegramUsername || user.email)})\n`
    + `📣 ${esc(campaign.title)}${campaign.sponsorName ? ` · ${esc(campaign.sponsorName)}` : ''}\n`
    + `🔢 ${ticket.shares} shares\n🎁 ${esc(reward || '—')}`;
  const msg = await sendAdminMessage(text, {
    reply_markup: { inline_keyboard: [[{ text: '✅ Approve', callback_data: `tk:a:${ticket.id}` }, { text: '❌ Reject', callback_data: `tk:r:${ticket.id}` }]] },
  });
  if (msg?.message_id) await RewardTicket.updateOne({ _id: ticket._id }, { adminMessageId: msg.message_id });
  await notifyAdmins({
    type: 'reward_ticket_new', params: { name: user.name, shares: ticket.shares, reward },
    title: 'New referral reward request', body: `${user.name} · ${ticket.shares} shares`, link: '/admin/telegram',
  });
  await notifyUser(user._id, {
    type: 'reward_ticket_sent', params: { shares: ticket.shares },
    title: 'Milestone reached!', body: `${ticket.shares} shares — waiting for admin approval`, link: '/rewards',
  });
}

/** A web visitor signed up through someone's share link. */
export async function recordWebReferral(newUser, refCode, campCode) {
  if (!refCode || !campCode) return;
  const [referrer, campaign] = await Promise.all([
    User.findOne({ referralCode: String(refCode).toUpperCase() }),
    ReferralCampaign.findOne({ code: String(campCode), isActive: true }),
  ]);
  if (!referrer || !campaign || String(referrer._id) === String(newUser._id)) return;
  if (await ReferralShare.exists({ campaign: campaign._id, referredUser: newUser._id })) return;
  try {
    await ReferralShare.create({ campaign: campaign._id, referrer: referrer._id, referredUser: newUser._id, channel: 'web' });
  } catch (e) { if (e.code === 11000) return; throw e; }
  await afterShare(referrer, campaign);
}

async function recordTelegramReferral(refCode, campCode, from) {
  const [referrer, campaign] = await Promise.all([
    User.findOne({ referralCode: String(refCode).toUpperCase() }),
    ReferralCampaign.findOne({ code: String(campCode), isActive: true }),
  ]);
  if (!referrer || !campaign) return null;
  if (referrer.telegramId === String(from.id)) return campaign; // can't refer yourself
  // Each Telegram person counts once per campaign (unique index + explicit check)
  if (await ReferralShare.exists({ campaign: campaign._id, telegramId: String(from.id) })) return campaign;
  if (await User.exists({ telegramId: String(from.id), createdAt: { $lt: new Date(Date.now() - 24 * 3600 * 1000) } })) return campaign; // existing members don't count
  try {
    await ReferralShare.create({ campaign: campaign._id, referrer: referrer._id, telegramId: String(from.id), channel: 'telegram' });
    await afterShare(referrer, campaign);
  } catch (e) { if (e.code !== 11000) throw e; }
  return campaign;
}

/** Approve / reject a reward ticket — from the admin's Telegram buttons OR from the web admin. */
export async function decideTicket(ticketId, decision, via) {
  if (!['approved', 'rejected'].includes(decision)) return null;
  const t = await RewardTicket.findOneAndUpdate(
    { _id: ticketId, status: 'pending' }, { status: decision, decidedVia: via, decidedAt: new Date() }, { new: true },
  ).populate('campaign', 'title');
  if (!t) return null;
  const user = await User.findById(t.user);
  if (decision === 'approved' && t.rewardEtb > 0) {
    await User.updateOne({ _id: t.user }, { $inc: { creditEtb: t.rewardEtb } });
    await CreditTransaction.create({ user: t.user, amountEtb: t.rewardEtb, reason: 'referral_reward', ticket: t._id });
  }
  const reward = [t.rewardEtb ? `${t.rewardEtb} ETB` : '', t.rewardText].filter(Boolean).join(' + ');
  await notifyUser(t.user, decision === 'approved'
    ? { type: 'reward_approved', params: { amount: t.rewardEtb, reward }, title: 'Reward approved', body: reward, link: '/rewards' }
    : { type: 'reward_rejected', params: { reward }, title: 'Reward request rejected', body: reward, link: '/rewards' });
  if (user?.telegramChatId) {
    await send(user.telegramChatId, decision === 'approved'
      ? `✅ ${esc('ሽልማትዎ ጸድቋል / Your reward was approved')}: <b>${esc(reward)}</b>\n${esc('በመተግበሪያው ውስጥ ኮርስ ለመክፈት ይጠቀሙበት / Use it in the app to unlock a course.')}`
      : `❌ ${esc('የሽልማት ጥያቄዎ አልጸደቀም / Your reward request was not approved')}.`).catch(() => {});
  }
  const cfg = await botConfig();
  if (t.adminMessageId && cfg.adminChatId) {
    await tg('editMessageReplyMarkup', { chat_id: cfg.adminChatId, message_id: t.adminMessageId, reply_markup: { inline_keyboard: [] } }).catch(() => {});
    await send(cfg.adminChatId, `${decision === 'approved' ? '✅ APPROVED' : '❌ REJECTED'} (${via}) — ${esc(user?.name || '')} · ${t.shares} shares`,
      { reply_to_message_id: t.adminMessageId }).catch(() => {});
  }
  return t;
}

// ---------- Bot conversation ----------
function menuKeyboard(cfg) {
  const rows = [
    [{ text: '📱 Share App (APK)', callback_data: 'share_apk' }, { text: '🔗 Share Web Link', callback_data: 'share_link' }],
    [{ text: '🎯 Milestones & Rewards', callback_data: 'ms' }, { text: '📊 My Progress', callback_data: 'prog' }],
  ];
  const extra = [];
  if (cfg.webUrl) extra.push({ text: '🌐 Open app', url: cfg.webUrl });
  if (cfg.channel) extra.push({ text: '📢 Channel', url: `https://t.me/${cfg.channel.replace(/^@/, '')}` });
  if (extra.length) rows.push(extra);
  return { inline_keyboard: rows };
}

const sendMenu = (chatId, cfg, user) => send(chatId,
  `🎨 <b>Becoming an Artist</b>\n${user ? `👋 ${esc(user.name)}\n` : ''}`
  + `${esc('ጓደኞችዎን ይጋብዙ፣ ግቦችን ይድረሱ እና የኮርስ ክሬዲት ያግኙ።')}\n${esc('Invite friends, reach milestones and earn course credit.')}`,
  { reply_markup: menuKeyboard(cfg) });

const sendNeedLink = (chatId, cfg) => send(chatId,
  `🔗 ${esc('መጀመሪያ መለያዎን ያገናኙ፦ መተግበሪያውን ይክፈቱ › ካታሎግ › የማጋሪያ ሰሌዳ › "በቴሌግራም አጋራ"።')}\n`
  + `${esc('Link your account first: open the app › Catalog › Referral board › "Share via Telegram".')}`,
  cfg.webUrl ? { reply_markup: { inline_keyboard: [[{ text: '🌐 Open app', url: cfg.webUrl }]] } } : {});

async function chooseCampaign(chatId, prefix, cfg, user, sendOne) {
  const list = await ReferralCampaign.find({ isActive: true }).sort({ createdAt: 1 });
  if (!list.length) return send(chatId, esc('ለጊዜው ንቁ ዘመቻ የለም / No active campaign right now.'));
  if (list.length === 1) return sendOne(chatId, cfg, user, list[0]);
  return send(chatId, esc('ዘመቻ ይምረጡ / Choose a campaign:'), {
    reply_markup: { inline_keyboard: list.map((c) => [{ text: `${c.kind === 'sponsored' ? '⭐ ' : ''}${c.title}`, callback_data: `${prefix}:${c.code}` }]) },
  });
}

async function sendApk(chatId, cfg, user, campaign) {
  await ensureReferralCode(user);
  const link = referralBotLink(cfg, user, campaign);
  const fileId = campaign.apkFileId || cfg.apkFileId;
  if (!fileId) {
    await send(chatId, esc('APK ገና አልተጫነም — የድር ሊንኩን ያጋሩ / The APK is not uploaded yet — share the web link instead.'));
    return sendLink(chatId, cfg, user, campaign);
  }
  await tg('sendDocument', {
    chat_id: chatId, document: fileId, parse_mode: 'HTML',
    caption: `🎨 Becoming an Artist — ${esc(campaign.title)}\n${esc('ይህን APK ለጓደኞችዎ ያስተላልፉ። እያንዳንዱ ጓደኛ በሊንክዎ ሲገባ ይቆጠራል፦')}\n${esc('Forward this APK. Each friend who opens your link counts:')}\n${link}`,
  });
}

async function sendLink(chatId, cfg, user, campaign) {
  await ensureReferralCode(user);
  const link = referralBotLink(cfg, user, campaign);
  const web = referralWebLink(cfg, user, campaign);
  const shareText = campaign.kind === 'sponsored' && campaign.sponsorName
    ? `${campaign.title} — ${campaign.sponsorName}` : 'Learn art with Becoming an Artist 🎨';
  await send(chatId,
    `🔗 <b>${esc(campaign.title)}</b>\n${esc('የእርስዎ የግል ሊንክ / Your personal link')}:\n${link}${web ? `\n\n🌐 Web: ${web}` : ''}`,
    { reply_markup: { inline_keyboard: [[{ text: '📤 Share / አጋራ', url: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}` }]] } });
}

async function sendMilestones(chatId) {
  const list = await ReferralCampaign.find({ isActive: true }).sort({ createdAt: 1 });
  if (!list.length) return send(chatId, esc('ለጊዜው ንቁ ዘመቻ የለም / No active campaign right now.'));
  const text = list.map((c) => `<b>${c.kind === 'sponsored' ? '⭐ ' : ''}${esc(c.title)}</b>${c.sponsorName ? ` · ${esc(c.sponsorName)}` : ''}\n`
    + c.milestones.slice().sort((a, b) => a.shares - b.shares)
      .map((m) => `  • ${m.shares} ${esc('ሰዎች / people')} → ${[m.rewardEtb ? `${m.rewardEtb} ETB` : '', esc(m.rewardText)].filter(Boolean).join(' + ')}`).join('\n'))
    .join('\n\n');
  return send(chatId, `🎯 ${esc('ግቦች እና ሽልማቶች / Milestones & rewards')}\n\n${text}`);
}

async function sendProgress(chatId, user) {
  const [campaigns, tickets] = await Promise.all([
    ReferralCampaign.find({ isActive: true }).sort({ createdAt: 1 }),
    RewardTicket.find({ user: user._id }).sort({ createdAt: -1 }).limit(10).populate('campaign', 'title'),
  ]);
  const lines = await Promise.all(campaigns.map(async (c) => {
    const n = await ReferralShare.countDocuments({ referrer: user._id, campaign: c._id });
    const next = c.milestones.filter((m) => m.shares > n).sort((a, b) => a.shares - b.shares)[0];
    return `• ${esc(c.title)}: <b>${n}</b>${next ? ` / ${next.shares}` : ' ✅'}`;
  }));
  const tk = tickets.map((t) => `  ${t.status === 'approved' ? '✅' : t.status === 'rejected' ? '❌' : '⏳'} ${esc(t.campaign?.title || '')} · ${t.shares}`).join('\n');
  const fresh = await User.findById(user._id, 'creditEtb').lean();
  return send(chatId, `📊 <b>${esc('የእርስዎ ሂደት / Your progress')}</b>\n${lines.join('\n') || '—'}\n\n💳 Credit: <b>${fresh?.creditEtb || 0} ETB</b>${tk ? `\n\n🎫\n${tk}` : ''}`);
}

async function onStart(m, payload, cfg) {
  const chatId = m.chat.id;
  const from = m.from || {};
  if (payload.startsWith('admin_')) {
    if (cfg.adminLinkCode && payload.slice(6) === cfg.adminLinkCode) {
      await setSetting('telegramAdminChatId', String(chatId));
      invalidateBotConfig();
      return send(chatId, '✅ This chat will now receive reward tickets and assignment PDFs.\n✅ ይህ ቻት የሽልማት ጥያቄዎችን እና የአሳይንመንት PDF ይቀበላል።\n\nTip: send the APK file here with the caption /setapk to share it from the bot.');
    }
    return send(chatId, '⛔ Invalid admin link.');
  }
  if (payload.startsWith('link_')) {
    const user = await User.findOne({ telegramLinkCode: payload.slice(5), telegramLinkExpires: { $gt: new Date() } });
    if (!user) return send(chatId, esc('ሊንኩ ጊዜው አልፎበታል — ከመተግበሪያው እንደገና ይሞክሩ / This link expired — try again from the app.'));
    await User.updateMany({ telegramId: String(from.id), _id: { $ne: user._id } }, { $unset: { telegramId: 1, telegramChatId: 1 } });
    user.telegramId = String(from.id);
    user.telegramChatId = String(chatId);
    if (from.username) user.telegramUsername = `@${from.username}`;
    user.telegramLinkCode = undefined;
    user.telegramLinkExpires = undefined;
    await user.save();
    await ensureReferralCode(user);
    await notifyUser(user._id, { type: 'telegram_linked', params: {}, title: 'Telegram linked', body: user.telegramUsername, link: '/rewards' });
    await send(chatId, `✅ ${esc('መለያዎ ተገናኝቷል / Your account is linked')}, ${esc(user.name)}!`);
    return sendMenu(chatId, cfg, user);
  }
  const ref = payload.match(/^r_([A-Za-z0-9]+)_([A-Za-z0-9]+)$/);
  if (ref) {
    const campaign = await recordTelegramReferral(ref[1], ref[2], from);
    if (campaign?.kind === 'sponsored' && campaign.sponsorUrl) {
      await send(chatId, `⭐ <b>${esc(campaign.title)}</b>${campaign.sponsorName ? ` — ${esc(campaign.sponsorName)}` : ''}\n${esc(campaign.description)}`,
        { reply_markup: { inline_keyboard: [[{ text: '👉 Open', url: campaign.sponsorUrl }]] } }).catch(() => {});
    }
  }
  const user = await User.findOne({ telegramId: String(from.id) });
  return sendMenu(chatId, cfg, user);
}

async function onCallback(q, cfg) {
  const data = String(q.data || '');
  const chatId = q.message?.chat?.id;
  await tg('answerCallbackQuery', { callback_query_id: q.id }).catch(() => {});
  if (!chatId) return;

  if (data.startsWith('tk:')) {
    if (String(chatId) !== String(cfg.adminChatId)) return;
    const [, action, id] = data.split(':');
    const t = await decideTicket(id, action === 'a' ? 'approved' : 'rejected', 'telegram').catch(() => null);
    if (!t) await send(chatId, esc('This ticket was already reviewed.'));
    return;
  }
  if (data === 'ms') return sendMilestones(chatId);

  const user = await User.findOne({ telegramId: String(q.from.id) });
  if (!user) return sendNeedLink(chatId, cfg);
  if (data === 'menu') return sendMenu(chatId, cfg, user);
  if (data === 'prog') return sendProgress(chatId, user);
  if (data === 'share_apk') return chooseCampaign(chatId, 'apk', cfg, user, sendApk);
  if (data === 'share_link') return chooseCampaign(chatId, 'lnk', cfg, user, sendLink);
  const [kind, code] = data.split(':');
  if (['apk', 'lnk'].includes(kind) && code) {
    const c = await ReferralCampaign.findOne({ code, isActive: true });
    if (!c) return send(chatId, esc('Campaign ended.'));
    return kind === 'apk' ? sendApk(chatId, cfg, user, c) : sendLink(chatId, cfg, user, c);
  }
  return sendMenu(chatId, cfg, user);
}

/** Entry point for every webhook update. */
export async function handleUpdate(update) {
  const cfg = await botConfig();
  if (!cfg.token) return;
  if (update.callback_query) return onCallback(update.callback_query, cfg);
  const m = update.message;
  if (!m) return;
  const chatId = m.chat.id;
  const isAdminChat = String(chatId) === String(cfg.adminChatId);
  if (m.chat.type !== 'private' && !isAdminChat) return; // ignore random groups

  // Admin uploads the APK once: send the file to the bot with caption "/setapk" (or "/setapk CAMPAIGNCODE")
  if (m.document && isAdminChat && /^\/setapk\b/i.test(m.caption || '')) {
    const code = (m.caption || '').split(/\s+/)[1];
    if (code) {
      const r = await ReferralCampaign.updateOne({ code }, { apkFileId: m.document.file_id });
      return send(chatId, r.matchedCount ? `✅ APK saved for campaign ${esc(code)}` : `⛔ No campaign with code ${esc(code)}`);
    }
    await setSetting('telegramApkFileId', m.document.file_id);
    invalidateBotConfig();
    return send(chatId, `✅ APK saved: ${esc(m.document.file_name || '')}`);
  }

  const text = String(m.text || '').trim();
  if (text.startsWith('/start')) return onStart(m, text.split(/\s+/)[1] || '', cfg);
  if (text.startsWith('/chatid')) return send(chatId, `chat id: <code>${chatId}</code>`);
  const user = await User.findOne({ telegramId: String(m.from?.id) });
  if (text.startsWith('/progress')) return user ? sendProgress(chatId, user) : sendNeedLink(chatId, cfg);
  if (m.chat.type === 'private') return sendMenu(chatId, cfg, user);
  return undefined;
}
