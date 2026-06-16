import { NextResponse } from 'next/server';
import { processInput } from '../../actions';
import { processUserInput } from '../../actions/transactions';
import { assertSameOrigin } from '../../../lib/requestSecurity';
import { assertRateLimit, rateLimitKey } from '../../../lib/rateLimit';
import { assertShortcutWriteAccess, validateShortcutToken } from '../../../lib/shortcutToken';

type ProcessResult = Awaited<ReturnType<typeof processInput>> | Awaited<ReturnType<typeof processUserInput>>;

function getError(result: ProcessResult): string {
  return 'error' in result && typeof result.error === 'string'
    ? result.error
    : 'Gagal mencatat transaksi';
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Use POST to create shortcut transactions.' },
    { status: 405 }
  );
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  let tokenUserId: string | null = null;

  if (token) {
    tokenUserId = await validateShortcutToken(token);
    if (!tokenUserId) {
      return NextResponse.json({ success: false, error: 'Token shortcut tidak valid.' }, { status: 401 });
    }

    try {
      await assertRateLimit(rateLimitKey(request, `api-shortcut-token:${tokenUserId}`), 30, 60_000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terlalu banyak request.';
      return NextResponse.json({ success: false, error: message }, { status: 429 });
    }
  } else {
    try {
      assertSameOrigin(request);
      await assertRateLimit(rateLimitKey(request, 'api-shortcut'), 30, 60_000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid request origin';
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
  }

  const { text } = await request.json().catch(() => ({ text: '' }));

  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ success: false, error: 'Missing text parameter' }, { status: 400 });
  }

  if (text.length > 500) {
    return NextResponse.json({ success: false, error: 'Input terlalu panjang' }, { status: 413 });
  }

  try {
    const result = tokenUserId
      ? await (async () => {
          await assertShortcutWriteAccess(tokenUserId);
          return processUserInput(tokenUserId, text);
        })()
      : await processInput(text);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Transaction recorded successfully',
        data: 'result' in result ? result.result : null,
      });
    }

    return NextResponse.json({ success: false, error: getError(result) }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: tokenUserId ? 403 : 500 }
    );
  }
}
