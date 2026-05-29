-- Rename the role enum to the requested domain name while preserving existing values.
ALTER TYPE "UserRole" RENAME TO "SystemRole";

-- Track user login activity. Existing rows remain NULL until the next login.
ALTER TABLE "User"
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- Make audit actions generic strings instead of a fixed enum.
ALTER TABLE "AuditLog"
ALTER COLUMN "action" TYPE TEXT USING "action"::TEXT;

DROP TYPE "AuditAction";

-- Move AuditLog to the requested generic target/metadata shape while preserving
-- the older targetUserId/details fields for compatibility.
ALTER TABLE "AuditLog"
ADD COLUMN "targetType" TEXT NOT NULL DEFAULT 'User',
ADD COLUMN "targetId" TEXT,
ADD COLUMN "metadata" JSONB;

UPDATE "AuditLog"
SET
  "targetId" = COALESCE("targetId", "targetUserId"),
  "metadata" = COALESCE("metadata", "details");

ALTER TABLE "AuditLog"
ALTER COLUMN "targetType" DROP DEFAULT;

ALTER TABLE "AuditLog"
DROP CONSTRAINT "AuditLog_actorId_fkey";

ALTER TABLE "AuditLog"
ALTER COLUMN "actorId" DROP NOT NULL;

ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AuditLog_targetType_idx" ON "AuditLog"("targetType");
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
