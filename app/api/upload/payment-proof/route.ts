import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { assertRateLimit, rateLimitKey } from '../../../../lib/rateLimit';
import { assertSameOrigin } from '../../../../lib/requestSecurity';
import { assertAllowedImageFile, getSignedUrl, uploadFile } from '../../../../lib/storage';

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'proof.jpg';
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRateLimit(rateLimitKey(request, 'upload-payment-proof'), 10, 60_000);

    const { user } = await requireUser(false);
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File wajib diunggah' }, { status: 400 });
    }
    assertAllowedImageFile(file);

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}_${safeFileName(file.name)}`;
    const storagePath = await uploadFile(`payment-proofs/${user.uid}`, fileName, buffer, file.type);
    const proofUrl = await getSignedUrl(storagePath, 60 * 24 * 30);

    return NextResponse.json({ success: true, proofPath: proofUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengunggah bukti pembayaran';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
