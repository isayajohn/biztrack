import net from "net";
import tls from "tls";
import crypto from "crypto";
import type { ConfigProvider } from "@prisma/client";
import { AppError } from "../utils/AppError";

type SmtpSocket = net.Socket | tls.TLSSocket;

type EmailProviderInput = {
  provider: ConfigProvider;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  apiKey?: string | null;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | null;
  to: string;
  subject: string;
  body: string;
  htmlBody?: string | null;
  inlineImages?: Array<{
    cid: string;
    filename: string;
    contentType: string;
    content: Buffer;
  }>;
};

type EmailProviderTestInput = Omit<EmailProviderInput, "subject" | "body">;

type SmtpResponse = {
  code: number;
  message: string;
};

const SMTP_TIMEOUT_MS = 15_000;

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function formatAddress(name: string, email: string) {
  const safeName = sanitizeHeader(name).replace(/"/g, '\\"');
  return `"${safeName}" <${sanitizeHeader(email)}>`;
}

function normalizeMessage(raw: string) {
  return raw.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function wrapBase64(content: Buffer) {
  return content.toString("base64").replace(/(.{76})/g, "$1\n").trim();
}

function boundary(name: string) {
  return `biztrack-${name}-${crypto.randomBytes(8).toString("hex")}`;
}

function buildMessage(input: EmailProviderInput) {
  const hasHtml = Boolean(input.htmlBody);
  const relatedBoundary = boundary("related");
  const alternativeBoundary = boundary("alternative");
  const headers = [
    `From: ${formatAddress(input.fromName, input.fromEmail)}`,
    `To: ${sanitizeHeader(input.to)}`,
    `Subject: ${sanitizeHeader(input.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
  ];

  if (input.replyToEmail) {
    headers.splice(2, 0, `Reply-To: ${sanitizeHeader(input.replyToEmail)}`);
  }

  if (!hasHtml) {
    return normalizeMessage(`${headers.join("\n")}\nContent-Type: text/plain; charset=UTF-8\n\n${input.body}`);
  }

  const parts = [
    `--${alternativeBoundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.body,
    `--${alternativeBoundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.htmlBody ?? "",
    `--${alternativeBoundary}--`,
  ];

  const relatedParts = [
    ...headers,
    `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
    "",
    `--${relatedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
    "",
    ...parts,
  ];

  for (const image of input.inlineImages ?? []) {
    relatedParts.push(
      `--${relatedBoundary}`,
      `Content-Type: ${image.contentType}; name="${sanitizeHeader(image.filename)}"`,
      "Content-Transfer-Encoding: base64",
      `Content-ID: <${sanitizeHeader(image.cid)}>`,
      `Content-Disposition: inline; filename="${sanitizeHeader(image.filename)}"`,
      "",
      wrapBase64(image.content),
    );
  }

  relatedParts.push(`--${relatedBoundary}--`);
  return normalizeMessage(relatedParts.join("\n"));
}

function isTerminalResponse(message: string) {
  const lines = message.split(/\r?\n/).filter(Boolean);
  const lastLine = lines[lines.length - 1];
  return Boolean(lastLine && /^\d{3} /.test(lastLine));
}

function parseResponse(message: string): SmtpResponse {
  const match = message.match(/^(\d{3})[ -]/m);
  return {
    code: match ? Number(match[1]) : 0,
    message,
  };
}

function readResponse(socket: SmtpSocket): Promise<SmtpResponse> {
  return new Promise((resolve, reject) => {
    let response = "";

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("timeout", onTimeout);
    };

    const onData = (chunk: Buffer) => {
      response += chunk.toString("utf8");

      if (!isTerminalResponse(response)) return;
      cleanup();
      resolve(parseResponse(response));
    };

    const onError = () => {
      cleanup();
      reject(new Error("SMTP socket error."));
    };

    const onTimeout = () => {
      cleanup();
      reject(new Error("SMTP request timed out."));
    };

    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("timeout", onTimeout);
  });
}

function expectResponse(response: SmtpResponse, expectedCodes: number[]) {
  if (!expectedCodes.includes(response.code)) {
    throw new Error("Unexpected SMTP response.");
  }
}

async function sendCommand(
  socket: SmtpSocket,
  command: string,
  expectedCodes: number[],
) {
  socket.write(`${command}\r\n`);
  const response = await readResponse(socket);
  expectResponse(response, expectedCodes);
  return response;
}

function connectPlain(host: string, port: number): Promise<SmtpSocket> {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(SMTP_TIMEOUT_MS);

    const cleanup = () => {
      socket.off("connect", onConnect);
      socket.off("error", onError);
      socket.off("timeout", onTimeout);
    };
    const onConnect = () => {
      cleanup();
      resolve(socket);
    };
    const onError = () => {
      cleanup();
      reject(new Error("SMTP connection error."));
    };
    const onTimeout = () => {
      cleanup();
      socket.destroy();
      reject(new Error("SMTP connection timed out."));
    };

    socket.once("connect", onConnect);
    socket.once("error", onError);
    socket.once("timeout", onTimeout);
  });
}

function connectSecure(host: string, port: number): Promise<SmtpSocket> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host });
    socket.setTimeout(SMTP_TIMEOUT_MS);

    const cleanup = () => {
      socket.off("secureConnect", onConnect);
      socket.off("error", onError);
      socket.off("timeout", onTimeout);
    };
    const onConnect = () => {
      cleanup();
      resolve(socket);
    };
    const onError = () => {
      cleanup();
      reject(new Error("SMTP TLS connection error."));
    };
    const onTimeout = () => {
      cleanup();
      socket.destroy();
      reject(new Error("SMTP TLS connection timed out."));
    };

    socket.once("secureConnect", onConnect);
    socket.once("error", onError);
    socket.once("timeout", onTimeout);
  });
}

function upgradeToTls(socket: SmtpSocket, host: string): Promise<SmtpSocket> {
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: host });
    secureSocket.setTimeout(SMTP_TIMEOUT_MS);

    const cleanup = () => {
      secureSocket.off("secureConnect", onConnect);
      secureSocket.off("error", onError);
      secureSocket.off("timeout", onTimeout);
    };
    const onConnect = () => {
      cleanup();
      resolve(secureSocket);
    };
    const onError = () => {
      cleanup();
      reject(new Error("SMTP STARTTLS connection error."));
    };
    const onTimeout = () => {
      cleanup();
      secureSocket.destroy();
      reject(new Error("SMTP STARTTLS connection timed out."));
    };

    secureSocket.once("secureConnect", onConnect);
    secureSocket.once("error", onError);
    secureSocket.once("timeout", onTimeout);
  });
}

async function sendEhlo(socket: SmtpSocket) {
  try {
    return await sendCommand(socket, "EHLO biztrack.local", [250]);
  } catch {
    return sendCommand(socket, "HELO biztrack.local", [250]);
  }
}

async function authenticateIfNeeded(
  socket: SmtpSocket,
  username?: string | null,
  secret?: string | null,
) {
  if (!username || !secret) return;

  await sendCommand(socket, "AUTH LOGIN", [334]);
  await sendCommand(socket, Buffer.from(username).toString("base64"), [334]);
  await sendCommand(socket, Buffer.from(secret).toString("base64"), [235]);
}

async function sendSmtpEmail(input: EmailProviderInput) {
  if (!input.host || !input.port) {
    throw new AppError("SMTP host and port are required before sending email.", 400);
  }

  let socket: SmtpSocket | null = null;

  try {
    socket = input.port === 465
      ? await connectSecure(input.host, input.port)
      : await connectPlain(input.host, input.port);

    expectResponse(await readResponse(socket), [220]);
    let ehloResponse = await sendEhlo(socket);

    if (input.port !== 465 && /STARTTLS/i.test(ehloResponse.message)) {
      await sendCommand(socket, "STARTTLS", [220]);
      socket = await upgradeToTls(socket, input.host);
      ehloResponse = await sendEhlo(socket);
    }

    const authSecret = input.password ?? input.apiKey;
    await authenticateIfNeeded(socket, input.username, authSecret);

    await sendCommand(socket, `MAIL FROM:<${input.fromEmail}>`, [250]);
    await sendCommand(socket, `RCPT TO:<${input.to}>`, [250, 251]);
    await sendCommand(socket, "DATA", [354]);
    socket.write(`${buildMessage(input)}\r\n.\r\n`);
    expectResponse(await readResponse(socket), [250]);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Could not send email. Check your email configuration and try again.", 502);
  } finally {
    if (socket && !socket.destroyed) {
      socket.write("QUIT\r\n");
      socket.end();
    }
  }
}

export async function sendEmail(input: EmailProviderInput) {
  if (input.provider !== "SMTP") {
    throw new AppError("Email sending is currently supported for SMTP providers only.", 400);
  }

  await sendSmtpEmail(input);
}

export async function sendTestEmail(input: EmailProviderTestInput) {
  if (input.provider !== "SMTP") {
    throw new AppError("Test email sending is currently supported for SMTP providers only.", 400);
  }

  await sendSmtpEmail({
    ...input,
    subject: "BizTrack test email",
    body: [
      "This is a test email from BizTrack.",
      "",
      "Your email configuration is able to send messages.",
    ].join("\n"),
  });
}
