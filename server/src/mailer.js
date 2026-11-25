// Sends transactional email over HTTPS (Brevo or Resend). No extra npm packages.
// Render's free plan blocks SMTP ports, so an HTTPS email API is the reliable choice.
//   Brevo (recommended, free 300/day, can send from a single verified address such as your Gmail):
//     BREVO_API_KEY + MAIL_FROM
//   Resend (needs a verified domain to email other people): RESEND_API_KEY + MAIL_FROM
import { config } from './config.js';

export const mailConfigured = () => !!(config.mail.from && (config.mail.brevoKey || config.mail.resendKey));

export async function sendMail({ to, subject, text, html }) {
  const { brevoKey, resendKey, from, fromName } = config.mail;
  if (!mailConfigured()) { const e = new Error('mail-not-configured'); e.code = 'mailNotConfigured'; throw e; }
  let res;
  if (brevoKey) {
    res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: { name: fromName, email: from }, to: [{ email: to }], subject, textContent: text, htmlContent: html }),
    });
  } else {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: `${fromName} <${from}>`, to: [to], subject, text, html }),
    });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const e = new Error(`mail-failed ${res.status} ${body.slice(0, 200)}`); e.code = 'mailFailed'; throw e;
  }
}
