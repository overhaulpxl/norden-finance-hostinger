import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { assertRateLimit, rateLimitKey } from '../../../../lib/rateLimit';
import { assertSameOrigin } from '../../../../lib/requestSecurity';
import { assertAllowedImageFile, getSignedUrl, uploadFile } from '../../../../lib/storage';

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'qris.jpg';
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRateLimit(rateLimitKey(request, 'upload-qris'), 5, 60_000);

    const { profile } = await requireUser(true);
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File wajib diunggah' }, { status: 400 });
    }
    assertAllowedImageFile(file);

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `merchant_${Date.now()}_${safeFileName(file.name)}`;
    const storagePath = await uploadFile('qris', fileName, buffer, file.type);
    const imageUrl = await getSignedUrl(storagePath, 60 * 24 * 365);

    return NextResponse.json({ success: true, imageUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengunggah QRIS';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
