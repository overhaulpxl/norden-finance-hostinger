import { getTrialDays } from '../../lib/data/loaders';
import RegisterClient from './RegisterClient';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const trialDays = await getTrialDays();

  return <RegisterClient trialDays={trialDays} />;
}
