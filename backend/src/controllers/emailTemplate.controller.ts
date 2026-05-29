import type { Request, Response } from "express";
import * as emailTemplateService from "../services/emailTemplate.service";
import type { EmailTemplateKey } from "../validators/emailTemplate.validators";

export async function listEmailTemplates(_req: Request, res: Response) {
  const templates = await emailTemplateService.listEmailTemplates();
  res.json({ success: true, data: templates });
}

export async function getEmailTemplate(req: Request, res: Response) {
  const template = await emailTemplateService.getEmailTemplate(req.params.key as EmailTemplateKey);
  res.json({ success: true, data: template });
}

export async function updateEmailTemplate(req: Request, res: Response) {
  const template = await emailTemplateService.updateEmailTemplate(
    req.user!.id,
    req.params.key as EmailTemplateKey,
    req.body,
  );
  res.json({ success: true, data: template });
}

export async function previewEmailTemplate(req: Request, res: Response) {
  const preview = await emailTemplateService.previewEmailTemplate(
    req.params.key as EmailTemplateKey,
    req.body,
  );
  res.json({ success: true, data: preview });
}
