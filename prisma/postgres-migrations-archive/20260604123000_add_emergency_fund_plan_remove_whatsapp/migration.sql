-- Add persisted emergency fund planning and remove the out-of-scope WhatsApp connection table.
CREATE TABLE IF NOT EXISTS "EmergencyFundPlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "monthlyExpense" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmergencyFundPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmergencyFundPlan_userId_key" ON "EmergencyFundPlan"("userId");
CREATE INDEX IF NOT EXISTS "EmergencyFundPlan_userId_idx" ON "EmergencyFundPlan"("userId");

DROP TABLE IF EXISTS "WhatsAppConnection";
