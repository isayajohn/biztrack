import type { Request, Response } from "express";
import * as smsTemplateService from "../services/smsTemplate.service";
import type { SmsTemplateKey } from "../validators/smsTemplate.validators";

export async function listSmsTemplates(_req: Request, res: Response) {
  const templates = await smsTemplateService.listSmsTemplates();
  res.json({ success: true, data: templates });
}

export async function getSmsTemplate(req: Request, res: Response) {
  const template = await smsTemplateService.getSmsTemplate(req.params.key as SmsTemplateKey);
  res.json({ success: true, data: template });
}

export async function updateSmsTemplate(req: Request, res: Response) {
  const template = await smsTemplateService.updateSmsTemplate(
    req.user!.id,
    req.params.key as SmsTemplateKey,
    req.body,
  );
  res.json({ success: true, data: template });
}

export async function previewSmsTemplate(req: Request, res: Response) {
  const preview = await smsTemplateService.previewSmsTemplate(
    req.params.key as SmsTemplateKey,
    req.body,
  );
  res.json({ success: true, data: preview });
}
