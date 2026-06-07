-- Add deviceInfo aggregated string to device_tokens
ALTER TABLE "device_tokens" ADD COLUMN "device_info" TEXT;

-- Add deviceInfo aggregated string to sessions (web)
ALTER TABLE "sessions" ADD COLUMN "device_info" TEXT;

-- Add lastDeviceInfo and lastSeenAt to users
ALTER TABLE "users" ADD COLUMN "last_device_info" TEXT;
ALTER TABLE "users" ADD COLUMN "last_seen_at" TIMESTAMP(3);
