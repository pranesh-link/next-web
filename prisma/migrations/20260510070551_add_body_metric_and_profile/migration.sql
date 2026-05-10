-- DropIndex
DROP INDEX "budget_plans_userId_month_and_year_mode_key";

-- CreateTable
CREATE TABLE "body_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "couple_id" TEXT,
    "measured_on" DATE NOT NULL,
    "weight_in_kg" DECIMAL(5,2) NOT NULL,
    "height_in_cm" DECIMAL(5,2) NOT NULL,
    "bmi" DECIMAL(4,2) NOT NULL,
    "bmi_category" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "couple_id" TEXT,
    "default_height_in_cm" DECIMAL(5,2),
    "target_weight_in_kg" DECIMAL(5,2),
    "birth_date" DATE,
    "sex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "body_metrics_couple_id_measured_on_idx" ON "body_metrics"("couple_id", "measured_on");

-- CreateIndex
CREATE INDEX "body_metrics_subject_id_measured_on_idx" ON "body_metrics"("subject_id", "measured_on");

-- CreateIndex
CREATE UNIQUE INDEX "body_metrics_subject_id_measured_on_key" ON "body_metrics"("subject_id", "measured_on");

-- CreateIndex
CREATE UNIQUE INDEX "body_profiles_userId_key" ON "body_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "body_profiles_subject_id_key" ON "body_profiles"("subject_id");

-- CreateIndex
CREATE INDEX "body_profiles_couple_id_idx" ON "body_profiles"("couple_id");

-- AddForeignKey
ALTER TABLE "body_metrics" ADD CONSTRAINT "body_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_metrics" ADD CONSTRAINT "body_metrics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_profiles" ADD CONSTRAINT "body_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_profiles" ADD CONSTRAINT "body_profiles_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
