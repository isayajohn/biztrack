import type { ConfigProvider, TemplateKey } from "@prisma/client";
import fs from "fs";
import path from "path";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { decryptValue } from "../utils/encryption.util";
import { decryptSecret } from "../utils/secretCrypto";
import { sendEmail } from "./emailProvider.service";
import { ensureDefaultEmailTemplates } from "./emailTemplate.service";
import { getBrandingLogo } from "./branding.service";

type TemplateVariables = Record<string, string | number | boolean | Date | null | undefined>;

type SendTemplateEmailInput = {
  to: string;
  key: TemplateKey;
  variables: TemplateVariables;
};

const APP_NAME = "BizTrack";
const LOGO_CID = "biztrack-logo";

function variableValue(value: TemplateVariables[string]) {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return "";
  return String(value);
}

function renderTemplatePart(part: string | null, variables: TemplateVariables) {
  if (!part) return "";
  return part.replace(/{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g, (_match, variable: string) => {
    return variableValue(variables[variable]);
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTextWithLinks(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => {
      const html = escapeHtml(paragraph.trim()).replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" style="color:#159447;font-weight:700;text-decoration:none;">$1</a>',
      );
      return html ? `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.65;">${html}</p>` : "";
    })
    .join("");
}

function primaryLinkForTemplate(key: TemplateKey, variables: TemplateVariables) {
  if (key === "EMAIL_VERIFICATION") return variableValue(variables.verificationLink);
  if (key === "PASSWORD_RESET") return variableValue(variables.resetLink);
  return "";
}

function primaryLabelForTemplate(key: TemplateKey) {
  if (key === "EMAIL_VERIFICATION") return "Verify account";
  if (key === "PASSWORD_RESET") return "Reset password";
  return "";
}

function renderEmailHtml(key: TemplateKey, subject: string, body: string, variables: TemplateVariables) {
  const primaryLink = primaryLinkForTemplate(key, variables);
  const primaryLabel = primaryLabelForTemplate(key);
  const safeSubject = escapeHtml(subject);
  const contentHtml = renderTextWithLinks(body);
  const buttonHtml = primaryLink && primaryLabel
    ? `<div style="margin:28px 0 24px;"><a href="${escapeHtml(primaryLink)}" style="display:inline-block;border-radius:12px;background:#159447;color:#ffffff;font-size:15px;font-weight:800;line-height:1;padding:15px 22px;text-decoration:none;">${primaryLabel}</a></div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f7faf7;padding:0;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7faf7;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;overflow:hidden;border-radius:18px;background:#ffffff;border:1px solid #dce8dc;box-shadow:0 16px 40px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:#101827;padding:24px 28px 18px;text-align:center;">
                <img src="cid:${LOGO_CID}" width="260" alt="BizTrack" style="display:block;margin:0 auto;max-width:260px;width:76%;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 12px;">
                <h1 style="margin:0 0 16px;color:#10221a;font-size:24px;line-height:1.25;font-weight:800;">${safeSubject}</h1>
                ${contentHtml}
                ${buttonHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <div style="border-top:1px solid #e5eee7;padding-top:18px;color:#64748b;font-size:12px;line-height:1.6;">
                  This message was sent by BizTrack. If you did not request this, you can ignore this email.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function readLogoAttachment() {
  const brandingLogo = await getBrandingLogo();
  if (brandingLogo) {
    return [{
      cid: LOGO_CID,
      filename: "biztrack-logo",
      contentType: brandingLogo.contentType,
      content: brandingLogo.content,
    }];
  }

  if (!env.email.logoPath) return [];
  const logoPath = path.resolve(process.cwd(), env.email.logoPath);
  if (!fs.existsSync(logoPath)) return [];

  return [{
    cid: LOGO_CID,
    filename: "biztrack-logo.png",
    contentType: "image/png",
    content: fs.readFileSync(logoPath),
  }];
}

function decryptConfiguredSecret(value?: string | null) {
  if (!value) return null;

  const appSecret = decryptSecret(value);
  if (appSecret) return appSecret;

  try {
    const configSecret = decryptValue(value);
    if (configSecret) return configSecret;
  } catch {
    // The app has used two secret helpers over time. Try both, then fail cleanly.
  }

  throw new AppError("Saved email credentials could not be read. Re-save the email configuration.", 500);
}

async function getActiveEmailConfig() {
  if (env.email.host && env.email.fromEmail) {
    const provider = env.email.provider as ConfigProvider;

    return {
      provider,
      host: env.email.host,
      port: env.email.port,
      username: env.email.username ?? env.email.fromEmail,
      password: env.email.password,
      apiKey: null,
      fromName: env.email.fromName,
      fromEmail: env.email.fromEmail,
      replyToEmail: env.email.replyToEmail,
    };
  }

  const config = await prisma.emailConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!config) {
    throw new AppError("Configure an active email provider before sending auth emails.", 400);
  }

  return {
    ...config,
    password: decryptConfiguredSecret(config.passwordEncrypted),
    apiKey: decryptConfiguredSecret(config.apiKeyEncrypted),
  };
}

export async function renderActiveEmailTemplate(key: TemplateKey, variables: TemplateVariables) {
  await ensureDefaultEmailTemplates();

  const template = await prisma.messageTemplate.findFirst({
    where: {
      type: "EMAIL",
      key,
      isActive: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!template) {
    throw new AppError("Required email template is missing or inactive.", 400, { key });
  }

  const mergedVariables = {
    appName: APP_NAME,
    ...variables,
  };

  return {
    subject: renderTemplatePart(template.subject, mergedVariables) || APP_NAME,
    body: renderTemplatePart(template.body, mergedVariables),
    variables: mergedVariables,
  };
}

export async function sendTemplateEmail(input: SendTemplateEmailInput) {
  const [config, rendered, inlineImages] = await Promise.all([
    getActiveEmailConfig(),
    renderActiveEmailTemplate(input.key, input.variables),
    readLogoAttachment(),
  ]);

  await sendEmail({
    provider: config.provider,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    apiKey: config.apiKey,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    replyToEmail: config.replyToEmail,
    to: input.to,
    subject: rendered.subject,
    body: rendered.body,
    htmlBody: renderEmailHtml(input.key, rendered.subject, rendered.body, rendered.variables),
    inlineImages,
  });
}
