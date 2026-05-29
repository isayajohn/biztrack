-- Super admin package, subscription, content, messaging, and security modules.

CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');

CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME', 'MANUAL');

CREATE TYPE "ConfigProvider" AS ENUM ('SMTP', 'API', 'CUSTOM');

CREATE TYPE "TemplateType" AS ENUM ('EMAIL', 'SMS');

CREATE TYPE "TemplateKey" AS ENUM (
  'EMAIL_VERIFICATION',
  'PASSWORD_RESET',
  'LOGIN_ALERT',
  'OTP_CODE',
  'ACCOUNT_SUSPENDED',
  'SUBSCRIPTION_ACTIVATED',
  'SUBSCRIPTION_EXPIRED'
);

CREATE TABLE "Package" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "priceMonthly" DECIMAL(12,2) NOT NULL,
  "priceYearly" DECIMAL(12,2),
  "currency" TEXT NOT NULL,
  "maxBusinesses" INTEGER NOT NULL,
  "maxUsers" INTEGER NOT NULL,
  "maxProducts" INTEGER NOT NULL,
  "maxSalesPerMonth" INTEGER NOT NULL,
  "maxExpensesPerMonth" INTEGER NOT NULL,
  "allowReports" BOOLEAN NOT NULL,
  "allowPdfExport" BOOLEAN NOT NULL,
  "allowCsvExport" BOOLEAN NOT NULL,
  "allowInventoryAlerts" BOOLEAN NOT NULL,
  "allowAiInsights" BOOLEAN NOT NULL,
  "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessSubscription" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "trialEndsAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BusinessSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LandingPageContent" (
  "id" TEXT NOT NULL,
  "heroTitle" TEXT NOT NULL,
  "heroSubtitle" TEXT NOT NULL,
  "primaryButtonText" TEXT NOT NULL,
  "primaryButtonUrl" TEXT NOT NULL,
  "secondaryButtonText" TEXT NOT NULL,
  "secondaryButtonUrl" TEXT NOT NULL,
  "features" JSONB NOT NULL,
  "pricing" JSONB NOT NULL,
  "faqs" JSONB NOT NULL,
  "testimonials" JSONB,
  "footerLinks" JSONB,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LandingPageContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailConfig" (
  "id" TEXT NOT NULL,
  "provider" "ConfigProvider" NOT NULL,
  "host" TEXT,
  "port" INTEGER,
  "username" TEXT,
  "passwordEncrypted" TEXT,
  "apiKeyEncrypted" TEXT,
  "fromName" TEXT NOT NULL,
  "fromEmail" TEXT NOT NULL,
  "replyToEmail" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmsConfig" (
  "id" TEXT NOT NULL,
  "provider" "ConfigProvider" NOT NULL,
  "baseUrl" TEXT,
  "apiKeyEncrypted" TEXT,
  "apiSecretEncrypted" TEXT,
  "senderId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SmsConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SecurityConfig" (
  "id" TEXT NOT NULL,
  "requireEmailVerification" BOOLEAN NOT NULL DEFAULT true,
  "enablePasswordReset" BOOLEAN NOT NULL DEFAULT true,
  "enableOtpLogin" BOOLEAN NOT NULL DEFAULT false,
  "enableSmsOtp" BOOLEAN NOT NULL DEFAULT false,
  "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
  "passwordRequireNumber" BOOLEAN NOT NULL DEFAULT true,
  "passwordRequireSpecialChar" BOOLEAN NOT NULL DEFAULT false,
  "otpExpiryMinutes" INTEGER NOT NULL DEFAULT 10,
  "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
  "lockoutMinutes" INTEGER NOT NULL DEFAULT 15,
  "sessionExpiryMinutes" INTEGER NOT NULL DEFAULT 1440,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SecurityConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageTemplate" (
  "id" TEXT NOT NULL,
  "type" "TemplateType" NOT NULL,
  "key" "TemplateKey" NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Package_slug_key" ON "Package"("slug");
CREATE INDEX "Package_status_idx" ON "Package"("status");
CREATE INDEX "BusinessSubscription_businessId_idx" ON "BusinessSubscription"("businessId");
CREATE INDEX "BusinessSubscription_packageId_idx" ON "BusinessSubscription"("packageId");
CREATE INDEX "BusinessSubscription_status_idx" ON "BusinessSubscription"("status");
CREATE INDEX "MessageTemplate_key_idx" ON "MessageTemplate"("key");

ALTER TABLE "BusinessSubscription"
ADD CONSTRAINT "BusinessSubscription_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessSubscription"
ADD CONSTRAINT "BusinessSubscription_packageId_fkey"
FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
