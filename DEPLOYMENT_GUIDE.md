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
