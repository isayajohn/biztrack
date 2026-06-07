import bcrypt from "bcrypt";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import type { AuthTokenType, Package as PrismaPackage, Prisma } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import {
  addMinutes,
  getActiveSecurityConfig,
  getSessionJwtExpiry,
  validatePasswordAgainstConfig,
} from "./securityConfig.service";
import { sendTemplateEmail } from "./emailDelivery.service";
import { sendOtpSms } from "./smsOtp.service";
import { getOrCreateDefaultFreePackage } from "./packageLimit.service";
import { AppError } from "../utils/AppError";
import { signToken } from "../utils/jwt";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  businessName: string;
  country: string;
  currency: string;
  packageId?: string;
};

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

type TokenClient = Prisma.TransactionClient | typeof prisma;

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  lockedUntil: true,
  lastLoginAt: true,
  businesses: true,
} as const;

type AuthUser = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;
type RegistrationPackage = Pick<
  PrismaPackage,
  "id" | "name" | "slug" | "priceMonthly" | "trialDays"
>;

const INITIAL_TRIAL_DAYS = 7;
const VERIFY_EMAIL_MESSAGE = "If the account needs verification, a verification email has been sent.";
const FORGOT_PASSWORD_MESSAGE = "If an account exists for that email, password reset instructions have been sent.";
const googleClient = new OAuth2Client(env.google.clientId);

function serializeAuthUser(user: AuthUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    requiresEmailVerification: !user.emailVerifiedAt && user.role !== "SUPER_ADMIN",
    lastLoginAt: user.lastLoginAt,
    business: user.businesses[0] ?? null,
    businesses: user.businesses,
  };
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashLoginOtp(otpToken: string, otpCode: string) {
  return hashToken(`${otpToken}:${otpCode}`);
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function devSecret<T extends Record<string, unknown>>(value: T) {
  return env.nodeEnv === "production" ? {} : value;
}

function publicAppUrl() {
  return (env.appUrl ?? env.corsOrigins[0] ?? "http://127.0.0.1:5173").replace(/\/+$/, "");
}

function verificationLink(token: string) {
  return `${publicAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

function resetPasswordLink(token: string) {
  return `${publicAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

async function buildAuthResponse(user: AuthUser) {
  const config = await getActiveSecurityConfig();
  return {
    token: signToken(
      { userId: user.id, role: user.role },
      getSessionJwtExpiry(config),
    ),
    user: serializeAuthUser(user),
  };
}

async function resolveRegistrationPackage(packageId?: string): Promise<RegistrationPackage> {
  if (packageId) {
    const plan = await prisma.package.findFirst({
      where: { id: packageId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        slug: true,
        priceMonthly: true,
        trialDays: true,
      },
    });

    if (!plan) throw new AppError("Selected package is not available.", 400);
    return plan;
  }

  return getOrCreateDefaultFreePackage(prisma);
}

async function markUnusedTokensUsed(
  client: TokenClient,
  userId: string,
  type: AuthTokenType,
  usedAt = new Date(),
) {
  await client.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt },
  });
}

async function createAuthToken(
  client: TokenClient,
  userId: string,
  type: AuthTokenType,
  tokenHash: string,
  expiresAt: Date,
) {
  const now = new Date();
  await markUnusedTokensUsed(client, userId, type, now);

  return client.authToken.create({
    data: {
      userId,
      type,
      tokenHash,
      expiresAt,
    },
  });
}

async function issueRawAuthToken(
  client: TokenClient,
  userId: string,
  type: AuthTokenType,
  expiresAt: Date,
) {
  const token = randomToken();
  await createAuthToken(client, userId, type, hashToken(token), expiresAt);
  return token;
}

async function recordInvalidLogin(user: { id: string; failedLoginAttempts: number; lockedUntil: Date | null }) {
  const config = await getActiveSecurityConfig();
  const now = new Date();
  const currentAttempts = user.lockedUntil && user.lockedUntil <= now ? 0 : user.failedLoginAttempts;
  const failedLoginAttempts = currentAttempts + 1;

  if (failedLoginAttempts >= config.maxLoginAttempts) {
    const lockedUntil = addMinutes(now, config.lockoutMinutes);
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts, lockedUntil },
    });
    throw new AppError("Too many failed login attempts. Try again later.", 403);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts, lockedUntil: null },
  });

  throw new AppError("Invalid email or password.", 401);
}

function assertAccountCanAuthenticate(user: {
  status: string;
  lockedUntil: Date | null;
  emailVerifiedAt: Date | null;
  role: string;
}) {
  if (user.status === "SUSPENDED") throw new AppError("Your account is suspended.", 403);

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError("Account is temporarily locked. Try again later.", 403);
  }
}

async function sendVerificationTokenEmail(
  user: Pick<AuthUser, "name" | "email">,
  token: string,
) {
  await sendTemplateEmail({
    to: user.email,
    key: "EMAIL_VERIFICATION",
    variables: {
      userName: user.name,
      verificationLink: verificationLink(token),
    },
  });
}

async function sendPasswordResetEmail(
  user: Pick<AuthUser, "name" | "email">,
  token: string,
) {
  await sendTemplateEmail({
    to: user.email,
    key: "PASSWORD_RESET",
    variables: {
      userName: user.name,
      resetLink: resetPasswordLink(token),
    },
  });
}

async function sendLoginOtpEmail(
  user: Pick<AuthUser, "name" | "email">,
  otpCode: string,
) {
  await sendTemplateEmail({
    to: user.email,
    key: "OTP_CODE",
    variables: {
      userName: user.name,
      otpCode,
    },
  });
}

function sendLoginAlertEmail(user: Pick<AuthUser, "name" | "email">, meta?: RequestMeta) {
  void sendTemplateEmail({
    to: user.email,
    key: "LOGIN_ALERT",
    variables: {
      userName: user.name,
      loginTime: new Date(),
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    },
  }).catch(() => undefined);
}

export async function register(input: RegisterInput) {
  const config = await getActiveSecurityConfig();
  validatePasswordAgainstConfig(input.password, config);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError("Email is already registered.", 409);

  const selectedPackage = await resolveRegistrationPackage(input.packageId);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const verificationToken = config.requireEmailVerification ? randomToken() : null;

  const user = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const trialEndsAt = addMinutes(now, INITIAL_TRIAL_DAYS * 24 * 60);
    const isFreePackage = Number(selectedPackage.priceMonthly.toString()) === 0;

    const createdUser = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        passwordHash,
        emailVerifiedAt: config.requireEmailVerification ? null : new Date(),
      },
      select: { id: true },
    });

    const createdBusiness = await tx.business.create({
      data: {
        userId: createdUser.id,
        name: input.businessName,
        country: input.country,
        currency: input.currency,
      },
      select: { id: true },
    });

    await tx.businessSubscription.create({
      data: {
        businessId: createdBusiness.id,
        packageId: selectedPackage.id,
        status: "TRIAL",
        billingCycle: isFreePackage ? "MANUAL" : "MONTHLY",
        startsAt: now,
        trialEndsAt,
        notes: `Initial ${INITIAL_TRIAL_DAYS}-day trial assigned during registration from ${selectedPackage.name} package.`,
      },
    });

    if (verificationToken) {
      await createAuthToken(
        tx,
        createdUser.id,
        "EMAIL_VERIFICATION",
        hashToken(verificationToken),
        addMinutes(new Date(), 24 * 60),
      );
    }

    const createdAuthUser = await tx.user.findUnique({
      where: { id: createdUser.id },
      select: authUserSelect,
    });

    if (!createdAuthUser) throw new AppError("Account could not be created.", 500);
    return createdAuthUser;
  });

  let verificationEmailSent = false;
  let verificationEmailError = false;

  if (verificationToken) {
    try {
      await sendVerificationTokenEmail(user, verificationToken);
      verificationEmailSent = true;
    } catch (error) {
      verificationEmailError = true;
      console.error("Registration verification email failed:", error);
    }
  }

  return {
    token: signToken(
      { userId: user.id, role: user.role },
      getSessionJwtExpiry(config),
    ),
    user: serializeAuthUser(user),
    requiresEmailVerification: config.requireEmailVerification,
    verificationEmailSent,
    verificationEmailError,
    ...devSecret(verificationToken ? { verificationToken } : {}),
  };
}

export async function login(email: string, password: string, meta?: RequestMeta) {
  const config = await getActiveSecurityConfig();

  if (config.enableOtpLogin) {
    return requestLoginOtp(email, password, meta);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      ...authUserSelect,
      passwordHash: true,
      failedLoginAttempts: true,
    },
  });

  if (!user) throw new AppError("Invalid email or password.", 401);
  assertAccountCanAuthenticate(user);

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    await recordInvalidLogin(user);
  }

  if (config.requireEmailVerification && !user.emailVerifiedAt && user.role !== "SUPER_ADMIN") {
    throw new AppError("Please verify your email before signing in.", 403);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      otpCodeHash: null,
      otpLoginTokenHash: null,
      otpExpiresAt: null,
      lastLoginAt: new Date(),
    },
    select: authUserSelect,
  });

  sendLoginAlertEmail(updatedUser, meta);
  return buildAuthResponse(updatedUser);
}

export async function googleAuth(credential: string, meta?: RequestMeta) {
  if (!env.google.clientId) {
    throw new AppError("Google sign-in is not configured.", 500);
  }

  const ticket = await googleClient
    .verifyIdToken({
      idToken: credential,
      audience: env.google.clientId,
    })
    .catch(() => {
      throw new AppError("Google sign-in could not be verified.", 401);
    });
  const payload = ticket.getPayload();
  const email = payload?.email?.toLowerCase();

  if (!email || !payload?.email_verified) {
    throw new AppError("Google account email could not be verified.", 401);
  }

  const name = payload.name?.trim() || email.split("@")[0] || "BizTrack User";
  const passwordHash = await bcrypt.hash(randomToken(), 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      emailVerifiedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
    create: {
      name,
      email,
      passwordHash,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    },
    select: authUserSelect,
  });

  assertAccountCanAuthenticate(user);
  sendLoginAlertEmail(user, meta);
  return buildAuthResponse(user);
}

export async function requestLoginOtp(email: string, password: string, _meta?: RequestMeta) {
  const config = await getActiveSecurityConfig();
  if (!config.enableOtpLogin) throw new AppError("OTP login is not enabled.", 400);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      ...authUserSelect,
      passwordHash: true,
      failedLoginAttempts: true,
    },
  });

  if (!user) throw new AppError("Invalid email or password.", 401);
  assertAccountCanAuthenticate(user);

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    await recordInvalidLogin(user);
  }

  if (config.requireEmailVerification && !user.emailVerifiedAt && user.role !== "SUPER_ADMIN") {
    throw new AppError("Please verify your email before signing in.", 403);
  }

  const otpCode = generateOtpCode();
  const otpToken = randomToken();
  const expiresAt = addMinutes(new Date(), config.otpExpiryMinutes);
  const deliveryChannel = config.enableSmsOtp ? "SMS" : "EMAIL";

  const authToken = await prisma.$transaction(async (tx) => {
    const token = await createAuthToken(
      tx,
      user.id,
      "LOGIN_OTP",
      hashLoginOtp(otpToken, otpCode),
      expiresAt,
    );

    await tx.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        otpCodeHash: null,
        otpLoginTokenHash: null,
        otpExpiresAt: null,
      },
    });

    return token;
  });

  try {
    if (config.enableSmsOtp) {
      if (!user.phone) {
        throw new AppError("SMS OTP is enabled but this account has no phone number.", 400);
      }
      await sendOtpSms(user.phone, otpCode);
    } else {
      await sendLoginOtpEmail(user, otpCode);
    }
  } catch (error) {
    await prisma.authToken.update({
      where: { id: authToken.id },
      data: { usedAt: new Date() },
    });
    throw error;
  }

  return {
    requiresOtp: true,
    otpToken,
    expiresAt,
    deliveryChannel,
    ...devSecret({ otpCode }),
  };
}

export async function verifyOtpLogin(otpToken: string, otpCode: string, meta?: RequestMeta) {
  const config = await getActiveSecurityConfig();
  if (!config.enableOtpLogin) throw new AppError("OTP login is not enabled.", 400);

  const authToken = await prisma.authToken.findFirst({
    where: {
      type: "LOGIN_OTP",
      tokenHash: hashLoginOtp(otpToken, otpCode),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: { select: authUserSelect },
    },
  });

  if (!authToken) throw new AppError("Invalid or expired OTP code.", 400);
  assertAccountCanAuthenticate(authToken.user);

  if (config.requireEmailVerification && !authToken.user.emailVerifiedAt && authToken.user.role !== "SUPER_ADMIN") {
    throw new AppError("Please verify your email before signing in.", 403);
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    await tx.authToken.update({
      where: { id: authToken.id },
      data: { usedAt: new Date() },
    });

    return tx.user.update({
      where: { id: authToken.userId },
      data: {
        otpCodeHash: null,
        otpLoginTokenHash: null,
        otpExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
      select: authUserSelect,
    });
  });

  sendLoginAlertEmail(updatedUser, meta);
  return buildAuthResponse(updatedUser);
}

export async function sendVerificationEmail(email: string) {
  const config = await getActiveSecurityConfig();
  if (!config.requireEmailVerification) {
    return { message: VERIFY_EMAIL_MESSAGE };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
    },
  });

  if (!user || user.status === "SUSPENDED" || user.emailVerifiedAt || user.role === "SUPER_ADMIN") {
    return { message: VERIFY_EMAIL_MESSAGE };
  }

  const { token, authTokenId } = await prisma.$transaction(async (tx) => {
    const rawToken = randomToken();
    const authToken = await createAuthToken(
      tx,
      user.id,
      "EMAIL_VERIFICATION",
      hashToken(rawToken),
      addMinutes(new Date(), 24 * 60),
    );

    return { token: rawToken, authTokenId: authToken.id };
  });

  try {
    await sendVerificationTokenEmail(user, token);
  } catch (error) {
    await prisma.authToken.update({
      where: { id: authTokenId },
      data: { usedAt: new Date() },
    });
    throw error;
  }

  return {
    message: VERIFY_EMAIL_MESSAGE,
    ...devSecret({ verificationToken: token }),
  };
}

export async function verifyEmail(token: string) {
  const authToken = await prisma.authToken.findFirst({
    where: {
      type: "EMAIL_VERIFICATION",
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: { select: authUserSelect },
    },
  });

  if (!authToken) throw new AppError("Invalid or expired email verification token.", 400);

  const updatedUser = await prisma.$transaction(async (tx) => {
    await tx.authToken.update({
      where: { id: authToken.id },
      data: { usedAt: new Date() },
    });

    return tx.user.update({
      where: { id: authToken.userId },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
      select: authUserSelect,
    });
  });

  return buildAuthResponse(updatedUser);
}

export async function forgotPassword(email: string) {
  const config = await getActiveSecurityConfig();
  if (!config.enablePasswordReset) {
    throw new AppError("Password reset is currently disabled.", 403);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, status: true },
  });

  if (user && user.status !== "SUSPENDED") {
    const resetToken = await prisma.$transaction((tx) =>
      issueRawAuthToken(
        tx,
        user.id,
        "PASSWORD_RESET",
        addMinutes(new Date(), 60),
      ),
    );

    try {
      await sendPasswordResetEmail(user, resetToken);
    } catch {
      await prisma.authToken.updateMany({
        where: {
          userId: user.id,
          type: "PASSWORD_RESET",
          tokenHash: hashToken(resetToken),
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
    }
  }

  return { message: FORGOT_PASSWORD_MESSAGE };
}

export async function resetPassword(token: string, password: string) {
  const config = await getActiveSecurityConfig();
  if (!config.enablePasswordReset) {
    throw new AppError("Password reset is currently disabled.", 403);
  }
  validatePasswordAgainstConfig(password, config);

  const authToken = await prisma.authToken.findFirst({
    where: {
      type: "PASSWORD_RESET",
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!authToken || authToken.user.status === "SUSPENDED") {
    throw new AppError("Invalid or expired password reset token.", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.authToken.update({
      where: { id: authToken.id },
      data: { usedAt: new Date() },
    });
    await markUnusedTokensUsed(tx, authToken.userId, "LOGIN_OTP");

    await tx.user.update({
      where: { id: authToken.userId },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        otpCodeHash: null,
        otpLoginTokenHash: null,
        otpExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  });

  return { message: "Password has been reset." };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const config = await getActiveSecurityConfig();
  validatePasswordAgainstConfig(newPassword, config);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...authUserSelect, passwordHash: true },
  });

  if (!user) throw new AppError("User not found.", 404);

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new AppError("Current password is incorrect.", 400);

  const updatedUser = await prisma.$transaction(async (tx) => {
    await markUnusedTokensUsed(tx, user.id, "PASSWORD_RESET");
    await markUnusedTokensUsed(tx, user.id, "LOGIN_OTP");

    return tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 12),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        otpCodeHash: null,
        otpLoginTokenHash: null,
        otpExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      select: authUserSelect,
    });
  });

  return serializeAuthUser(updatedUser);
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: authUserSelect,
  });

  if (!user) throw new AppError("User not found.", 404);
  assertAccountCanAuthenticate(user);

  return serializeAuthUser(user);
}
