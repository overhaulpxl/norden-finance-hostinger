import { NextResponse } from 'next/server';
import { assertSameOrigin } from '../../../lib/requestSecurity';
import { assertRateLimit, rateLimitKey } from '../../../lib/rateLimit';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await assertRateLimit(rateLimitKey(req, 'scan-receipt'), 10, 60_000);
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 415 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 413 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    
    const imagePart = {
      inlineData: {
        data: base64String,
        mimeType: file.type
      }
    };

    const prompt = `Anda adalah asisten keuangan. Baca struk belanja ini dan keluarkan HANYA sebuah string JSON yang valid dengan format berikut (tanpa markdown, murni teks JSON):
{
  "amount": <total belanja dalam angka, tanpa Rp/titik>,
  "merchant": "<nama toko atau merchant>",
  "date": "<tanggal transaksi ISO 8601 jika terbaca, atau null>",
  "items": [
    { "name": "<nama item>", "qty": <jumlah jika terbaca atau 1>, "price": <harga item angka jika terbaca atau null> }
  ],
  "note": "<nama toko atau rangkuman 1-2 kata barang belanjaan utama>"
}

Jika gambar bukan struk, kembalikan:
{ "error": "Bukan gambar struk yang valid" }`;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();
    
    // Clean up potential markdown from the response
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    if (parsedData.error) {
      return NextResponse.json({ error: parsedData.error }, { status: 400 });
    }

    const amount = Number(parsedData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Total struk tidak terbaca' }, { status: 400 });
    }

    const items = Array.isArray(parsedData.items)
      ? parsedData.items.slice(0, 30).map((item: { name?: unknown; qty?: unknown; price?: unknown }) => ({
        name: String(item.name || 'Item').slice(0, 80),
        qty: Number.isFinite(Number(item.qty)) ? Number(item.qty) : 1,
        price: Number.isFinite(Number(item.price)) ? Number(item.price) : null,
      }))
      : [];

    return NextResponse.json({
      amount,
      merchant: parsedData.merchant ? String(parsedData.merchant).slice(0, 120) : null,
      date: parsedData.date || null,
      items,
      note: parsedData.note ? String(parsedData.note).slice(0, 160) : (parsedData.merchant || 'Struk'),
    });
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    const message = error instanceof Error ? error.message : 'Gagal menganalisis gambar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
