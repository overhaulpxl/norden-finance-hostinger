import { config } from 'dotenv';

config({ path: '.env.migration' });
config({ path: '.env.local' });
config({ path: '.env' });

const required = [
  'POSTGRES_DATABASE_URL',
  'MYSQL_DATABASE_URL',
  'DATABASE_URL',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'STORAGE_PROVIDER',
  'UPLOAD_DIR',
  'UPLOAD_PUBLIC_BASE_URL',
];

const missing = required.filter((key) => !process.env[key]?.trim());
const weak: string[] = [];

const postgresUrl = process.env.POSTGRES_DATABASE_URL || '';
if (postgresUrl && !postgresUrl.startsWith('postgresql://')) {
  weak.push('POSTGRES_DATABASE_URL must start with postgresql://.');
}

const mysqlUrl = process.env.MYSQL_DATABASE_URL || '';
if (mysqlUrl && !mysqlUrl.startsWith('mysql://')) {
  weak.push('MYSQL_DATABASE_URL must start with mysql://.');
}

const databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl && !databaseUrl.startsWith('mysql://')) {
  weak.push('DATABASE_URL must point to the target MySQL database.');
}

const storageProvider = (process.env.STORAGE_PROVIDER || '').trim().toLowerCase();
if (storageProvider && storageProvider !== 'local') {
  weak.push('STORAGE_PROVIDER must be local for Firebase Storage to local migration.');
}

if (missing.length || weak.length) {
  console.error('Migration readiness check failed.');
  if (missing.length) {
    console.error(`Missing env vars: ${missing.join(', ')}`);
  }
  for (const issue of weak) {
    console.error(issue);
  }
  process.exit(1);
}

console.log('Migration readiness check passed.');
