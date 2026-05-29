import type { ConfigProvider } from "@prisma/client";
import { AppError } from "../utils/AppError";

export type SmsProviderInput = {
  provider: ConfigProvider;
  baseUrl?: string | null;
  apiKey?: string | null;
  apiSecret?: string | null;
  senderId?: string | null;
  phoneNumber: string;
  message: string;
};

async function sendHttpSms(input: SmsProviderInput) {
  if (!input.baseUrl) {
    throw new AppError("SMS provider is not configured.", 400);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (input.apiKey) {
    headers.Authorization = `Bearer ${input.apiKey}`;
  }

  const response = await fetch(input.baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      to: input.phoneNumber,
      phoneNumber: input.phoneNumber,
      message: input.message,
      senderId: input.senderId,
      apiKey: input.apiKey,
      apiSecret: input.apiSecret,
    }),
  });

  if (!response.ok) {
    throw new Error("SMS provider rejected request.");
  }
}

export async function sendSms(input: SmsProviderInput) {
  if (input.provider === "SMTP") {
    throw new AppError("Selected SMS provider is not supported for SMS.", 400);
  }

  try {
    await sendHttpSms(input);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Could not send SMS. Check the SMS configuration and try again.", 502);
  }
}
