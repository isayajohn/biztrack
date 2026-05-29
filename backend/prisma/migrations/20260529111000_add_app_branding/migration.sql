CREATE TABLE "AppBranding" (
  "id" TEXT NOT NULL,
  "logoDataUrl" TEXT,
  "logoFileName" TEXT,
  "logoMimeType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AppBranding_pkey" PRIMARY KEY ("id")
);
