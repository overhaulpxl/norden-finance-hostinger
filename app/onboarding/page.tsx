import { redirect } from 'next/navigation';
import { requireUser } from '../../lib/auth';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  let session;
  try {
    session = await requireUser(false);
  } catch {
    redirect('/login');
  }

  if (session.profile.onboardingCompleted) {
    redirect('/dashboard');
  }

  return (
    <OnboardingClient
      initialName={session.profile.fullName || ''}
      email={session.user.email}
    />
  );
}
