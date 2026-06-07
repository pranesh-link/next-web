-- CreateTable
CREATE TABLE "app_errors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "platform" TEXT,
    "app_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_errors_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "app_errors_user_id_created_at_idx" ON "app_errors"("user_id", "created_at");
CREATE INDEX "app_errors_route_created_at_idx" ON "app_errors"("route", "created_at");
CREATE INDEX "app_errors_status_code_created_at_idx" ON "app_errors"("status_code", "created_at");
