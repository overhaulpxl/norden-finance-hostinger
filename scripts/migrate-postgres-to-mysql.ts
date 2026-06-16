import { config } from 'dotenv';
import pg from 'pg';
import mysql, { type RowDataPacket } from 'mysql2/promise';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

const { Pool } = pg;

const args = new Set(process.argv.slice(2));
const execute = args.has('--execute');
const dryRun = !execute;

const TABLES = [
  'Plan',
  'Setting',
  'Profile',
  'BillingSubscription',
  'Balance',
  'Category',
  'Transaction',
  'TransactionTemplate',
  'RecurringTransaction',
  'Budget',
  'SavingGoal',
  'WishlistItem',
  'Debt',
  'Paylater',
  'AppSubscription',
  'EmergencyFundPlan',
  'Reminder',
  'PaymentRequest',
  'AuditLog',
  'Feedback',
  'Streak',
  'Achievement',
  'RateLimitBucket',
  'Notification',
] as const;

const JSON_FIELDS: Record<string, string[]> = {
  Transaction: ['tags', 'receiptItems'],
  TransactionTemplate: ['tags'],
  RecurringTransaction: ['tags'],
};

type Row = Record<string, unknown>;
type ExecuteValues = Parameters<mysql.Connection['execute']>[1];

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    if (dryRun) {
      console.log(`DEFERRED — ${name} is not configured in this environment.`);
      process.exit(0);
    }
    throw new Error(`${name} is required for --execute`);
  }
  return value;
}

function normalizeJsonValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
}

function normalizeRow(table: string, row: Row) {
  const output: Row = { ...row };
  for (const field of JSON_FIELDS[table] || []) {
    output[field] = normalizeJsonValue(output[field] ?? (field === 'tags' ? [] : null));
  }
  return output;
}

function mysqlInsertSql(table: string, row: Row) {
  const columns = Object.keys(row);
  const columnList = columns.map((column) => `\`${column}\``).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const updates = columns
    .filter((column) => column !== 'id' && column !== 'key')
    .map((column) => `\`${column}\` = VALUES(\`${column}\`)`)
    .join(', ');
  return `INSERT INTO \`${table}\` (${columnList}) VALUES (${placeholders})${updates ? ` ON DUPLICATE KEY UPDATE ${updates}` : ''}`;
}

async function main() {
  const postgresUrl = requireEnv('POSTGRES_DATABASE_URL');
  const mysqlUrl = process.env.MYSQL_DATABASE_URL?.trim();
  if (execute && !mysqlUrl) {
    throw new Error('MYSQL_DATABASE_URL is required for --execute');
  }

  const source = new Pool({ connectionString: postgresUrl });
  const target = execute ? await mysql.createConnection(mysqlUrl!) : null;

  const report: Record<string, { source: number; inserted: number; target?: number; failed: Array<{ id?: unknown; error: string }> }> = {};

  try {
    for (const table of TABLES) {
      const { rows } = await source.query(`SELECT * FROM "${table}"`);
      report[table] = { source: rows.length, inserted: 0, failed: [] };

      if (dryRun) continue;

      for (const sourceRow of rows as Row[]) {
        const row = normalizeRow(table, sourceRow);
        const sql = mysqlInsertSql(table, row);
        try {
          await target!.execute(sql, Object.values(row) as ExecuteValues);
          report[table].inserted += 1;
        } catch (error: unknown) {
          report[table].failed.push({
            id: row.id ?? row.key,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const [targetRows] = await target!.query<Array<RowDataPacket & { count: number }>>(`SELECT COUNT(*) AS count FROM \`${table}\``);
      report[table].target = Number(targetRows[0]?.count || 0);
    }

    console.log(JSON.stringify({
      mode: dryRun ? 'dry-run' : 'execute',
      checkedAt: new Date().toISOString(),
      report,
    }, null, 2));

    if (Object.values(report).some((entry) => entry.failed.length > 0)) {
      process.exitCode = 1;
    }
  } finally {
    await source.end();
    await target?.end();
  }
}

main().catch((error) => {
  console.error('PostgreSQL to MySQL migration failed:', error);
  process.exitCode = 1;
});
