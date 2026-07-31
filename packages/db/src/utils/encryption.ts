import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * AES-256-GCM encryption for data that must be stored encrypted at rest -
 * currently only Restaurant.bankAccountNumber (§16.5). Not a general-purpose
 * secrets vault: this exists specifically because a restaurant's bank
 * account number sitting in plaintext in the database is a real liability,
 * and GCM gives us both confidentiality and tamper detection (a modified
 * ciphertext fails to decrypt rather than silently returning garbage).
 *
 * BANK_DETAILS_ENCRYPTION_KEY must be a 32+ character random string, set in
 * the environment - never checked into source. scryptSync derives a fixed
 * 32-byte key from it so the env var itself doesn't have to be exactly 32
 * bytes.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT = "dinewithme-bank-details-v1"; // fixed salt: this derives a key from a secret, not a password from user input

function getKey(): Buffer {
  const secret = process.env.BANK_DETAILS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("BANK_DETAILS_ENCRYPTION_KEY is not set - cannot encrypt/decrypt bank details");
  }
  return scryptSync(secret, SALT, 32);
}

/**
 * Returns "iv:authTag:ciphertext", each hex-encoded, joined with colons -
 * safe to store directly in a single text column.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed encrypted value");
  }

  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/**
 * Masks a decrypted bank account number for display - last 4 digits only,
 * e.g. "•••• 4821". Never call this on the still-encrypted value.
 */
export function maskAccountNumber(accountNumber: string): string {
  const lastFour = accountNumber.slice(-4);
  return `•••• ${lastFour}`;
}
