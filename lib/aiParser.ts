import { ParseResult, TransactionType } from '../types';
import { parseTransaction as fallbackParse } from './parser';

export async function parseTransactionWithAI(input: string): Promise<ParseResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Use fallback if API key is not configured or input is too simple
  if (!apiKey || input.length < 5) {
    return fallbackParse(input);
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Anda adalah parser transaksi keuangan cerdas. Ekstrak informasi dari input berikut dan kembalikan murni teks JSON valid tanpa format markdown:
Input: "${input}"

Aturan:
1. isBalanceUpdate: true jika input mengindikasikan update saldo (misal "saldo bca 100k"). Jika true, type, category tidak penting.
2. amount: angka nominal (misal 10k -> 10000, 1.5jt -> 1500000). Harus positif.
3. method: dompet sumber (misal bca, cash, dana, gopay). Jika tidak jelas, gunakan "unknown". Jangan default ke cash jika teks menyebut wallet lain.
4. transferToMethod: dompet tujuan untuk transfer (misal dana pada "transfer bni ke dana 50k"). Jika bukan transfer, null.
5. type: "masuk" (pemasukan), "keluar" (pengeluaran), atau "transfer". Default "keluar".
6. category: nama kategori (misal Makanan, Transport, Gaji, Belanja). Default "Lain-lain".
7. note: deskripsi barang atau transaksi (misal "makan soto", "gaji bulanan"). Bersihkan nominal/dompet dari teks ini.
8. tags: array kata yang diawali hashtag (misal ["#makan"]).
9. transactionDate: string format ISO 8601. Jika input mengandung kata "kemarin", kurangi 1 hari dari sekarang. Jika tidak ada keterangan waktu, gunakan current time.
TIDAK BOLEH ADA MARKDOWN SEPERTI \`\`\`json.

Contoh Output (Pengeluaran):
{"isBalanceUpdate":false,"amount":15000,"method":"gopay","transferToMethod":null,"type":"keluar","category":"Makanan","note":"makan soto","tags":[],"transactionDate":"2023-10-25T12:00:00Z"}

Contoh Output (Transfer):
{"isBalanceUpdate":false,"amount":50000,"method":"bni","transferToMethod":"dana","type":"transfer","category":"Transfer","note":"transfer","tags":[],"transactionDate":"2023-10-25T12:00:00Z"}

Contoh Output (Saldo):
{"isBalanceUpdate":true,"amount":500000,"method":"bca","transferToMethod":null,"type":"masuk","category":"","note":"","tags":[],"transactionDate":"2023-10-25T12:00:00Z"}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(cleanedText);
    
    if (data.isBalanceUpdate) {
      return {
        isBalanceUpdate: true,
        amount: Number(data.amount) || 0,
        method: String(data.method || 'unknown').toLowerCase(),
        transferToMethod: data.transferToMethod ? String(data.transferToMethod).toLowerCase() : null,
        rawInput: input
      };
    }

    return {
      isBalanceUpdate: false,
      type: (data.type as TransactionType) || 'keluar',
      category: String(data.category || 'Lain-lain'),
      amount: Number(data.amount) || 0,
      method: String(data.method || 'unknown').toLowerCase(),
      transferToMethod: data.transferToMethod ? String(data.transferToMethod).toLowerCase() : null,
      note: String(data.note || '-'),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      rawInput: input,
      transactionDate: data.transactionDate ? String(data.transactionDate) : new Date().toISOString()
    };
  } catch (error) {
    console.error('AI Parse error, using fallback:', error);
    return fallbackParse(input);
  }
}
