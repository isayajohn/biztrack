import crypto from "crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function getKey() {
  return crypto.createHash("sha256").update(env.appEncryptionKey).digest();
}

export function encryptSecret(value?: string | null): string | null {
  const plain = value?.trim();
  if (!plain) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptSecret(value?: string | null): string | null {
  if (!value) return null;

  const [version, iv, tag, encrypted] = value.split(":");
  if (version !== VERSION || !iv || !tag || !encrypted) return null;

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function maskSecret(value?: string | null): string | null {
  if (!value) return null;
  const visible = value.slice(-4);
  return `${"*".repeat(Math.max(8, value.length - visible.length))}${visible}`;
}

export function maskEncryptedSecret(value?: string | null): string | null {
  return maskSecret(decryptSecret(value));
}
