import { NextResponse } from 'next/server';
import { processInput } from '../../actions';
import { assertSameOrigin } from '../../../lib/requestSecurity';
import { assertRateLimit, rateLimitKey } from '../../../lib/rateLimit';

type ProcessResult = Awaited<ReturnType<typeof processInput>>;

function getError(result: ProcessResult): string {
  return 'error' in result && typeof result.error === 'string'
    ? result.error
    : 'Gagal mencatat transaksi';
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await assertRateLimit(rateLimitKey(req, 'api-log'), 30, 60_000);
    const { input } = await req.json().catch(() => ({ input: '' }));
    
    if (typeof input !== 'string' || !input.trim()) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    if (input.length > 500) {
      return NextResponse.json({ error: 'Input terlalu panjang' }, { status: 413 });
    }

    const result = await processInput(input);
    
    if (result.success) {
      return NextResponse.json({ message: 'Success', result: 'result' in result ? result.result : null });
    }

    return NextResponse.json({ error: getError(result) }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
