import { prisma } from "../config/prisma";
import { getOrCreateDefaultFreePackage } from "./packageLimit.service";

type BusinessInput = {
  name: string;
  ownerName: string;
  email: string;
  phone?: string;
  country: string;
  currency: string;
};

export async function getBusinessProfile(userId: string) {
  return prisma.business.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
}

export async function upsertBusinessProfile(userId: string, input: BusinessInput) {
  const existing = await getBusinessProfile(userId);
  return prisma.$transaction(async (tx) => {
    const business = existing
      ? await tx.business.update({
          where: { id: existing.id },
          data: {
            name: input.name,
            country: input.country,
            currency: input.currency,
          },
        })
      : await tx.business.create({
          data: {
            userId,
            name: input.name,
            country: input.country,
            currency: input.currency,
          },
        });

    if (!existing) {
      const selectedPackage = await getOrCreateDefaultFreePackage(tx);
      await tx.businessSubscription.create({
        data: {
          businessId: business.id,
          packageId: selectedPackage.id,
          status: "ACTIVE",
          billingCycle: "MANUAL",
          startsAt: new Date(),
          notes: "Assigned after Google onboarding.",
        },
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        name: input.ownerName,
        email: input.email,
        phone: input.phone ?? null,
      },
    });

    return business;
  });
}
