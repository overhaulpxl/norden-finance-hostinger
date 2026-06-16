ALTER TABLE "Transaction" ADD COLUMN "transferToWalletId" TEXT;

CREATE INDEX "Transaction_transferToWalletId_idx" ON "Transaction"("transferToWalletId");

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_transferToWalletId_fkey"
FOREIGN KEY ("transferToWalletId") REFERENCES "Balance"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
