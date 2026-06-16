import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { getMonthlyReportData } from '../../../lib/data/loaders';
import { tagsFromJson } from '../../../lib/tags';

const EXPORT_ROW_LIMIT = 5000;

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}



export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';
  if (!['json', 'csv', 'pdf'].includes(format)) {
    return NextResponse.json({ error: 'Format tidak valid' }, { status: 400 });
  }

  if (format === 'pdf') {
    const { generateMonthlyReportPdf } = await import('../../../lib/pdf/monthlyReport');
    const now = new Date();
    const reportData = await getMonthlyReportData(user.uid, now.getMonth() + 1, now.getFullYear());
    const pdfBuffer = generateMonthlyReportPdf(reportData);

    const fileName = `Norden_Report_${reportData.year}_${reportData.month}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.uid, deletedAt: null },
    include: { category: true, wallet: true, transferToWallet: true },
    orderBy: { transactionDate: 'desc' },
    take: EXPORT_ROW_LIMIT,
  });
  const balances = await prisma.balance.findMany({
    where: { userId: user.uid, archivedAt: null },
    orderBy: { name: 'asc' },
  });
  const totalBalance = balances.reduce((sum, balance) => sum + balance.currentBalance, 0);

  const payload = transactions.map((tx) => ({
    id: tx.id,
    date: tx.transactionDate.toISOString(),
    type: tx.type,
    amount: tx.amount,
    category: tx.category?.name || null,
    wallet: tx.wallet?.name || null,
    transferToWallet: tx.transferToWallet?.name || null,
    note: tx.note,
    rawInput: tx.rawInput,
    tags: tagsFromJson(tx.tags),
    receiptMerchant: tx.receiptMerchant,
    receiptDate: tx.receiptDate?.toISOString() || null,
    receiptItems: tx.receiptItems,
  }));

  if (format === 'json') {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      rowLimit: EXPORT_ROW_LIMIT,
      balances: balances.map((balance) => ({
        id: balance.id,
        name: balance.name,
        type: balance.type,
        currentBalance: balance.currentBalance,
      })),
      totalBalance,
      transactions: payload,
    });
  }

  const headers = ['id', 'date', 'type', 'amount', 'category', 'wallet', 'transferToWallet', 'note', 'rawInput', 'tags', 'receiptMerchant', 'receiptDate'];
  const csvPayload = payload.map((row) => ({
    ...row,
    tags: row.tags.join(' '),
  }));
  const rows = csvPayload.map((row) => headers.map((key) => csvEscape(row[key as keyof typeof row])).join(','));
  const csv = [headers.join(','), ...rows].join('\n');

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="norden-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
