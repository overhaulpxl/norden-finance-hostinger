type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = { sent: true } | { skipped: true } | { error: string };

export { getPublicAppUrl as getAppUrl } from './appUrl';

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn('Resend is not configured. Email skipped.');
    return { skipped: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const error = `Email provider rejected message: ${response.status} ${body.slice(0, 300)}`;
      console.warn(error);
      return { error };
    }

    return { sent: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Email sending failed';
    console.warn('Email sending failed:', message);
    return { error: message };
  }
}
