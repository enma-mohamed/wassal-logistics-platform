import crypto from "crypto";

// تشفير كلمة المرور باستخدام SHA-256 مع Salt
const SALT = "wassal_secret_salt_key_123";

export function hashPassword(password: string): string {
  return crypto
    .createHmac("sha256", SALT)
    .update(password)
    .digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  const passwordHash = hashPassword(password);
  return passwordHash === hash;
}
