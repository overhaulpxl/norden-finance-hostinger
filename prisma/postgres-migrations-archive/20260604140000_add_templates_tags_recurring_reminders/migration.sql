ALTER TABLE "Balance"
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Balance_userId_archivedAt_idx" ON "Balance"("userId", "archivedAt");

ALTER TABLE "Transaction"
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "receiptMerchant" TEXT,
  ADD COLUMN IF NOT EXISTS "receiptItems" JSONB,
  ADD COLUMN IF NOT EXISTS "receiptDate" TIMESTAMP(3);

UPDATE "Transaction" SET "tags" = ARRAY[]::TEXT[] WHERE "tags" IS NULL;

CREATE INDEX IF NOT EXISTS "Transaction_userId_transactionDate_idx" ON "Transaction"("userId", "transactionDate");

CREATE TABLE IF NOT EXISTS "TransactionTemplate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "TransactionType" NOT NULL DEFAULT 'keluar',
  "amount" INTEGER NOT NULL,
  "categoryName" TEXT NOT NULL,
  "walletName" TEXT NOT NULL,
  "note" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isFavorite" BOOLEAN NOT NULL DEFAULT false,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransactionTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TransactionTemplate_userId_name_key" ON "TransactionTemplate"("userId", "name");
CREATE INDEX IF NOT EXISTS "TransactionTemplate_userId_idx" ON "TransactionTemplate"("userId");
CREATE INDEX IF NOT EXISTS "TransactionTemplate_userId_isFavorite_idx" ON "TransactionTemplate"("userId", "isFavorite");
CREATE INDEX IF NOT EXISTS "TransactionTemplate_userId_lastUsedAt_idx" ON "TransactionTemplate"("userId", "lastUsedAt");

CREATE TABLE IF NOT EXISTS "RecurringTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "TransactionType" NOT NULL DEFAULT 'keluar',
  "amount" INTEGER NOT NULL,
  "categoryName" TEXT NOT NULL,
  "walletName" TEXT NOT NULL,
  "note" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "interval" TEXT NOT NULL DEFAULT 'monthly',
  "dayOfMonth" INTEGER NOT NULL,
  "nextRunAt" TIMESTAMP(3) NOT NULL,
  "lastRunAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecurringTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RecurringTransaction_userId_idx" ON "RecurringTransaction"("userId");
CREATE INDEX IF NOT EXISTS "RecurringTransaction_userId_isActive_idx" ON "RecurringTransaction"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "RecurringTransaction_nextRunAt_isActive_idx" ON "RecurringTransaction"("nextRunAt", "isActive");

CREATE TABLE IF NOT EXISTS "Reminder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'manual',
  "channel" TEXT NOT NULL DEFAULT 'in_app',
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Reminder_userId_idx" ON "Reminder"("userId");
CREATE INDEX IF NOT EXISTS "Reminder_userId_completedAt_idx" ON "Reminder"("userId", "completedAt");
CREATE INDEX IF NOT EXISTS "Reminder_dueAt_idx" ON "Reminder"("dueAt");
