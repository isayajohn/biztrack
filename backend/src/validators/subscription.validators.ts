import { z } from "zod";

export const subscriptionCheckoutSchema = z.object({
  packageId: z.string().uuid(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional().default("MONTHLY"),
  customerPhone: z.string().trim().max(40).optional(),
});

export type SubscriptionCheckoutInput = z.infer<typeof subscriptionCheckoutSchema>;
