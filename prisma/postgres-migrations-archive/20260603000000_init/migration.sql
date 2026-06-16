-- Baseline migration representing the schema before 20260603193000_add_transfer_destination.
-- Safe to run on empty shadow database and existing production database.

DO $$
BEGIN
    -- Check if the Profile table already exists in the current schema
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = current_schema() AND tablename = 'Profile') THEN

        -- Create Enums (check existence in current schema namespace first)
        IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'UserRole' AND n.nspname = current_schema()) THEN
            CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'PlanType' AND n.nspname = current_schema()) THEN
            CREATE TYPE "PlanType" AS ENUM ('trial', 'pro');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'TransactionType' AND n.nspname = current_schema()) THEN
            CREATE TYPE "TransactionType" AS ENUM ('masuk', 'keluar', 'transfer');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'PaymentStatus' AND n.nspname = current_schema()) THEN
            CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'approved', 'rejected');
        END IF;

        -- Create Table Profile
        CREATE TABLE "Profile" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "fullName" TEXT,
            "role" "UserRole" NOT NULL DEFAULT 'user',
            "plan" "PlanType" NOT NULL DEFAULT 'trial',
            "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
            "trialStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "trialEndsAt" TIMESTAMP(3) NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
        CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

        -- Create Table BillingSubscription
        CREATE TABLE "BillingSubscription" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "plan" "PlanType" NOT NULL,
            "status" TEXT NOT NULL,
            "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "expiredAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "BillingSubscription_userId_idx" ON "BillingSubscription"("userId");

        -- Create Table Plan
        CREATE TABLE "Plan" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "price" DOUBLE PRECISION NOT NULL,
            "billingType" TEXT NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
        );

        -- Create Table PaymentRequest
        CREATE TABLE "PaymentRequest" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "plan" "PlanType" NOT NULL DEFAULT 'pro',
            "billingType" TEXT NOT NULL,
            "amount" DOUBLE PRECISION NOT NULL,
            "paymentMethod" TEXT NOT NULL,
            "proofPath" TEXT NOT NULL,
            "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
            "adminNote" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "PaymentRequest_userId_idx" ON "PaymentRequest"("userId");
        CREATE INDEX "PaymentRequest_status_idx" ON "PaymentRequest"("status");

        -- Create Table Balance
        CREATE TABLE "Balance" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "type" TEXT NOT NULL DEFAULT 'bank',
            "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "Balance_userId_idx" ON "Balance"("userId");
        CREATE UNIQUE INDEX "Balance_userId_name_key" ON "Balance"("userId", "name");

        -- Create Table Category
        CREATE TABLE "Category" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "type" "TransactionType" NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "Category_userId_idx" ON "Category"("userId");
        CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");

        -- Create Table Transaction
        CREATE TABLE "Transaction" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "categoryId" TEXT,
            "walletId" TEXT,
            "type" "TransactionType" NOT NULL,
            "amount" DOUBLE PRECISION NOT NULL,
            "note" TEXT,
            "rawInput" TEXT,
            "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "deletedAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
        CREATE INDEX "Transaction_userId_deletedAt_idx" ON "Transaction"("userId", "deletedAt");
        CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");
        CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");

        -- Create Table Budget
        CREATE TABLE "Budget" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "categoryId" TEXT NOT NULL,
            "monthlyLimit" DOUBLE PRECISION NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");
        CREATE UNIQUE INDEX "Budget_userId_categoryId_key" ON "Budget"("userId", "categoryId");

        -- Create Table SavingGoal
        CREATE TABLE "SavingGoal" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "targetAmount" DOUBLE PRECISION NOT NULL,
            "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "deadline" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "SavingGoal_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "SavingGoal_userId_idx" ON "SavingGoal"("userId");

        -- Create Table WishlistItem
        CREATE TABLE "WishlistItem" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "amount" DOUBLE PRECISION NOT NULL,
            "url" TEXT,
            "status" TEXT NOT NULL DEFAULT 'locked',
            "unlockDate" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");

        -- Create Table Debt
        CREATE TABLE "Debt" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "type" TEXT NOT NULL DEFAULT 'hutang',
            "person" TEXT NOT NULL,
            "amount" DOUBLE PRECISION NOT NULL,
            "isSettled" BOOLEAN NOT NULL DEFAULT false,
            "tenorMonths" INTEGER,
            "monthsPaid" INTEGER NOT NULL DEFAULT 0,
            "interestRate" DOUBLE PRECISION,
            "note" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "Debt_userId_idx" ON "Debt"("userId");

        -- Create Table Paylater
        CREATE TABLE "Paylater" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "itemName" TEXT NOT NULL,
            "platform" TEXT NOT NULL,
            "totalAmount" DOUBLE PRECISION NOT NULL,
            "installmentAmount" DOUBLE PRECISION NOT NULL,
            "tenorMonths" INTEGER NOT NULL,
            "monthsPaid" INTEGER NOT NULL DEFAULT 0,
            "isSettled" BOOLEAN NOT NULL DEFAULT false,
            "dueDate" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Paylater_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "Paylater_userId_idx" ON "Paylater"("userId");

        -- Create Table AppSubscription
        CREATE TABLE "AppSubscription" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "amount" DOUBLE PRECISION NOT NULL,
            "billingDay" INTEGER NOT NULL,
            "method" TEXT NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "AppSubscription_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "AppSubscription_userId_idx" ON "AppSubscription"("userId");

        -- Create Table AuditLog
        CREATE TABLE "AuditLog" (
            "id" TEXT NOT NULL,
            "userId" TEXT,
            "action" TEXT NOT NULL,
            "entity" TEXT NOT NULL,
            "entityId" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

        -- Create Table Setting
        CREATE TABLE "Setting" (
            "id" TEXT NOT NULL,
            "key" TEXT NOT NULL,
            "value" TEXT NOT NULL,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

        -- Create Table Feedback
        CREATE TABLE "Feedback" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "rating" INTEGER NOT NULL,
            "message" TEXT NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'open',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

        -- Create Table Streak
        CREATE TABLE "Streak" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "currentStreak" INTEGER NOT NULL DEFAULT 0,
            "longestStreak" INTEGER NOT NULL DEFAULT 0,
            "lastInputDate" TIMESTAMP(3),
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX "Streak_userId_key" ON "Streak"("userId");
        CREATE INDEX "Streak_userId_idx" ON "Streak"("userId");

        -- Create Table Achievement
        CREATE TABLE "Achievement" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");
        CREATE UNIQUE INDEX "Achievement_userId_title_key" ON "Achievement"("userId", "title");

        -- Create Table Notification
        CREATE TABLE "Notification" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "body" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "isRead" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
        CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

        -- Foreign Keys
        ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Balance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    END IF;
END $$;
