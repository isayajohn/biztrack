import type { Request, Response } from "express";
import * as authService from "../services/auth.service";

function requestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  };
}

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body.email, req.body.password, requestMeta(req));
  res.json({ success: true, data: result });
}

export async function requestLoginOtp(req: Request, res: Response) {
  const result = await authService.requestLoginOtp(req.body.email, req.body.password, requestMeta(req));
  res.json({ success: true, data: result });
}

export async function verifyOtpLogin(req: Request, res: Response) {
  const result = await authService.verifyOtpLogin(req.body.otpToken, req.body.otpCode, requestMeta(req));
  res.json({ success: true, data: result });
}

export async function sendVerificationEmail(req: Request, res: Response) {
  const result = await authService.sendVerificationEmail(req.body.email);
  res.json({ success: true, data: result });
}

export async function verifyEmail(req: Request, res: Response) {
  const result = await authService.verifyEmail(req.body.token);
  res.json({ success: true, data: result });
}

export async function forgotPassword(req: Request, res: Response) {
  const result = await authService.forgotPassword(req.body.email);
  res.json({ success: true, data: result });
}

export async function resetPassword(req: Request, res: Response) {
  const result = await authService.resetPassword(req.body.token, req.body.password);
  res.json({ success: true, data: result });
}

export async function changePassword(req: Request, res: Response) {
  const user = await authService.changePassword(
    req.user!.id,
    req.body.currentPassword,
    req.body.newPassword,
  );
  res.json({ success: true, data: user });
}

export async function me(req: Request, res: Response) {
  const user = await authService.me(req.user!.id);
  res.json({ success: true, data: user });
}
