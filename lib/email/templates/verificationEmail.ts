import { getButton, getEmailLayout, safeText } from './base';

export function getVerificationEmailHtml({
  verificationLink,
  userName,
}: {
  verificationLink: string;
  userName?: string | null;
}) {
  const greeting = userName ? `Hi ${safeText(userName)},` : 'Hi,';

  return getEmailLayout({
    title: 'Verify your Norden Finance account',
    preheader: 'Verify your email address to activate your Norden Finance account.',
    body: `
      <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;font-weight:900;letter-spacing:-.01em;color:#111111;">Verify your email address</h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;font-weight:700;color:#111111;">${greeting}</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;font-weight:700;color:#111111;">Welcome to Norden Finance.</p>
      <p style="margin:0 0 26px;font-size:16px;line-height:1.7;font-weight:700;color:#111111;">Please verify your email address to activate your account and start tracking your money with clarity.</p>
      <div style="margin:0 0 28px;">${getButton('Verify Email', verificationLink)}</div>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;font-weight:800;color:#111111;">If the button does not work, copy and paste this link into your browser:</p>
      <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.6;font-weight:700;color:#333333;">${safeText(verificationLink)}</p>
    `,
  });
}

