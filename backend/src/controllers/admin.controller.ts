import type { Request, Response } from "express";
import * as adminService from "../services/admin.service";
import * as adminModulesService from "../services/adminModules.service";
import * as brandingService from "../services/branding.service";
import type { AdminAuditLogsQuery, AdminBusinessesQuery, AdminUsersQuery } from "../types/admin";

export async function listUsers(req: Request, res: Response) {
  const users = await adminService.listUsers(req.query as unknown as AdminUsersQuery);
  res.json({ success: true, data: users });
}

export async function getUserDetails(req: Request, res: Response) {
  const user = await adminService.getUserDetails(req.user!.id, String(req.params.id));
  res.json({ success: true, data: user });
}

export async function updateUserStatus(req: Request, res: Response) {
  const user = await adminService.updateUserStatus(req.user!.id, String(req.params.id), req.body.status);
  res.json({ success: true, data: user });
}

export async function updateUserRole(req: Request, res: Response) {
  const user = await adminService.updateUserRole(req.user!.id, String(req.params.id), req.body.role);
  res.json({ success: true, data: user });
}

export async function deleteUser(req: Request, res: Response) {
  const user = await adminService.deleteUser(req.user!.id, String(req.params.id));
  res.json({ success: true, data: user });
}

export async function listBusinesses(req: Request, res: Response) {
  const businesses = await adminService.listBusinesses(req.query as unknown as AdminBusinessesQuery);
  res.json({ success: true, data: businesses });
}

export async function getBusinessDetails(req: Request, res: Response) {
  const business = await adminService.getBusinessDetails(String(req.params.id));
  res.json({ success: true, data: business });
}

export async function getAdminStats(_req: Request, res: Response) {
  const stats = await adminService.getAdminStats();
  res.json({ success: true, data: stats });
}

export async function getSystemSummary(_req: Request, res: Response) {
  const summary = await adminService.getSystemSummary();
  res.json({ success: true, data: summary });
}

export async function getBranding(_req: Request, res: Response) {
  const branding = await brandingService.getPublicBranding();
  res.json({ success: true, data: branding });
}

export async function updateBranding(req: Request, res: Response) {
  const branding = await brandingService.updateBranding(req.user!.id, req.body);
  res.json({ success: true, data: branding });
}

export async function removeBrandingLogo(req: Request, res: Response) {
  const branding = await brandingService.removeBrandingLogo(req.user!.id);
  res.json({ success: true, data: branding });
}

export async function listAuditLogs(req: Request, res: Response) {
  const logs = await adminService.listAuditLogs(req.query as unknown as AdminAuditLogsQuery);
  res.json({ success: true, data: logs });
}

export async function listPackages(_req: Request, res: Response) {
  const packages = await adminModulesService.listPackages();
  res.json({ success: true, data: packages });
}

export async function createPackage(req: Request, res: Response) {
  const plan = await adminModulesService.createPackage(req.user!.id, req.body);
  res.status(201).json({ success: true, data: plan });
}

export async function updatePackage(req: Request, res: Response) {
  const plan = await adminModulesService.updatePackage(req.user!.id, String(req.params.id), req.body);
  res.json({ success: true, data: plan });
}

export async function listSubscriptions(req: Request, res: Response) {
  const subscriptions = await adminModulesService.listSubscriptions(req.query as never);
  res.json({ success: true, data: subscriptions });
}

export async function assignSubscription(req: Request, res: Response) {
  const subscription = await adminModulesService.assignSubscription(req.user!.id, req.body);
  res.status(201).json({ success: true, data: subscription });
}

export async function updateSubscriptionStatus(req: Request, res: Response) {
  const subscription = await adminModulesService.updateSubscriptionStatus(
    req.user!.id,
    String(req.params.id),
    req.body.status,
  );
  res.json({ success: true, data: subscription });
}

export async function extendSubscription(req: Request, res: Response) {
  const subscription = await adminModulesService.extendSubscription(
    req.user!.id,
    String(req.params.id),
    req.body,
  );
  res.json({ success: true, data: subscription });
}

export async function getLandingPageContent(_req: Request, res: Response) {
  const content = await adminModulesService.getLandingPageContent();
  res.json({ success: true, data: content });
}

export async function updateLandingPageContent(req: Request, res: Response) {
  const content = await adminModulesService.updateLandingPageContent(req.user!.id, req.body);
  res.json({ success: true, data: content });
}

export async function publishLandingPageContent(req: Request, res: Response) {
  const content = await adminModulesService.publishLandingPageContent(req.user!.id);
  res.json({ success: true, data: content });
}

export async function getEmailSettings(_req: Request, res: Response) {
  const settings = await adminModulesService.getEmailSettings();
  res.json({ success: true, data: settings });
}

export async function updateEmailConfig(req: Request, res: Response) {
  const config = await adminModulesService.updateEmailConfig(req.user!.id, req.body);
  res.json({ success: true, data: config });
}

export async function updateEmailTemplate(req: Request, res: Response) {
  const template = await adminModulesService.updateTemplate(
    req.user!.id,
    "EMAIL",
    req.params.key as never,
    req.body,
  );
  res.json({ success: true, data: template });
}

export async function getSmsSettings(_req: Request, res: Response) {
  const settings = await adminModulesService.getSmsSettings();
  res.json({ success: true, data: settings });
}

export async function updateSmsConfig(req: Request, res: Response) {
  const config = await adminModulesService.updateSmsConfig(req.user!.id, req.body);
  res.json({ success: true, data: config });
}

export async function updateSmsTemplate(req: Request, res: Response) {
  const template = await adminModulesService.updateTemplate(
    req.user!.id,
    "SMS",
    req.params.key as never,
    req.body,
  );
  res.json({ success: true, data: template });
}

export async function testSms(req: Request, res: Response) {
  const result = await adminModulesService.testSms(req.user!.id, req.body);
  res.json({ success: true, data: result });
}

export async function getSecurityConfig(_req: Request, res: Response) {
  const config = await adminModulesService.getSecurityConfig();
  res.json({ success: true, data: config });
}

export async function updateSecurityConfig(req: Request, res: Response) {
  const config = await adminModulesService.updateSecurityConfig(req.user!.id, req.body);
  res.json({ success: true, data: config });
}
