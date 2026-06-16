import { jsPDF } from 'jspdf';
import autoTable, { type CellHookData } from 'jspdf-autotable';
import { formatCurrency } from '../format';
import * as fs from 'fs';
import * as path from 'path';

let logoBase64 = '';
let iconBase64 = '';

function getLogoImages() {
  if (!logoBase64 || !iconBase64) {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'brand', 'norden-horizontal.png');
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
    } catch (e) {
      console.error('Failed to load norden-horizontal.png', e);
    }
    try {
      const iconPath = path.join(process.cwd(), 'public', 'brand', 'norden-icon.png');
      iconBase64 = fs.readFileSync(iconPath).toString('base64');
    } catch (e) {
      console.error('Failed to load norden-icon.png', e);
    }
  }
  return { logoBase64, iconBase64 };
}

// ─── Interfaces ───

export interface MonthlyReportTransaction {
  id: string;
  transactionDate: Date;
  type: 'masuk' | 'keluar' | 'transfer';
  amount: number;
  note: string | null;
  category: { name: string } | null;
  wallet: { name: string } | null;
  transferToWallet?: { name: string } | null;
}

export interface MonthlyReportSavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
}

export interface MonthlyReportAchievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: Date;
}

export interface MonthlyReportData {
  userFullName: string | null;
  userPlan: 'trial' | 'pro';
  month: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  monthName: string;
  periodLabel: string;
  generatedDateLabel: string;
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  transferVolume: number;
  cashflow: number;
  activeWalletBalance: number;
  largestExpenseCategory: string | null;
  largestExpenseAmount: number;
  largestExpensePercentage: number;
  recentTransactions: MonthlyReportTransaction[];
  savingGoals: MonthlyReportSavingGoal[];
  financialHealthScore: number;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastInputDate: Date | null;
  };
  achievements: MonthlyReportAchievement[];
  topCategoryName?: string;
  topCategoryAmount?: number;
  topCategoryPercent?: number;
  transactions?: MonthlyReportTransaction[];
}

// ─── Formatting Helpers ───

function typeLabel(type: string): string {
  if (type === 'masuk') return 'Masuk';
  if (type === 'transfer') return 'Transfer';
  return 'Keluar';
}

function typePrefix(type: string): string {
  if (type === 'masuk') return '+ ';
  if (type === 'transfer') return '~ ';
  return '- ';
}

// ─── Drawing Primitives ───

export function drawWedge(doc: jsPDF, cx: number, cy: number, r: number, startDeg: number, endDeg: number, fill: [number, number, number]) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  for (let deg = startDeg; deg < endDeg; deg += 2) {
    const next = Math.min(deg + 2, endDeg);
    const r1 = (deg * Math.PI) / 180, r2 = (next * Math.PI) / 180;
    doc.triangle(cx, cy, cx + r * Math.cos(r1), cy + r * Math.sin(r1), cx + r * Math.cos(r2), cy + r * Math.sin(r2), 'F');
  }
}

export function drawSparkle(doc: jsPDF, cx: number, cy: number, rx: number, ry: number) {
  doc.setFillColor(244, 196, 48);
  doc.triangle(cx, cy - ry, cx - rx * 0.25, cy, cx + rx * 0.25, cy, 'F');
  doc.triangle(cx, cy + ry, cx - rx * 0.25, cy, cx + rx * 0.25, cy, 'F');
  doc.triangle(cx - rx, cy, cx, cy - ry * 0.25, cx, cy + ry * 0.25, 'F');
  doc.triangle(cx + rx, cy, cx, cy - ry * 0.25, cx, cy + ry * 0.25, 'F');
}

export function drawMiniLineChart(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const pts = [
    { px: x, py: y + h * 0.8 },
    { px: x + w * 0.25, py: y + h * 0.5 },
    { px: x + w * 0.5, py: y + h * 0.65 },
    { px: x + w * 0.75, py: y + h * 0.3 },
    { px: x + w, py: y + h * 0.1 },
  ];
  doc.setDrawColor(244, 196, 48);
  doc.setLineWidth(0.6);
  for (let i = 0; i < pts.length - 1; i++) doc.line(pts[i].px, pts[i].py, pts[i + 1].px, pts[i + 1].py);
  doc.setFillColor(244, 196, 48);
  pts.forEach(p => doc.circle(p.px, p.py, 0.65, 'F'));
}

export function drawNeobrutalistCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: [number, number, number] = [255, 255, 255],
  shadowOffset: number = 1.5
) {
  doc.setFillColor(17, 17, 17);
  doc.rect(x + shadowOffset, y + shadowOffset, w, h, 'F');

  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.65);
  doc.rect(x, y, w, h, 'FD');
}

// ─── New N-Arrow Logo ───

export function drawNordenLogo(doc: jsPDF, x: number, y: number, size: number) {
  // Yellow square with black border
  doc.setFillColor(255, 224, 102);
  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.6);
  doc.roundedRect(x, y, size, size, 1.2, 1.2, 'FD');

  // Black N monogram with integrated upward arrow
  const cx = x + size / 2;
  const cy = y + size / 2;
  const s = size * 0.32;

  doc.setLineWidth(size * 0.08);
  doc.setDrawColor(17, 17, 17);
  doc.setLineCap('round');

  // Left vertical stroke of N
  doc.line(cx - s, cy + s, cx - s, cy - s * 0.6);
  // Diagonal of N
  doc.line(cx - s, cy - s * 0.6, cx + s, cy + s);
  // Right vertical stroke (arrow shaft) going up
  doc.line(cx + s, cy + s, cx + s, cy - s);

  // Arrow head at top of right stroke
  const ah = size * 0.12;
  doc.line(cx + s - ah, cy - s + ah, cx + s, cy - s);
  doc.line(cx + s + ah, cy - s + ah, cx + s, cy - s);

  doc.setLineCap('butt');
}

// ─── Section Drawings ───

export function drawHeader(doc: jsPDF, data: MonthlyReportData) {
  const { logoBase64 } = getLogoImages();

  if (logoBase64) {
    // Aspect ratio: 1030 x 360 -> ~2.86
    // Width = 11.5 * 2.86 = 32.9mm
    doc.addImage(logoBase64, 'PNG', 15, 14, 32.9, 11.5);
  } else {
    drawNordenLogo(doc, 15, 14, 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(17, 17, 17);
    doc.text('NORDEN', 29.5, 21);

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('FINANCE', 29.5, 25);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Monthly Report', 195, 17, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(17, 17, 17);
  doc.text(data.monthName, 195, 24.5, { align: 'right' });

  // Yellow accent line
  const monthWidth = doc.getTextWidth(data.monthName);
  doc.setFillColor(244, 196, 48);
  doc.rect(195 - monthWidth, 27, monthWidth, 1.2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Periode: ${data.periodLabel}`, 195, 32, { align: 'right' });
  if (data.userFullName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`Pengguna: ${data.userFullName}`, 15, 32);
  }
}

export function drawHeroSummaryCard(doc: jsPDF, data: MonthlyReportData) {
  const Y = 38;
  const H = 48;

  // Draw Neobrutalist card with Norden Yellow background
  drawNeobrutalistCard(doc, 15, Y, 180, H, [255, 224, 102]);

  // Sparkle icon in dark/black
  doc.setFillColor(17, 17, 17);
  drawSparkle(doc, 21, Y + 6.5, 2.5, 2.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 17, 17);
  doc.text('Ringkasan Keuangan Anda', 26, Y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text('Berikut adalah ringkasan performa keuangan Anda untuk bulan ini.', 26, Y + 12.2);

  // 5 metric columns
  const metricY = Y + 25;
  const W = 36;
  const centers = [33, 69, 105, 141, 177];
  const labels = ['TRANSAKSI', 'TOTAL INCOME', 'TOTAL EXPENSE', 'TRANSFER VOL.', 'CASHFLOW'];
  const values = [
    String(data.totalTransactions),
    formatCurrency(data.totalIncome),
    formatCurrency(data.totalExpense),
    formatCurrency(data.transferVolume),
    formatCurrency(data.cashflow),
  ];
  
  // High contrast neobrutalist colors for readability
  const colors: [number, number, number][] = [
    [17, 17, 17],       // Transaksi (black)
    [27, 94, 32],       // Income (dark green)
    [183, 28, 28],      // Expense (dark red)
    [13, 71, 161],      // Transfer (dark blue)
    data.cashflow >= 0 ? [27, 94, 32] : [183, 28, 28], // Cashflow (dark green or red)
  ];
  const subs = ['Transaksi', '', '', '', ''];

  // Dividers
  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.35);
  for (let i = 1; i <= 4; i++) doc.line(15 + W * i, Y + 18, 15 + W * i, Y + 43);

  for (let i = 0; i < 5; i++) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(80, 80, 80);
    doc.text(labels[i], centers[i], metricY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    const valSize = i === 0 ? 13 : 9.5;
    doc.setFontSize(valSize);
    doc.setTextColor(colors[i][0], colors[i][1], colors[i][2]);
    doc.text(values[i], centers[i], metricY + 10, { align: 'center' });

    if (subs[i]) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(80, 80, 80);
      doc.text(subs[i], centers[i], metricY + 15, { align: 'center' });
    }
  }
}

export function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFillColor(244, 196, 48);
  doc.rect(15, y, 1.6, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 17, 17);
  doc.text(title, 19.5, y + 3.8);
}

export function drawBalanceSummary(doc: jsPDF, data: MonthlyReportData, y: number) {
  const H = 30;
  const gap = 6;

  // Card 1 — Saldo Dompet Aktif
  drawNeobrutalistCard(doc, 15, y, 87, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Saldo Dompet Aktif', 22, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 17, 17);
  doc.text(formatCurrency(data.activeWalletBalance), 22, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text('Total saldo di semua dompet aktif', 22, y + 23);

  // Card 2 — Cashflow Bulan Ini
  const neg = data.cashflow < 0;
  const bg: [number, number, number] = neg ? [255, 230, 230] : [220, 245, 225];
  const valColor: [number, number, number] = neg ? [183, 28, 28] : [27, 94, 32];
  const msg = neg ? 'Pengeluaran lebih besar dari pemasukan' : 'Pemasukan lebih besar dari pengeluaran';

  drawNeobrutalistCard(doc, 15 + 87 + gap, y, 87, H, bg);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Cashflow Bulan Ini', 115, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(valColor[0], valColor[1], valColor[2]);
  doc.text(formatCurrency(data.cashflow), 115, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(80, 80, 80);
  doc.text(msg, 115, y + 23);
}

export function drawExpenseSection(doc: jsPDF, data: MonthlyReportData, y: number) {
  const H = 38;
  const gap = 6;

  // Left Card — Donut
  drawNeobrutalistCard(doc, 15, y, 87, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Kategori Pengeluaran Terbesar', 22, y + 7);

  if (data.totalExpense === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('Belum ada data pengeluaran.', 58, y + 22, { align: 'center' });
  } else {
    const cx = 36, cy = y + 23, r = 11;
    // Donut chart neobrutalist styling
    drawWedge(doc, cx, cy, r, 0, 360, [240, 240, 240]);
    drawWedge(doc, cx, cy, r, -90, -90 + data.largestExpensePercentage * 3.6, [255, 224, 102]);
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy, r * 0.55, 'F');

    // Central percentage text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 17, 17);
    doc.text(`${data.largestExpensePercentage}%`, cx, cy + 2.5, { align: 'center' });

    // Legend
    const lx = 54;
    doc.setFillColor(255, 224, 102);
    doc.setDrawColor(17, 17, 17);
    doc.setLineWidth(0.4);
    doc.rect(lx, y + 14, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 17, 17);
    const catName = data.largestExpenseCategory || '-';
    doc.text(catName.length > 12 ? catName.slice(0, 10) + '..' : catName, lx + 5, y + 16.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(17, 17, 17);
    doc.text(formatCurrency(data.largestExpenseAmount), 97, y + 16.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text('Porsi total belanja', lx, y + 27);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(17, 17, 17);
    doc.text(`${data.largestExpensePercentage}%`, 97, y + 27, { align: 'right' });
  }

  // Right Card — Cashflow & Savings Analysis
  drawNeobrutalistCard(doc, 15 + 87 + gap, y, 87, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('ANALISIS ALUR KAS & RASIO', 115, y + 7);

  if (data.totalIncome === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text('Belum ada pendapatan tercatat bulan ini.', 115, y + 18);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text('Catat pemasukan untuk memantau rasio tabungan.', 115, y + 24, { maxWidth: 75 });
  } else {
    const expenseRatio = Math.round((data.totalExpense / data.totalIncome) * 100);
    const savingsRatio = 100 - expenseRatio;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text('RASIO PENGELUARAN', 115, y + 14);
    doc.text('RASIO MENABUNG', 158, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(expenseRatio > 80 ? 183 : 17, expenseRatio > 80 ? 28 : 17, expenseRatio > 80 ? 28 : 17);
    doc.text(`${expenseRatio}%`, 115, y + 21);

    doc.setTextColor(savingsRatio >= 20 ? 27 : 17, savingsRatio >= 20 ? 94 : 17, savingsRatio >= 20 ? 32 : 17);
    doc.text(`${savingsRatio}%`, 158, y + 21);

    // Dynamic advice sentence
    let advice = '';
    if (savingsRatio >= 20) {
      advice = 'Sangat baik! Anda berhasil menyisihkan >= 20% pendapatan.';
    } else if (savingsRatio > 0) {
      advice = 'Cukup sehat. Coba kurangi belanja non-primer agar rasio naik.';
    } else {
      advice = 'Peringatan: Belanja melebihi pemasukan (defisit)!';
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(80, 80, 80);
    doc.text(advice, 115, y + 28, { maxWidth: 78 });
  }
}

export function drawRecentTransactions(doc: jsPDF, data: MonthlyReportData, y: number) {
  let body: string[][];
  const transactions = data.recentTransactions;

  if (transactions.length === 0) {
    body = [['', '', 'Belum ada transaksi bulan ini.', '', '']];
  } else {
    body = transactions.map(t => {
      const d = t.transactionDate ? new Date(t.transactionDate) : null;
      const dateStr = d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '-';
      return [
        dateStr,
        typePrefix(t.type) + typeLabel(t.type),
        formatCurrency(t.amount),
        t.category?.name || '-',
        (t.note || '-').slice(0, 50),
      ];
    });
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [['TANGGAL', 'TIPE', 'JUMLAH', 'KATEGORI', 'CATATAN']],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 224, 102], // Norden Yellow header
      textColor: [17, 17, 17],
      fontStyle: 'bold',
      fontSize: 6.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      lineWidth: 0.35,
      lineColor: [17, 17, 17],
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [17, 17, 17],
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      lineWidth: 0.35,
      lineColor: [17, 17, 17],
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 22 },
      2: { cellWidth: 30, fontStyle: 'bold' },
      3: { cellWidth: 26 },
      4: { cellWidth: 'auto' },
    },
    didParseCell(hook: CellHookData) {
      if (hook.section === 'body') {
        if (transactions.length === 0) {
          if (hook.column.index === 2) {
            hook.cell.styles.halign = 'center';
            hook.cell.styles.fontStyle = 'italic';
            hook.cell.styles.textColor = [160, 160, 160];
          }
          return;
        }

        const raw = String(hook.row.cells[1].raw);
        if (hook.column.index === 1 || hook.column.index === 2) {
          if (raw.includes('Keluar')) hook.cell.styles.textColor = [183, 28, 28];
          else if (raw.includes('Masuk')) hook.cell.styles.textColor = [27, 94, 32];
          else if (raw.includes('Transfer')) hook.cell.styles.textColor = [13, 71, 161];
        }
      }
    },
  });
}

export function drawGoalsAndHealth(doc: jsPDF, data: MonthlyReportData, y: number) {
  const H = 28;
  const gap = 6;
  const cardW = 87;

  // Draw Score Card (Left)
  drawNeobrutalistCard(doc, 15, y, cardW, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('SKOR KESEHATAN FINANSIAL', 22, y + 8);

  // Large score number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(17, 17, 17);
  doc.text(`${data.financialHealthScore}`, 22, y + 17);
  
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('/ 100', 22 + doc.getTextWidth(`${data.financialHealthScore}`) + 2, y + 17);

  // Score description based on health
  let statusText = 'Perlu Perhatian';
  let statusBg = [255, 230, 230];
  let statusBorder = [183, 28, 28];
  if (data.financialHealthScore >= 80) {
    statusText = 'Sangat Sehat';
    statusBg = [220, 245, 225];
    statusBorder = [27, 94, 32];
  } else if (data.financialHealthScore >= 50) {
    statusText = 'Cukup Sehat';
    statusBg = [255, 243, 224];
    statusBorder = [230, 81, 0];
  }

  // Draw status badge
  const tw = doc.getTextWidth(statusText);
  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.setDrawColor(statusBorder[0], statusBorder[1], statusBorder[2]);
  doc.setLineWidth(0.35);
  doc.rect(22, y + 21, tw + 4, 4.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(statusBorder[0], statusBorder[1], statusBorder[2]);
  doc.text(statusText, 24, y + 24.2);

  // Draw Saving Goals Card (Right)
  drawNeobrutalistCard(doc, 15 + cardW + gap, y, cardW, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('TARGET TABUNGAN', 115, y + 8);

  if (data.savingGoals.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text('Belum ada target tabungan aktif.', 115, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(160, 160, 160);
    doc.text('Buat target tabungan di aplikasi untuk memantau progres.', 115, y + 21, { maxWidth: 75 });
  } else {
    // Render top 2 saving goals with custom visual progress bars
    const goals = data.savingGoals.slice(0, 2);
    goals.forEach((goal, idx) => {
      const gy = y + 13 + idx * 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(17, 17, 17);
      const title = goal.title.length > 20 ? goal.title.slice(0, 18) + '..' : goal.title;
      doc.text(title, 115, gy);

      // Progress bar container (Neobrutalist track)
      const barW = 45;
      const barH = 2.5;
      const barX = 115;
      const barY = gy + 1.5;
      
      doc.setFillColor(245, 244, 240);
      doc.setDrawColor(17, 17, 17);
      doc.setLineWidth(0.35);
      doc.rect(barX, barY, barW, barH, 'FD');
      
      const pct = goal.targetAmount > 0 ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0;
      if (pct > 0) {
        doc.setFillColor(255, 224, 102); // Norden Yellow
        doc.rect(barX, barY, barW * pct, barH, 'FD');
      }

      // Progress text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(80, 80, 80);
      const pctLabel = `${Math.round(pct * 100)}%`;
      doc.text(pctLabel, barX + barW + 2, barY + 2.2);
    });
  }
}

export function drawAchievementsAndStreak(doc: jsPDF, data: MonthlyReportData, y: number) {
  const streakText = data.streak.currentStreak > 0
    ? `${data.streak.currentStreak} hari berjalan (terbaik ${data.streak.longestStreak} hari).`
    : 'Belum ada streak pencatatan bulan ini.';
  const achievementText = data.achievements.length > 0
    ? data.achievements.slice(0, 3).map((achievement) => achievement.title).join(', ')
    : 'Belum ada achievement bulan ini.';

  const H = 24;
  drawNeobrutalistCard(doc, 15, y, 180, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('STREAK PENCATATAN', 22, y + 8);
  doc.text('ACHIEVEMENT UNLOCKED', 105, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(17, 17, 17);
  doc.text(streakText, 22, y + 15, { maxWidth: 72 });
  doc.text(achievementText, 105, y + 15, { maxWidth: 80 });
}

export function drawMotivationBox(doc: jsPDF, y: number) {
  const H = 18;
  drawNeobrutalistCard(doc, 15, y, 180, H, [255, 247, 221]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(17, 17, 17);
  doc.text('Terus tingkatkan performa keuanganmu!', 22, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text('Disiplin mencatat, bijak mengelola, dan konsisten menabung adalah kunci masa depan finansial yang lebih baik.', 22, y + 12);
}

export function drawFooter(doc: jsPDF, data: MonthlyReportData) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.25);
    doc.line(15, ph - 23, 195, ph - 23);

    // Generated label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(160, 160, 160);
    doc.text('Generated', 15, ph - 18.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(90, 90, 90);
    doc.text(data.generatedDateLabel, 15, ph - 14.5);

    // Brand
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 17, 17);
    doc.text('Norden Finance', 15, ph - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(130, 130, 130);
    doc.text('Track your money. Find your direction.', 38, ph - 8);

    // Right — Mini N-arrow logo
    const lx = 188, ly = ph - 16;
    const { iconBase64 } = getLogoImages();
    if (iconBase64) {
      doc.addImage(iconBase64, 'PNG', lx, ly, 7, 7);
    } else {
      drawNordenLogo(doc, lx, ly, 7);
    }

    // Pagination
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text(`Halaman ${i} dari ${total}`, 195, ph - 8, { align: 'right' });
  }
}

// ─── Main Generator ───

export function generateMonthlyReportPdf(data: MonthlyReportData): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  drawHeader(doc, data);
  drawHeroSummaryCard(doc, data);

  drawSectionTitle(doc, 'Ringkasan Saldo', 92);
  drawBalanceSummary(doc, data, 99);

  drawSectionTitle(doc, 'Pengeluaran', 135);
  drawExpenseSection(doc, data, 142);

  drawSectionTitle(doc, 'Transaksi Terbaru', 186);
  drawRecentTransactions(doc, data, 193);

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 220;
  let nextY = finalY + 8;
  if (nextY + 35 > 297 - 26) {
    doc.addPage();
    nextY = 20;
  }
  drawSectionTitle(doc, 'Target & Kesehatan Finansial', nextY);
  drawGoalsAndHealth(doc, data, nextY + 7);
  
  nextY = nextY + 7 + 28 + 8;

  if (nextY + 24 > 297 - 26) {
    doc.addPage();
    nextY = 20;
  }
  drawAchievementsAndStreak(doc, data, nextY);
  
  nextY = nextY + 24 + 8;

  if (nextY + 18 > 297 - 26) {
    doc.addPage();
    nextY = 20;
  }
  drawMotivationBox(doc, nextY);

  drawFooter(doc, data);

  return doc.output('arraybuffer');
}
