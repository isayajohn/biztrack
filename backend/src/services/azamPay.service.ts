import { env } from "../config/env";
import { AppError } from "../utils/AppError";

type TokenResponse = {
  data?: { accessToken?: string; token?: string };
  accessToken?: string;
  access_token?: string;
  token?: string;
};

type CheckoutInput = {
  amount: number;
  currency: string;
  description: string;
  externalId: string;
  callbackUrl: string;
  returnUrl: string;
};

type CheckoutResponse = {
  checkoutUrl: string;
  providerReference?: string | null;
  rawResponse: unknown;
};

function requireAzamPayConfig() {
  if (!env.azamPay.enabled) {
    throw new AppError("AzamPay payments are disabled.", 503);
  }

  if (env.azamPay.token) return;

  if (!env.azamPay.appName || !env.azamPay.clientId || !env.azamPay.clientSecret) {
    throw new AppError("Payment provider is not configured. Please contact support.", 503, {
      code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
      provider: "AZAMPAY",
      missing: {
        appName: !env.azamPay.appName,
        clientId: !env.azamPay.clientId,
        clientSecret: !env.azamPay.clientSecret,
      },
    });
  }
}

function findString(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const direct = record[key];
    if (typeof direct === "string" && direct.trim()) return direct.trim();
  }

  const data = record.data;
  if (data && typeof data === "object") {
    return findString(data, keys);
  }

  return null;
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

async function postJson(url: string, body: Record<string, unknown>, token?: string) {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new AppError("Could not connect to AzamPay. Please try again or contact support.", 503, {
      code: "PAYMENT_PROVIDER_UNREACHABLE",
      provider: "AZAMPAY",
      url,
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new AppError("AzamPay rejected the payment request. Please contact support.", 502, {
      code: "PAYMENT_PROVIDER_REJECTED_REQUEST",
      provider: "AZAMPAY",
      status: response.status,
      response: payload,
    });
  }

  return payload;
}

export async function getAzamPayAccessToken() {
  requireAzamPayConfig();
  if (env.azamPay.token) return env.azamPay.token;

  const payload = (await postJson(env.azamPay.authUrl, {
    appName: env.azamPay.appName,
    clientId: env.azamPay.clientId,
    clientSecret: env.azamPay.clientSecret,
  })) as TokenResponse | null;

  const token =
    payload?.data?.accessToken ??
    payload?.data?.token ??
    payload?.accessToken ??
    payload?.access_token ??
    payload?.token;

  if (!token) {
    throw new AppError("AzamPay token response did not include an access token.", 502, {
      response: payload,
    });
  }

  return token;
}

export async function createAzamPayCheckout(input: CheckoutInput): Promise<CheckoutResponse> {
  const token = await getAzamPayAccessToken();
  const payload = {
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    externalId: input.externalId,
    reference: input.externalId,
    callback_url: input.callbackUrl,
    return_url: input.returnUrl,
    callbackUrl: input.callbackUrl,
    returnUrl: input.returnUrl,
  };

  const response = await postJson(env.azamPay.checkoutUrl, payload, token);
  const checkoutUrl = findString(response, [
    "checkout_url",
    "checkoutUrl",
    "paymentUrl",
    "payment_url",
    "redirectUrl",
    "redirect_url",
    "url",
  ]);

  if (!checkoutUrl) {
    throw new AppError("AzamPay checkout response did not include a checkout URL.", 502, {
      response,
    });
  }

  return {
    checkoutUrl,
    providerReference: findString(response, [
      "reference",
      "transactionId",
      "transaction_id",
      "paymentId",
      "payment_id",
    ]),
    rawResponse: response,
  };
}
