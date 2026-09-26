-- AlterTable
ALTER TABLE "RestaurantSettings" ADD COLUMN IF NOT EXISTS "pushRemindersEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "RestaurantSettings" ADD COLUMN IF NOT EXISTS "pushReminderSlots" TEXT[] DEFAULT ARRAY['11:30','17:30']::TEXT[];
ALTER TABLE "RestaurantSettings" ADD COLUMN IF NOT EXISTS "pushTimezone" TEXT NOT NULL DEFAULT 'Africa/Accra';

-- CreateTable
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE INDEX IF NOT EXISTS "PushSubscription_guestId_idx" ON "PushSubscription"("guestId");

CREATE TABLE IF NOT EXISTS "PushSendLog" (
    "id" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSendLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PushSendLog_slotKey_key" ON "PushSendLog"("slotKey");
