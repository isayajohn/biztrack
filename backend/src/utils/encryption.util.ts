import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function getEncryptionKey() {
  const configuredKey = process.env.CONFIG_ENCRYPTION_KEY?.trim();
  if (!configuredKey) {
    throw new Error("CONFIG_ENCRYPTION_KEY is not configured.");
  }

  return crypto.createHash("sha256").update(configuredKey).digest();
}

export function encryptValue(value?: string | null): string | null {
  const plain = value?.trim();
  if (!plain) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptValue(value?: string | null): string | null {
  if (!value) return null;

  const [version, iv, tag, encrypted] = value.split(":");
  if (version !== VERSION || !iv || !tag || !encrypted) return null;

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(iv, "base64"));
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

export function maskValue(value?: string | null): string | null {
  if (!value) return null;
  const visible = value.slice(-4);
  return `${"*".repeat(8)}${visible}`;
}

export function maskEncryptedValue(value?: string | null): string | null {
  return maskValue(decryptValue(value));
}
