# Deployment Guide

The current production deployment for Norden Finance is Hostinger Managed Node.js.

Use [DEPLOY_HOSTINGER.md](./DEPLOY_HOSTINGER.md) as the source of truth for:

- Hostinger app, MySQL/MariaDB, and local upload configuration.
- Firebase Auth/Admin configuration.
- Hostinger SMTP-only verification email.
- PostgreSQL-to-MySQL migration dry-run and execute workflow.
- Firebase Storage-to-local file migration dry-run and execute workflow.
- Upload persistence, email deliverability, smoke tests, and rollback.

Do not use Resend, Firebase default verification email sending, old PostgreSQL runtime variables, legacy production-host assumptions, or Firebase Storage as the new upload provider for this deploy repo.

Hostinger Build Command should stay `npm run build`. The build script already runs production env checks, `prisma generate`, safe/idempotent `prisma migrate deploy`, and `next build`, so do not configure `npm run db:migrate && npm run build` in the Hostinger UI. Use `npm run build:next` for a local Next-only build, or `SKIP_DB_MIGRATE=1 npm run build` when runtime env is configured and you want to test the Hostinger wrapper without applying migrations.

Never use `prisma migrate reset` or `prisma db push --force-reset` against production.
