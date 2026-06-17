import { safeText } from './base';

const SUBJECT = 'Verify your Norden Finance account';

export function getVerificationEmailTemplate({
  verificationLink,
  userName,
}: {
  verificationLink: string;
  userName?: string | null;
}) {
  const greeting = userName ? `Hi ${safeText(userName)},` : 'Hi,';
  const safeLink = safeText(verificationLink);

  const text = [
    'Verify your email address',
    '',
    userName ? `Hi ${userName},` : 'Hi,',
    '',
    'Welcome to Norden Finance. Please verify your email address to finish setting up your account and start tracking your money securely.',
    '',
    'Verify Email:',
    verificationLink,
    '',
    'Security note: If you did not create this account, you can safely ignore this email.',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${SUBJECT}</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f5ee;font-family:Arial,Helvetica,sans-serif;color:#111111;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Verify your email address to finish setting up your Norden Finance account.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f5ee;margin:0;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e8e2d2;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 20px;background:#ffffff;border-bottom:4px solid #f5d547;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <span style="display:inline-block;width:42px;height:42px;line-height:42px;text-align:center;background:#f5d547;border:2px solid #111111;font-weight:900;font-size:24px;color:#111111;margin-right:12px;">N</span>
                      <span style="font-size:18px;font-weight:900;letter-spacing:.04em;color:#111111;vertical-align:middle;">NORDEN FINANCE</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 28px 32px;">
                <h1 style="margin:0 0 18px;font-size:28px;line-height:1.15;font-weight:900;color:#111111;">Verify your email address</h1>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.65;font-weight:700;color:#111111;">${greeting}</p>
                <p style="margin:0 0 26px;font-size:16px;line-height:1.65;font-weight:700;color:#222222;">Welcome to Norden Finance. Please verify your email address to finish setting up your account and start tracking your money securely.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
                  <tr>
                    <td bgcolor="#f5d547" style="border:2px solid #111111;border-radius:10px;">
                      <a href="${safeLink}" style="display:inline-block;color:#111111;font-size:14px;font-weight:900;text-decoration:none;letter-spacing:.04em;text-transform:uppercase;padding:15px 24px;">Verify Email</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.55;font-weight:800;color:#111111;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:0 0 24px;word-break:break-all;font-size:12px;line-height:1.6;font-weight:700;color:#444444;">${safeLink}</p>
                <p style="margin:0;background:#fff8d8;border-left:4px solid #f5d547;padding:13px 14px;font-size:13px;line-height:1.55;font-weight:700;color:#222222;">Security note: If you did not create this account, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;background:#111111;color:#ffffff;">
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;font-weight:900;color:#f5d547;">Track your money. Find your direction.</p>
                <p style="margin:0;font-size:12px;line-height:1.5;font-weight:700;color:#ffffff;">If you did not create this account, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject: SUBJECT,
    html,
    text,
  };
}

export function getVerificationEmailHtml(input: {
  verificationLink: string;
  userName?: string | null;
}) {
  return getVerificationEmailTemplate(input).html;
}

