-- CreateTable
CREATE TABLE "EmailOtpChallenge" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "payloadJson" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailOtpChallenge_email_purpose_idx" ON "EmailOtpChallenge"("email", "purpose");
CREATE INDEX "EmailOtpChallenge_expiresAt_idx" ON "EmailOtpChallenge"("expiresAt");
