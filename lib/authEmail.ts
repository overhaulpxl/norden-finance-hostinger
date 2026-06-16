import { getAdminAuth } from './firebaseAdmin';
import { getAppUrl, sendEmail } from './email';
import { getVerificationEmailHtml } from './email/templates/verificationEmail';

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

  return sendEmail({
    to: email,
    subject: 'Verify your Norden Finance account',
    html: getVerificationEmailHtml({ verificationLink, userName }),
    text: [
      'Verify your email address',
      '',
      'Welcome to Norden Finance.',
      'Please verify your email address to activate your account and start tracking your money with clarity.',
      '',
      verificationLink,
      '',
      'Track your money. Find your direction.',
    ].join('\n'),
  });
}

