CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'AZAMPAY',
  "externalId" TEXT NOT NULL,
  "providerReference" TEXT,
  "checkoutUrl" TEXT,
  "rawRequest" JSONB,
  "rawResponse" JSONB,
  "paidAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentTransaction_externalId_key" ON "PaymentTransaction"("externalId");
CREATE INDEX "PaymentTransaction_businessId_idx" ON "PaymentTransaction"("businessId");
CREATE INDEX "PaymentTransaction_packageId_idx" ON "PaymentTransaction"("packageId");
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");
CREATE INDEX "PaymentTransaction_providerReference_idx" ON "PaymentTransaction"("providerReference");
CREATE INDEX "PaymentTransaction_createdAt_idx" ON "PaymentTransaction"("createdAt");

ALTER TABLE "PaymentTransaction"
ADD CONSTRAINT "PaymentTransaction_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentTransaction"
ADD CONSTRAINT "PaymentTransaction_packageId_fkey"
FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
