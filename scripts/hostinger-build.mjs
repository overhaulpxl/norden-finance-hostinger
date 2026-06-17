import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

const REQUIRED_ENV = [
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
  'STORAGE_PROVIDER',
  'UPLOAD_DIR',
  'UPLOAD_PUBLIC_BASE_URL',
  'MAX_UPLOAD_SIZE_MB',
  'GEMINI_API_KEY',
  'CRON_SECRET',
  'SHORTCUT_TOKEN_SECRET',
  'ADMIN_EMAIL',
  'SUPPORT_EMAIL',
];

const skipDbMigrate = process.env.SKIP_DB_MIGRATE === '1';

function fail(message) {
  console.error(`\nHostinger build failed: ${message}`);
  process.exit(1);
}

function validateRuntimeEnv() {
  console.log('==> Checking Hostinger production runtime environment');

  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    fail(`Missing required env vars: ${missing.join(', ')}`);
  }

  if (!process.env.DATABASE_URL?.trim().startsWith('mysql://')) {
    fail('DATABASE_URL must start with mysql:// for Hostinger production.');
  }
}

function runStep(label, args) {
  console.log(`\n==> ${label}`);
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npx';
  const commandArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', ['npx', ...args].join(' ')]
    : args;

  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  if (result.error) {
    fail(`${label} could not start: ${result.error.message}`);
  }

  if (result.signal) {
    fail(`${label} was terminated by signal ${result.signal}.`);
  }

  if (result.status !== 0) {
    fail(`${label} exited with code ${result.status}.`);
  }
}

validateRuntimeEnv();
runStep('Generating Prisma Client', ['prisma', 'generate']);

if (skipDbMigrate) {
  console.log('\n==> Skipping Prisma migrate deploy because SKIP_DB_MIGRATE=1');
} else {
  runStep('Applying safe Prisma production migrations', ['prisma', 'migrate', 'deploy']);
}

runStep('Building Next.js app', ['next', 'build']);
