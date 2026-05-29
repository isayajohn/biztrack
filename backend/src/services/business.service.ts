import { prisma } from "../config/prisma";

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
  const [business] = await prisma.$transaction([
    existing
      ? prisma.business.update({
          where: { id: existing.id },
          data: {
            name: input.name,
            country: input.country,
            currency: input.currency,
          },
        })
      : prisma.business.create({
          data: {
            userId,
            name: input.name,
            country: input.country,
            currency: input.currency,
          },
        }),
    prisma.user.update({
      where: { id: userId },
      data: {
        name: input.ownerName,
        email: input.email,
        phone: input.phone ?? null,
      },
    }),
  ]);

  return business;
}
