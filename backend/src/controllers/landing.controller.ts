import type { Request, Response } from "express";
import { getLandingPageContent } from "../services/adminModules.service";
import * as brandingService from "../services/branding.service";

export async function getPublicLandingPage(_req: Request, res: Response) {
  const content = await getLandingPageContent({ publishedOnly: true });
  res.json({ success: true, data: content });
}

export async function getBranding(_req: Request, res: Response) {
  const branding = await brandingService.getPublicBranding();
  res.json({ success: true, data: branding });
}

export async function getBrandingLogo(_req: Request, res: Response) {
  const logo = await brandingService.getBrandingLogo();
  if (!logo) {
    res.status(404).json({ success: false, message: "Logo not found." });
    return;
  }

  res.setHeader("Content-Type", logo.contentType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(logo.content);
}
