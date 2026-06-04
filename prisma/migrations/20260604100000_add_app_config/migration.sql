-- CreateTable
CREATE TABLE "app_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "minAppVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "enabledFeatures" TEXT[] DEFAULT ARRAY['finance', 'chat']::TEXT[],
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row so it exists immediately after migration.
INSERT INTO "app_config" ("id", "minAppVersion", "enabledFeatures", "maintenanceMode", "maintenanceMessage", "updatedAt")
VALUES ('singleton', '1.0.0', ARRAY['finance', 'chat']::TEXT[], false, '', NOW())
ON CONFLICT ("id") DO NOTHING;
