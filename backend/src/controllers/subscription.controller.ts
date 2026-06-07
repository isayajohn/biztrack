import type { Request, Response } from "express";
import * as subscriptionService from "../services/subscription.service";

export async function current(req: Request, res: Response) {
  const result = await subscriptionService.getBusinessSubscription(req.user!.id);
  res.json({ success: true, data: result });
}

export async function checkout(req: Request, res: Response) {
  const result = await subscriptionService.createSubscriptionCheckout(req.user!.id, req.body);
  res.status(201).json({ success: true, data: result });
}

export async function azamPayCallback(req: Request, res: Response) {
  const result = await subscriptionService.handleAzamPayCallback(req.body);
  res.json({ success: true, data: result });
}
