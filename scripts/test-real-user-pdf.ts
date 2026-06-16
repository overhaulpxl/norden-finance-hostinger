import { getMonthlyReportData } from '../lib/data/loaders';
import { generateMonthlyReportPdf } from '../lib/pdf/monthlyReport';
import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const userId = "yf8PxJOaPWYp3bvRqtTeu7onblT2"; // Zaidaan Zalfaa
  const reportData = await getMonthlyReportData(userId, 6, 2026);
  console.log('User report data saving goals:', JSON.stringify(reportData.savingGoals, null, 2));
  console.log('User report data achievements:', JSON.stringify(reportData.achievements, null, 2));
  console.log('User report data streak:', JSON.stringify(reportData.streak, null, 2));
  console.log('User report data recentTransactions count:', reportData.recentTransactions.length);

  const pdfBuffer = generateMonthlyReportPdf(reportData);
  fs.writeFileSync(path.join(process.cwd(), 'real-user-report.pdf'), Buffer.from(pdfBuffer));
  console.log('Real user PDF generated successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
