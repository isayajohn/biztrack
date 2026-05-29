import type { Request, Response } from "express";
import * as adminSubscriptionService from "../services/adminSubscription.service";
import type { AdminSubscriptionsQuery } from "../validators/adminSubscription.validators";

export async function listSubscriptions(req: Request, res: Response) {
  const subscriptions = await adminSubscriptionService.listSubscriptions(
    req.query as unknown as AdminSubscriptionsQuery,
  );
  res.json({ success: true, data: subscriptions });
}

export async function assignSubscription(req: Request, res: Response) {
  const subscription = await adminSubscriptionService.assignSubscription(req.user!.id, req.body);
  res.status(201).json({ success: true, data: subscription });
}

export async function getSubscriptionById(req: Request, res: Response) {
  const subscription = await adminSubscriptionService.getSubscriptionById(String(req.params.id));
  res.json({ success: true, data: subscription });
}

export async function updateSubscriptionStatus(req: Request, res: Response) {
  const subscription = await adminSubscriptionService.updateSubscriptionStatus(
    req.user!.id,
    String(req.params.id),
    req.body.status,
    req.body.allowInactivePackage,
  );
  res.json({ success: true, data: subscription });
}

export async function extendSubscription(req: Request, res: Response) {
  const subscription = await adminSubscriptionService.extendSubscription(
    req.user!.id,
    String(req.params.id),
    req.body,
  );
  res.json({ success: true, data: subscription });
}

export async function changeBusinessPackage(req: Request, res: Response) {
  const subscription = await adminSubscriptionService.changeBusinessPackage(
    req.user!.id,
    String(req.params.businessId),
    req.body,
  );
  res.json({ success: true, data: subscription });
}
