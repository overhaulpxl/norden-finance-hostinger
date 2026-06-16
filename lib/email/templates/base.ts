const BRAND_YELLOW = '#F5D547';
const BRAND_BLACK = '#111111';
const BRAND_WHITE = '#FFFFFF';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char] || char);
}

export function safeText(value: string | null | undefined, fallback = '') {
  return escapeHtml(value || fallback);
}

export function getEmailLayout({
  title,
  preheader,
  body,
}: {
  title: string;
  preheader: string;
  body: string;
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeText(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f4ee;font-family:Arial,Helvetica,sans-serif;color:${BRAND_BLACK};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safeText(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4ee;margin:0;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:${BRAND_WHITE};border:4px solid ${BRAND_BLACK};box-shadow:8px 8px 0 ${BRAND_BLACK};">
            <tr>
              <td style="padding:26px 26px 18px;border-bottom:4px solid ${BRAND_BLACK};background:${BRAND_WHITE};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <span style="display:inline-block;width:42px;height:42px;line-height:42px;text-align:center;background:${BRAND_YELLOW};border:3px solid ${BRAND_BLACK};font-weight:900;font-size:24px;color:${BRAND_BLACK};margin-right:12px;">N</span>
                      <span style="font-size:18px;font-weight:900;letter-spacing:.04em;color:${BRAND_BLACK};vertical-align:middle;">NORDEN FINANCE</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 26px 32px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 26px;border-top:4px solid ${BRAND_BLACK};background:${BRAND_YELLOW};">
                <p style="margin:0 0 8px;font-size:14px;line-height:1.5;font-weight:900;color:${BRAND_BLACK};">Track your money. Find your direction.</p>
                <p style="margin:0;font-size:12px;line-height:1.5;font-weight:700;color:${BRAND_BLACK};">If you did not create or update a Norden Finance account, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function getButton(label: string, href: string) {
  return `<a href="${safeText(href)}" style="display:inline-block;background:${BRAND_YELLOW};border:4px solid ${BRAND_BLACK};box-shadow:5px 5px 0 ${BRAND_BLACK};color:${BRAND_BLACK};font-size:14px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;text-decoration:none;padding:15px 22px;">${safeText(label)}</a>`;
}

