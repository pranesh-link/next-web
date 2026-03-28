-- CreateTable
CREATE TABLE "budget_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month_and_year" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'monthly',
    "income" DOUBLE PRECISION NOT NULL,
    "lineItems" JSONB NOT NULL,
    "coupleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budget_plans_userId_idx" ON "budget_plans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_plans_userId_month_and_year_mode_key" ON "budget_plans"("userId", "month_and_year", "mode");

-- AddForeignKey
ALTER TABLE "budget_plans" ADD CONSTRAINT "budget_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
