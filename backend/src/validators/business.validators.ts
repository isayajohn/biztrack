import { z } from "zod";

export const businessProfileSchema = z.object({
  name: z.string().trim().min(2).max(160),
  ownerName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).toLowerCase(),
  phone: z.string().trim().min(3).max(40).optional(),
  country: z.string().trim().min(2).max(100),
  currency: z.string().trim().min(3).max(3).toUpperCase(),
});
