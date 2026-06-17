import { getAdminAuth } from './firebaseAdmin';
import { getAppUrl, sendEmail } from './email';
import { getVerificationEmailTemplate } from './email/templates/verificationEmail';

export async function sendVerificationEmail({
  email,
  userName,
}: {
  email: string;
  userName?: string | null;
}) {
  const appUrl = getAppUrl();
  const verificationLink = await getAdminAuth().generateEmailVerificationLink(email, {
    url: `${appUrl}/auth/verified`,
    handleCodeInApp: false,
  });
  const template = getVerificationEmailTemplate({ verificationLink, userName });

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

