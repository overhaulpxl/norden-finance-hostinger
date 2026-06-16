import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { getSignedUrl, uploadFile } from '../lib/storage';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

const args = new Set(process.argv.slice(2));
const execute = args.has('--execute');
const dryRun = !execute;

const prisma = new PrismaClient();
const mapping = new Map<string, string>();

function defer(message: string) {
  if (dryRun) {
    console.log(`DEFERRED — ${message}`);
    process.exit(0);
  }
  throw new Error(message);
}

function assertEnv() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl?.startsWith('mysql://')) {
    defer('DATABASE_URL must point to the target MySQL database.');
  }
  if (!process.env.UPLOAD_DIR?.trim()) {
    defer('UPLOAD_DIR is not configured.');
  }
  if (!process.env.UPLOAD_PUBLIC_BASE_URL?.trim()) {
    defer('UPLOAD_PUBLIC_BASE_URL is not configured.');
  }
}

function isFirebaseUrl(value: string) {
  return /^https:\/\/(?:firebasestorage\.googleapis\.com|storage\.googleapis\.com)\//.test(value);
}

function originalNameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const objectPath = decodeURIComponent(parsed.pathname.split('/o/')[1] || parsed.pathname);
    return path.basename(objectPath.split('?')[0]) || 'migrated-upload.jpg';
  } catch {
    return 'migrated-upload.jpg';
  }
}

async function migrateUrl(oldUrl: string, folderPath: string) {
  if (mapping.has(oldUrl)) return mapping.get(oldUrl)!;

  const response = await fetch(oldUrl);
  if (!response.ok) {
    throw new Error(`download failed with HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
  const buffer = Buffer.from(await response.arrayBuffer());
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  const storagePath = await uploadFile(folderPath, `${hash}_${originalNameFromUrl(oldUrl)}`, buffer, contentType);
  const newUrl = await getSignedUrl(storagePath);
  mapping.set(oldUrl, newUrl);
  return newUrl;
}

async function writeReport(report: unknown) {
  if (dryRun) return;
  const reportDir = path.resolve(process.cwd(), 'migration-reports');
  await mkdir(reportDir, { recursive: true });
  await writeFile(
    path.join(reportDir, `firebase-storage-to-local-${new Date().toISOString().replace(/[:.]/g, '-')}.json`),
    JSON.stringify(report, null, 2),
  );
}

async function main() {
  assertEnv();

  const paymentRequests = await prisma.paymentRequest.findMany({
    where: {
      proofPath: {
        startsWith: 'https://',
      },
    },
    select: { id: true, userId: true, proofPath: true },
  });
  const qrisSetting = await prisma.setting.findUnique({
    where: { key: 'qris_image' },
    select: { id: true, value: true },
  });

  const report = {
    mode: dryRun ? 'dry-run' : 'execute',
    checkedAt: new Date().toISOString(),
    paymentRequests: [] as Array<{ id: string; oldUrl: string; newUrl?: string; status: string; error?: string }>,
    qrisImage: null as null | { oldUrl: string; newUrl?: string; status: string; error?: string },
  };

  for (const request of paymentRequests) {
    if (!isFirebaseUrl(request.proofPath)) continue;
    if (dryRun) {
      report.paymentRequests.push({ id: request.id, oldUrl: request.proofPath, status: 'would-migrate' });
      continue;
    }
    try {
      const newUrl = await migrateUrl(request.proofPath, `payment-proofs/${request.userId}`);
      await prisma.paymentRequest.update({
        where: { id: request.id },
        data: { proofPath: newUrl },
      });
      report.paymentRequests.push({ id: request.id, oldUrl: request.proofPath, newUrl, status: 'migrated' });
    } catch (error: unknown) {
      report.paymentRequests.push({
        id: request.id,
        oldUrl: request.proofPath,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (qrisSetting?.value && isFirebaseUrl(qrisSetting.value)) {
    if (dryRun) {
      report.qrisImage = { oldUrl: qrisSetting.value, status: 'would-migrate' };
    } else {
      try {
        const newUrl = await migrateUrl(qrisSetting.value, 'qris');
        await prisma.setting.update({
          where: { key: 'qris_image' },
          data: { value: newUrl },
        });
        report.qrisImage = { oldUrl: qrisSetting.value, newUrl, status: 'migrated' };
      } catch (error: unknown) {
        report.qrisImage = {
          oldUrl: qrisSetting.value,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  await writeReport(report);
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error('Firebase Storage to local migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
