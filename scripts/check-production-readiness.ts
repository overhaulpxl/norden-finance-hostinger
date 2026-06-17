import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const required = [
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

const missing = required.filter((key) => !process.env[key]?.trim());
const weak: string[] = [];

const databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl && !databaseUrl.startsWith('mysql://')) {
  weak.push('DATABASE_URL must be Hostinger MySQL/MariaDB and start with mysql://.');
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
if (appUrl && appUrl !== 'https://nordenfinance.site') {
  weak.push('NEXT_PUBLIC_APP_URL must be https://nordenfinance.site for Hostinger production.');
}

const cronSecret = process.env.CRON_SECRET || '';
if (cronSecret && cronSecret.length < 32) {
  weak.push('CRON_SECRET must be at least 32 characters.');
}

const shortcutSecret = process.env.SHORTCUT_TOKEN_SECRET || '';
if (shortcutSecret && shortcutSecret.length < 32) {
  weak.push('SHORTCUT_TOKEN_SECRET must be at least 32 characters.');
}

const emailFrom = process.env.EMAIL_FROM || '';
const emailAddress = emailFrom.match(/<([^>]+)>/)?.[1] || emailFrom;
if (emailFrom && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
  weak.push('EMAIL_FROM must include a valid email address.');
}

const smtpPort = process.env.SMTP_PORT || '';
if (smtpPort && !Number.isInteger(Number(smtpPort))) {
  weak.push('SMTP_PORT must be a number.');
}

const smtpSecure = (process.env.SMTP_SECURE || '').toLowerCase();
if (smtpSecure && !['true', 'false'].includes(smtpSecure)) {
  weak.push('SMTP_SECURE must be true or false.');
}

const storageProvider = (process.env.STORAGE_PROVIDER || '').trim().toLowerCase();
if (storageProvider && storageProvider !== 'local') {
  weak.push('STORAGE_PROVIDER must be local for Hostinger production.');
}

const maxUploadSize = process.env.MAX_UPLOAD_SIZE_MB || '';
if (maxUploadSize && (!Number.isFinite(Number(maxUploadSize)) || Number(maxUploadSize) <= 0)) {
  weak.push('MAX_UPLOAD_SIZE_MB must be a positive number.');
}

if (missing.length || weak.length) {
  console.error('Production readiness check failed.');
  if (missing.length) {
    console.error(`Missing env vars: ${missing.join(', ')}`);
  }
  for (const issue of weak) {
    console.error(issue);
  }
  process.exit(1);
}

console.log('Production readiness check passed.');
