import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const required = [
  'DATABASE_URL',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'GEMINI_API_KEY',
  'CRON_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
];

const missing = required.filter((key) => !process.env[key]?.trim());
const weak: string[] = [];

const cronSecret = process.env.CRON_SECRET || '';
if (cronSecret && cronSecret.length < 32) {
  weak.push('CRON_SECRET must be at least 32 characters.');
}

const shortcutSecret = process.env.SHORTCUT_TOKEN_SECRET || process.env.CRON_SECRET || '';
if (shortcutSecret && shortcutSecret.length < 32) {
  weak.push('SHORTCUT_TOKEN_SECRET or CRON_SECRET must be at least 32 characters for shortcut tokens.');
}

const emailFrom = process.env.EMAIL_FROM || '';
if (emailFrom && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFrom)) {
  weak.push('EMAIL_FROM must be a valid email address.');
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
