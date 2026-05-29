import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultLandingContent = {
  heroTitle: "Know your sales, expenses, and profit every day.",
  heroSubtitle:
    "BizTrack gives small businesses a simple way to record money in, money out, stock changes, and profit without complicated accounting tools.",
  primaryButtonText: "Get Started Free",
  primaryButtonUrl: "/register",
  secondaryButtonText: "View Demo",
  secondaryButtonUrl: "/demo",
  features: [
    { title: "Track daily sales", text: "Record every sale in seconds and see what is moving today." },
    { title: "Control expenses", text: "Keep rent, stock, transport, and service costs in one simple list." },
    { title: "Know your stock", text: "Watch products and inventory before missed sales become a habit." },
    { title: "Read clear reports", text: "Understand profit, cash flow, and product performance without spreadsheets." },
  ],
  pricing: [
    { name: "Free", price: "0", description: "Start tracking one small business." },
    { name: "Pro", price: "19", description: "More records, reports, and inventory alerts." },
    { name: "Business", price: "49", description: "Expanded limits for growing teams." },
  ],
  faqs: [
    { question: "Can I use BizTrack on my phone?", answer: "Yes, the app is designed for daily mobile and desktop use." },
    { question: "Can I export my records?", answer: "Paid packages can enable export options from the admin plan setup." },
  ],
  testimonials: [],
  footerLinks: [],
  seoTitle: "BizTrack",
  seoDescription: "Sales, expenses, stock, and profit tracking for small businesses.",
  isPublished: true,
};

const defaultEmailTemplates = [
  {
    key: "EMAIL_VERIFICATION" as const,
    subject: "Verify your {{appName}} email",
    body: [
      "Hi {{userName}},",
      "",
      "Welcome to {{appName}}. Please verify your email using this link:",
      "{{verificationLink}}",
    ].join("\n"),
  },
  {
    key: "PASSWORD_RESET" as const,
    subject: "Reset your {{appName}} password",
    body: [
      "Hi {{userName}},",
      "",
      "Use this secure link to reset your {{appName}} password:",
      "{{resetLink}}",
    ].join("\n"),
  },
  {
    key: "LOGIN_ALERT" as const,
    subject: "New {{appName}} login",
    body: [
      "Hi {{userName}},",
      "",
      "We noticed a new login to your {{appName}} account. If this was not you, reset your password immediately.",
    ].join("\n"),
  },
  {
    key: "OTP_CODE" as const,
    subject: "Your {{appName}} login code",
    body: [
      "Hi {{userName}},",
      "",
      "Your {{appName}} login code is {{otpCode}}.",
      "It expires soon.",
    ].join("\n"),
  },
  {
    key: "ACCOUNT_SUSPENDED" as const,
    subject: "Your {{appName}} account is suspended",
    body: [
      "Hi {{userName}},",
      "",
      "Your {{appName}} account has been suspended. Contact support if you think this is a mistake.",
    ].join("\n"),
  },
  {
    key: "SUBSCRIPTION_ACTIVATED" as const,
    subject: "{{appName}} subscription activated",
    body: [
      "Hi {{userName}},",
      "",
      "{{businessName}} is now active on the {{packageName}} package in {{appName}}.",
    ].join("\n"),
  },
  {
    key: "SUBSCRIPTION_EXPIRED" as const,
    subject: "{{appName}} subscription expired",
    body: [
      "Hi {{userName}},",
      "",
      "The {{packageName}} subscription for {{businessName}} expired on {{subscriptionEndDate}}.",
      "Please renew the subscription to continue using {{appName}} without interruption.",
    ].join("\n"),
  },
];

const defaultSmsTemplates = [
  {
    key: "OTP_CODE" as const,
    body: "{{appName}} code: {{otpCode}}. Expires soon.",
  },
  {
    key: "ACCOUNT_SUSPENDED" as const,
    body: "Hi {{userName}}, your {{appName}} account is suspended. Contact support.",
  },
  {
    key: "SUBSCRIPTION_ACTIVATED" as const,
    body: "{{businessName}} is active on {{packageName}} in {{appName}}.",
  },
  {
    key: "SUBSCRIPTION_EXPIRED" as const,
    body: "{{businessName}} {{packageName}} subscription expired on {{subscriptionEndDate}}. Renew in {{appName}}.",
  },
];

const defaultSecurityConfig = {
  requireEmailVerification: true,
  enablePasswordReset: true,
  enableOtpLogin: false,
  enableSmsOtp: false,
  passwordMinLength: 8,
  passwordRequireNumber: true,
  passwordRequireSpecialChar: false,
  otpExpiryMinutes: 10,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
  sessionExpiryMinutes: 1440,
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function seedDefaultLandingPageContent() {
  const existing = await prisma.landingPageContent.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true, isPublished: true },
  });

  if (existing) {
    if (!existing.isPublished) {
      await prisma.landingPageContent.update({
        where: { id: existing.id },
        data: { isPublished: true },
      });
      console.log("Published existing landing page content.");
    } else {
      console.log("Landing page content already exists.");
    }
    return;
  }

  await prisma.landingPageContent.create({ data: defaultLandingContent });
  console.log("Created default published landing page content.");
}

async function seedDefaultEmailTemplates() {
  let createdCount = 0;

  for (const template of defaultEmailTemplates) {
    const existing = await prisma.messageTemplate.findFirst({
      where: { type: "EMAIL", key: template.key },
      select: { id: true },
    });

    if (existing) continue;

    await prisma.messageTemplate.create({
      data: {
        type: "EMAIL",
        key: template.key,
        subject: template.subject,
        body: template.body,
        isActive: true,
      },
    });
    createdCount += 1;
  }

  console.log(
    createdCount > 0
      ? `Created ${createdCount} default email templates.`
      : "Email templates already exist.",
  );
}

async function seedDefaultSmsTemplates() {
  let createdCount = 0;

  for (const template of defaultSmsTemplates) {
    const existing = await prisma.messageTemplate.findFirst({
      where: { type: "SMS", key: template.key },
      select: { id: true },
    });

    if (existing) continue;

    await prisma.messageTemplate.create({
      data: {
        type: "SMS",
        key: template.key,
        subject: null,
        body: template.body,
        isActive: true,
      },
    });
    createdCount += 1;
  }

  console.log(
    createdCount > 0
      ? `Created ${createdCount} default SMS templates.`
      : "SMS templates already exist.",
  );
}

async function seedDefaultSecurityConfig() {
  const existing = await prisma.securityConfig.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (existing) {
    console.log("Security config already exists.");
    return;
  }

  await prisma.securityConfig.create({ data: defaultSecurityConfig });
  console.log("Created default security config.");
}

async function main() {
  console.log("Starting BizTrack Prisma seed...");

  const name = getRequiredEnv("SUPER_ADMIN_NAME");
  const email = getRequiredEnv("SUPER_ADMIN_EMAIL").toLowerCase();
  const password = getRequiredEnv("SUPER_ADMIN_PASSWORD");

  console.log(`Preparing SUPER_ADMIN account for ${email}...`);

  const passwordHash = await bcrypt.hash(password, 12);
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });

    console.log(`Updated existing user ${email} to SUPER_ADMIN with ACTIVE status.`);
  } else {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });

    console.log(`Created new SUPER_ADMIN user ${email} with ACTIVE status.`);
  }

  await seedDefaultLandingPageContent();
  await seedDefaultEmailTemplates();
  await seedDefaultSmsTemplates();
  await seedDefaultSecurityConfig();
  console.log("BizTrack Prisma seed completed.");
}

main()
  .catch((error) => {
    console.error("BizTrack Prisma seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
