ALTER TABLE "Plan"
  ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'pro',
  ALTER COLUMN "billingType" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "durationDays" INTEGER;

CREATE INDEX IF NOT EXISTS "Plan_type_idx" ON "Plan"("type");
CREATE INDEX IF NOT EXISTS "Plan_billingType_idx" ON "Plan"("billingType");

