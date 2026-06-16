-- AlterTable
ALTER TABLE "Reminder"
ADD COLUMN "emailSentAt" TIMESTAMP(3),
ADD COLUMN "emailLastError" TEXT,
ADD COLUMN "emailAttemptCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Reminder_channel_dueAt_emailSentAt_idx" ON "Reminder"("channel", "dueAt", "emailSentAt");
