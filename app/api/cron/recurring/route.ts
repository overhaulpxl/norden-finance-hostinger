import { NextResponse } from 'next/server';
import { processDueRecurringTransactions } from '../../../actions/recurring';

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await processDueRecurringTransactions();
  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json(
    { error: 'Use POST with Authorization: Bearer <CRON_SECRET>.' },
    { status: 405 }
  );
}
