import { hasSmtpConfig, sendSmtpEmail } from './email/smtp';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = { sent: true } | { skipped: true } | { error: string };

export { getPublicAppUrl as getAppUrl } from './appUrl';

function selectedEmailProvider() {
  return (process.env.EMAIL_VERIFICATION_PROVIDER || 'smtp').trim().toLowerCase();
}

function hasResendConfig() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

async function sendResendEmail({ to, subject, html, text }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
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

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = selectedEmailProvider();

  if (provider === 'resend') {
    return sendResendEmail(input);
  }

  if (provider === 'smtp' || hasSmtpConfig()) {
    try {
      await sendSmtpEmail(input);
      return { sent: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'SMTP email sending failed';
      if (hasResendConfig()) {
        console.warn('SMTP email failed; falling back to optional Resend provider:', message);
        return sendResendEmail(input);
      }
      console.warn('SMTP email sending failed:', message);
      return { error: message };
    }
  }

  if (hasResendConfig()) {
    return sendResendEmail(input);
  }

  console.warn('No transactional email provider is configured. Email skipped.');
  return { skipped: true };
}
