import { getButton, getEmailLayout, safeText } from './base';
import { getAppUrl } from '../../email';

export function getPaymentApprovedEmailHtml({
  userName,
}: {
  userName?: string | null;
}) {
  const appUrl = getAppUrl();
  const greeting = userName ? `Hi ${safeText(userName)},` : 'Hi,';

  return getEmailLayout({
    title: 'Norden Pro is now active',
    preheader: 'Your Norden Pro subscription is now active.',
    body: `
      <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;font-weight:900;color:#111111;">Norden Pro is now active</h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;font-weight:700;color:#111111;">${greeting}</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;font-weight:700;color:#111111;">Your payment has been approved.</p>
      <p style="margin:0 0 26px;font-size:16px;line-height:1.7;font-weight:700;color:#111111;">Your Norden Pro subscription is now active.</p>
      <div style="margin:0;">${getButton('Open Dashboard', `${appUrl}/dashboard`)}</div>
    `,
  });
}

export function getPaymentRejectedEmailHtml({
  userName,
  adminNote,
}: {
  userName?: string | null;
  adminNote?: string | null;
}) {
  const appUrl = getAppUrl();
  const greeting = userName ? `Hi ${safeText(userName)},` : 'Hi,';
  const note = adminNote
    ? `<p style="margin:0 0 22px;font-size:14px;line-height:1.7;font-weight:700;color:#111111;background:#fff4bf;border:3px solid #111111;padding:14px;">Admin note: ${safeText(adminNote)}</p>`
    : '';

  return getEmailLayout({
    title: 'Norden Pro payment needs review',
    preheader: 'Your payment proof could not be verified.',
    body: `
      <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;font-weight:900;color:#111111;">Norden Pro payment needs review</h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;font-weight:700;color:#111111;">${greeting}</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;font-weight:700;color:#111111;">Your payment proof could not be verified.</p>
      <p style="margin:0 0 22px;font-size:16px;line-height:1.7;font-weight:700;color:#111111;">Please upload a new proof or contact support.</p>
      ${note}
      <div style="margin:0;">${getButton('Review Payment', `${appUrl}/upgrade`)}</div>
    `,
  });
}
