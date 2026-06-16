# Hostinger Managed Node.js Deployment

This repository is the Hostinger deploy build for Norden Finance.

- Repository: `overhaulpxl/norden-finance-hostinger`
- Domain: `https://nordenfinance.site`
- Hosting: Hostinger Managed Node.js
- Runtime: Node.js 22
- Framework: Next.js 15
- Database: Hostinger MySQL/MariaDB
- Storage: Hostinger local uploads
- Auth: Firebase Auth
- Session verification: Firebase Admin

This is not a VPS deployment. Do not use Nginx, PM2, `sudo`, `systemctl`, local PostgreSQL installation, or manual server setup.

## Safety Rules

- Keep the old `overhaulpxl/norden-finance` repository untouched until Hostinger is verified.
- Keep the old PostgreSQL database untouched.
- Keep old Firebase Storage files untouched.
- Do not run `prisma migrate reset` or `prisma db push --force-reset`.
- Do not commit `.env` files, database dumps, SQL backups, uploaded files, or secrets.
- Keep Vercel production available until Hostinger passes smoke tests.

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

## Environment Variables

```env
DATABASE_URL=mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/DB_NAME
NEXT_PUBLIC_APP_URL=https://nordenfinance.site
EMAIL_VERIFICATION_PROVIDER=firebase

STORAGE_PROVIDER=local
UPLOAD_DIR=/absolute/path/to/persistent/uploads
UPLOAD_PUBLIC_BASE_URL=https://nordenfinance.site/api/files
MAX_UPLOAD_SIZE_MB=5

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

GEMINI_API_KEY=
RESEND_API_KEY=
EMAIL_FROM=
CRON_SECRET=
SHORTCUT_TOKEN_SECRET=
```

Migration-only envs:

```env
POSTGRES_DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
MYSQL_DATABASE_URL=mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/DB_NAME
```

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

After backup and review, execute:

```bash
npm run migrate:postgres-to-mysql -- --execute
```

Verify counts:

```bash
npm run check:data-counts
```

## Upload Storage Migration

Firebase Storage is retained only as an old-file source and rollback option. New uploads use Hostinger local storage when:

```env
STORAGE_PROVIDER=local
```

Run the local upload persistence test before treating local storage as production-safe:

1. Upload a QRIS image and payment proof.
2. Confirm both open through `/api/files/...`.
3. Restart the Hostinger app.
4. Re-check both files.
5. Rebuild/redeploy from GitHub.
6. Re-check both files again.

Dry-run Firebase Storage URL migration:

```bash
npm run migrate:firebase-storage-to-local -- --dry-run
```

After review, execute:

```bash
npm run migrate:firebase-storage-to-local -- --execute
```

The script writes an ignored report under `migration-reports/`. It never deletes Firebase Storage files.

## Firebase Configuration

Firebase remains for Auth and Admin verification only. In Firebase Console, add:

```text
nordenfinance.site
```

Keep this domain until migration is verified:

```text
nordenfinance.vercel.app
```

## Smoke Tests

1. `https://nordenfinance.site` loads.
2. Login/register/verification still use Firebase Auth.
3. Existing user can log in.
4. Existing profile maps to the same Firebase UID.
5. Existing wallets, balances, and transactions appear.
6. Smart Input creates transactions.
7. Transfer updates both wallets.
8. Admin QRIS upload saves locally and displays.
9. Payment proof upload saves locally and admin can view it.
10. Old Firebase file URLs still open until file migration is verified.
11. Data counts match the pre-migration PostgreSQL record.
12. No uploads are saved inside `.next`, `src`, or `public`.

## Rollback

If Hostinger MySQL or local uploads fail:

1. Keep DNS on the last working production host or revert to Vercel.
2. Keep the old repo, PostgreSQL database, and Firebase Storage files untouched.
3. Do not run destructive database commands.
4. Use the old Vercel/PostgreSQL deployment while fixing this deploy repo.
5. If only local uploads fail, temporarily set `STORAGE_PROVIDER=firebase` while persistence is investigated.
