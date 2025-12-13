// utils/cryptoUtil.js
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();


/**
 * Encrypts plaintext using AES-256-GCM with a passphrase.
 * Returns a Base64 string containing salt + iv + tag + ciphertext.
 */
export function encryptWithSecret(plaintext, secret) {
  const salt = crypto.randomBytes(16); // 16 bytes
  const iv = crypto.randomBytes(12); // 12 bytes for GCM
  const key = crypto.pbkdf2Sync(secret, salt, 100000, 32, "sha256");

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Combine salt + iv + tag + ciphertext
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypts Base64 string back to plaintext using the same secret.
 * Returns null if decryption fails.
 */
export function decryptWithSecret(encryptedBase64, secret) {
  try {
    const data = Buffer.from(encryptedBase64, "base64");

    const salt = data.subarray(0, 16);
    const iv = data.subarray(16, 28);
    const tag = data.subarray(28, 44);
    const ciphertext = data.subarray(44);

    const key = crypto.pbkdf2Sync(secret, salt, 100000, 32, "sha256");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Decryption failed:", err.message);
    return null;
  }
}

