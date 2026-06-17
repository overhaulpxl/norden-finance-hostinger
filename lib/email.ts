import { sendSmtpEmail } from './email/smtp';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = { sent: true } | { error: string };

export { getPublicAppUrl as getAppUrl } from './appUrl';

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    await sendSmtpEmail(input);
    return { sent: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SMTP email sending failed';
    console.warn('SMTP email sending failed:', message);
    return { error: message };
  }
}
