import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  return (
    <Suspense fallback={null}>
      <VerifyEmailClient initialEmail={params.email} />
    </Suspense>
  );
}

