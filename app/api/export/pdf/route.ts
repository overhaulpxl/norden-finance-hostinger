import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { getMonthlyReportData } from '../../../../lib/data/loaders';
import { generateMonthlyReportPdf } from '../../../../lib/pdf/monthlyReport';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month'); // 1-12

    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : (now.getMonth() + 1);

    const reportData = await getMonthlyReportData(user.uid, month, year);
    const pdfBuffer = generateMonthlyReportPdf(reportData);

    const fileName = `Norden_Report_${reportData.year}_${reportData.month}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('PDF Export error:', error);
    return NextResponse.json({ error: 'Gagal membuat PDF' }, { status: 500 });
  }
}
