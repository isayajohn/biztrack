ALTER TABLE "User"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "emailVerificationTokenHash" TEXT,
  ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3),
  ADD COLUMN "passwordResetTokenHash" TEXT,
  ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3),
  ADD COLUMN "otpCodeHash" TEXT,
  ADD COLUMN "otpLoginTokenHash" TEXT,
  ADD COLUMN "otpExpiresAt" TIMESTAMP(3),
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3);

UPDATE "User"
SET "emailVerifiedAt" = CURRENT_TIMESTAMP
WHERE "emailVerifiedAt" IS NULL;

CREATE INDEX "User_emailVerifiedAt_idx" ON "User"("emailVerifiedAt");
CREATE INDEX "User_phone_idx" ON "User"("phone");
CREATE INDEX "User_lockedUntil_idx" ON "User"("lockedUntil");
CREATE INDEX "User_emailVerificationTokenHash_idx" ON "User"("emailVerificationTokenHash");
CREATE INDEX "User_passwordResetTokenHash_idx" ON "User"("passwordResetTokenHash");
CREATE INDEX "User_otpLoginTokenHash_idx" ON "User"("otpLoginTokenHash");
