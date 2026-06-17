# Hostinger Managed Node.js Deployment

This repository is the Hostinger deploy build for Norden Finance.

- Repository: `overhaulpxl/norden-finance-hostinger`
- Branch: `main`
- Domain: `https://nordenfinance.site`
- Hosting: Hostinger Managed Node.js
- Runtime: Node.js 22
- Framework: Next.js 15

This is not a VPS deployment. Do not use Nginx, PM2, `sudo`, `systemctl`, local PostgreSQL installation, or manual server setup.

## Final Service Map

- Hostinger: Next.js app, MySQL/MariaDB, local uploads, SMTP mailbox.
- Firebase: Auth and Firebase Admin verification-link generation.
- Email verification: Hostinger SMTP only.
- Gemini: AI parsing and receipt scanning.
- Old PostgreSQL: one-time migration source only.
- Old Firebase Storage: old-file migration source and rollback source only.
- Resend: not used.

Firebase default verification email sending is not used. The app registers users with Firebase Auth, generates verification links with Firebase Admin, and sends the branded verification email through Hostinger SMTP.

## Safety Rules

- Keep the old PostgreSQL database untouched until migration is verified.
- Keep old Firebase Storage files untouched.
- Do not run `prisma migrate reset` or `prisma db push --force-reset`.
- Do not commit `.env` files, database dumps, SQL backups, uploaded files, or secrets.
- Do not run migration scripts with `--execute` until backups are complete and dry-run output has been reviewed.
- Never delete Firebase Storage files automatically during local file migration.

## Hostinger Import Settings

| Setting | Value |
|---|---|
| Repository | `overhaulpxl/norden-finance-hostinger` |
| Branch | `main` |
| Framework | `Next.js` |
| Root Directory | `/` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Start Command | `npm run start` |
| Node Version | `22` |

## Production Runtime Environment

Set these in Hostinger Managed Node.js:

```env
NEXT_PUBLIC_APP_URL=https://nordenfinance.site
DATABASE_URL=mysql://u945428838_nordenfinance:PASSWORD@localhost:3306/u945428838_nordenfinance

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=norden-finance.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=norden-finance
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=norden-finance.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=750168227408
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

FIREBASE_PROJECT_ID=norden-finance
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@nordenfinance.site
SMTP_PASS=
EMAIL_FROM="Norden Finance <no-reply@nordenfinance.site>"

STORAGE_PROVIDER=local
UPLOAD_DIR=/home/u945428838/domains/nordenfinance.site/uploads
UPLOAD_PUBLIC_BASE_URL=https://nordenfinance.site/api/files
MAX_UPLOAD_SIZE_MB=5

GEMINI_API_KEY=
CRON_SECRET=
SHORTCUT_TOKEN_SECRET=
ADMIN_EMAIL=admin@nordenfinance.site
SUPPORT_EMAIL=support@nordenfinance.site
```

Production runtime does not need `EMAIL_VERIFICATION_PROVIDER`, `RESEND_API_KEY`, `POSTGRES_DATABASE_URL`, `MYSQL_DATABASE_URL`, or duplicate `FIREBASE_ADMIN_*` variables.

## Migration Environment

Migration-only variables belong in `.env.migration`, based on `.env.migration.example`. They are not normal Hostinger runtime variables.

```env
POSTGRES_DATABASE_URL=postgresql://OLD_POSTGRES_URL
MYSQL_DATABASE_URL=mysql://u945428838_nordenfinance:PASSWORD@localhost:3306/u945428838_nordenfinance
```

Firebase Storage to local migration also needs the Firebase Admin and upload variables shown in `.env.migration.example`.

## Database Migration

Create backups before any migration execute step. Do not commit backup files.

```bash
pg_dump --format=custom --no-owner --no-acl "$POSTGRES_DATABASE_URL" > norden_postgres_backup_YYYYMMDD.dump
pg_dump --no-owner --no-acl "$POSTGRES_DATABASE_URL" > norden_postgres_backup_YYYYMMDD.sql
```

Apply the MySQL schema to the empty Hostinger database:

```bash
npm run db:migrate
```

Run a read-only dry-run first:

```bash
npm run migrate:postgres-to-mysql -- --dry-run
```

Execute only after backup and review:

```bash
npm run migrate:postgres-to-mysql -- --execute
```

Verify counts:

```bash
npm run check:data-counts
```

## File Migration

Firebase Storage is retained only as an old-file source and rollback option. New uploads use Hostinger local storage:

```env
STORAGE_PROVIDER=local
```

Dry-run Firebase Storage URL migration:

```bash
npm run migrate:firebase-storage-to-local -- --dry-run
```

Execute only after review:

```bash
npm run migrate:firebase-storage-to-local -- --execute
```

The script writes an ignored report under `migration-reports/`. It never deletes Firebase Storage files.

## Upload Persistence Test

1. Upload a QRIS image or payment proof.
2. Confirm the file opens through `/api/files/...`.
3. Restart the Hostinger app.
4. Verify the file still opens.
5. Redeploy from GitHub.
6. Verify the file still opens again.

No uploads should be saved inside `.next`, `src`, or `public`.

## Email Deliverability Checklist

1. Create the `no-reply@nordenfinance.site` mailbox in Hostinger.
2. Set the SMTP environment variables.
3. Use the mailbox password for `SMTP_PASS`; it is not the database password.
4. Enable SPF for the domain.
5. Enable DKIM for the domain.
6. Add a DMARC record.
7. Test verification delivery to Gmail, Outlook, and Yahoo.
8. Keep subjects and body copy direct; avoid spammy wording.

## Loading Behavior

- The app boot loader waits for critical brand assets, fonts, and auth readiness on auth/protected routes.
- Dashboard rendering remains tied to real server-side dashboard data from `getDashboardData()`.
- Skeletons are used for route chunks and dashboard widgets while those chunks load.
- Loading must not be purely decorative and must not add artificial delay.

## Firebase Configuration

Firebase remains for Auth and Admin verification-link generation. In Firebase Console, add:

```text
nordenfinance.site
```

Keep `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` while Firebase client config and old-file migration support need it.

## Smoke Tests

1. `https://nordenfinance.site` loads.
2. Register with email/password and receive Hostinger SMTP verification email.
3. Verification link lands on `/auth/verified`.
4. Existing user can log in.
5. Existing profile maps to the same Firebase UID.
6. Existing wallets, balances, and transactions appear.
7. Smart Input creates transactions.
8. Transfer updates both wallets.
9. Admin QRIS upload saves locally and displays.
10. Payment proof upload saves locally and admin can view it.
11. Old Firebase file URLs remain available until file migration is verified.
12. Data counts match the pre-migration PostgreSQL record.

## Rollback

If Hostinger MySQL or local uploads fail:

1. Keep DNS on the last working production host while investigating.
2. Keep the old repository, PostgreSQL database, and Firebase Storage files untouched.
3. Do not run destructive database commands.
4. If only local uploads fail, temporarily set `STORAGE_PROVIDER=firebase` while persistence is investigated.
