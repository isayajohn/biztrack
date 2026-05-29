import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export async function getDefaultBusinessId(userId: string): Promise<string> {
  const business = await prisma.business.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!business) throw new AppError("Business profile not found.", 404);
  return business.id;
}
