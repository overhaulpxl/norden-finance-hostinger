import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { contentTypeForPath, readLocalUpload } from '../../../../lib/storage';

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

function isUnsafePath(parts: string[]) {
  return parts.some((part) => !part || part === '.' || part === '..' || part.includes('/') || part.includes('\\'));
}

async function assertFileAccess(parts: string[]) {
  if (parts[0] === 'qris') return;

  if (parts[0] !== 'payment-proofs' || !parts[1]) {
    throw new Error('File tidak ditemukan');
  }

  const { user, profile } = await requireUser(false);
  if (user.uid !== parts[1] && profile.role !== 'admin') {
    throw new Error('Forbidden');
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const parts = params.path || [];
    if (!parts.length || isUnsafePath(parts)) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
    }

    await assertFileAccess(parts);
    const relativePath = parts.join('/');
    const file = await readLocalUpload(relativePath);

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': contentTypeForPath(relativePath),
        'Cache-Control': parts[0] === 'qris' ? 'public, max-age=86400' : 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'File tidak ditemukan';
    const status = message === 'Forbidden' ? 403 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
