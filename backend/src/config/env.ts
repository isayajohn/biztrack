import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function numberEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: numberEnv("PORT", 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  appEncryptionKey: process.env.APP_ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  appUrl: process.env.APP_URL,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  azamPay: {
    enabled: (process.env.AZAMPAY_ENABLED ?? "true").toLowerCase() !== "false",
    appName: process.env.AZAMPAY_APP_NAME,
    clientId: process.env.AZAMPAY_CLIENT_ID,
    clientSecret: process.env.AZAMPAY_CLIENT_SECRET,
    token: process.env.AZAMPAY_TOKEN,
    vendorId: process.env.AZAMPAY_VENDOR_ID ?? process.env.AZAMPAY_TOKEN,
    vendorName: process.env.AZAMPAY_VENDOR_NAME ?? process.env.AZAMPAY_APP_NAME ?? "BizTrack",
    authUrl: process.env.AZAMPAY_AUTH_URL ?? "https://authenticator-sandbox.azampay.co.tz/AppRegistration/GenerateToken",
    checkoutUrl: process.env.AZAMPAY_CHECKOUT_URL ?? "https://sandbox.azampay.co.tz/api/v1/Partner/PostCheckout",
    callbackUrl: process.env.AZAMPAY_CALLBACK_URL,
    returnUrl: process.env.AZAMPAY_RETURN_URL,
  },
  email: {
    provider: process.env.EMAIL_PROVIDER ?? "SMTP",
    host: process.env.EMAIL_HOST,
    port: numberEnv("EMAIL_PORT", 587),
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
    fromName: process.env.EMAIL_FROM_NAME ?? "BizTrack",
    fromEmail: process.env.EMAIL_FROM_EMAIL,
    replyToEmail: process.env.EMAIL_REPLY_TO,
    logoPath: process.env.EMAIL_LOGO_PATH,
  },
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  rateLimitWindowMs: numberEnv("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  rateLimitMax: numberEnv("RATE_LIMIT_MAX", 100),
  authRateLimitWindowMs: numberEnv("AUTH_RATE_LIMIT_WINDOW_MS", 60 * 1000),
  authRateLimitMax: numberEnv("AUTH_RATE_LIMIT_MAX", 20),
  authEmailRateLimitWindowMs: numberEnv("AUTH_EMAIL_RATE_LIMIT_WINDOW_MS", 60 * 1000),
  authEmailRateLimitMax: numberEnv("AUTH_EMAIL_RATE_LIMIT_MAX", 5),
};
