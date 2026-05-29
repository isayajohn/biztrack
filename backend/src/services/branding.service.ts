import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { createAuditLog } from "./audit.service";

type BrandingInput = {
  logoDataUrl: string;
  logoFileName?: string | null;
  logoMimeType?: string | null;
};

const LOGO_DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i;
const MAX_LOGO_DATA_URL_LENGTH = 4_000_000;

function serializeBranding(branding: {
  id: string;
  logoDataUrl: string | null;
  logoFileName: string | null;
  logoMimeType: string | null;
  updatedAt: Date;
} | null) {
  const version = branding?.updatedAt ? branding.updatedAt.getTime() : null;

  return {
    logoUrl: branding?.logoDataUrl ? `/api/public/landing-page/branding/logo?v=${version}` : null,
    logoFileName: branding?.logoFileName ?? null,
    logoMimeType: branding?.logoMimeType ?? null,
    updatedAt: branding?.updatedAt ?? null,
  };
}

async function getBrandingRow() {
  return prisma.appBranding.findFirst({ orderBy: { updatedAt: "desc" } });
}

export async function getPublicBranding() {
  return serializeBranding(await getBrandingRow());
}

export async function getBrandingLogo() {
  const branding = await getBrandingRow();
  if (!branding?.logoDataUrl) return null;

  const match = branding.logoDataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/i);
  if (!match) return null;

  return {
    contentType: branding.logoMimeType ?? match[1],
    content: Buffer.from(match[2], "base64"),
    updatedAt: branding.updatedAt,
  };
}

export async function updateBranding(actorId: string, input: BrandingInput) {
  const logoDataUrl = input.logoDataUrl.trim();

  if (!LOGO_DATA_URL_RE.test(logoDataUrl)) {
    throw new AppError("Logo must be a valid image file.", 400);
  }

  if (logoDataUrl.length > MAX_LOGO_DATA_URL_LENGTH) {
    throw new AppError("Logo file is too large. Use an image under 3 MB.", 400);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.appBranding.findFirst({ orderBy: { updatedAt: "desc" } });
    const data = {
      logoDataUrl,
      logoFileName: input.logoFileName?.trim() || null,
      logoMimeType: input.logoMimeType?.trim() || null,
    };

    const branding = existing
      ? await tx.appBranding.update({ where: { id: existing.id }, data })
      : await tx.appBranding.create({ data });

    await createAuditLog(
      {
        actorId,
        action: "BRANDING_LOGO_UPDATED",
        targetType: "AppBranding",
        targetId: branding.id,
        metadata: {
          logoFileName: branding.logoFileName,
          logoMimeType: branding.logoMimeType,
          hadPreviousLogo: Boolean(existing?.logoDataUrl),
        },
      },
      tx,
    );

    return serializeBranding(branding);
  });
}

export async function removeBrandingLogo(actorId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.appBranding.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!existing) return serializeBranding(null);

    const branding = await tx.appBranding.update({
      where: { id: existing.id },
      data: {
        logoDataUrl: null,
        logoFileName: null,
        logoMimeType: null,
      },
    });

    await createAuditLog(
      {
        actorId,
        action: "BRANDING_LOGO_REMOVED",
        targetType: "AppBranding",
        targetId: branding.id,
        metadata: {
          removedLogoFileName: existing.logoFileName,
          removedLogoMimeType: existing.logoMimeType,
        },
      },
      tx,
    );

    return serializeBranding(branding);
  });
}
