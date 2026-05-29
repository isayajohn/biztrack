import { AppError } from "../utils/AppError";
import { getActiveSmsProviderConfig } from "./smsConfig.service";
import { sendSms } from "./smsProvider.service";
import { renderActiveSmsTemplate } from "./smsTemplate.service";

export async function sendOtpSms(to: string, otpCode: string) {
  const config = await getActiveSmsProviderConfig();
  const rendered = await renderActiveSmsTemplate("OTP_CODE", { otpCode });

  if (!config.baseUrl) {
    throw new AppError("SMS OTP is enabled but the SMS provider is not ready.", 400);
  }

  await sendSms({
    provider: config.provider,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    senderId: config.senderId,
    phoneNumber: to,
    message: rendered.body,
  });
}
