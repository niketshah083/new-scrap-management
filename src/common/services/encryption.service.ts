import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

/**
 * Encryption service using AES-256-GCM for secure password storage.
 * This service provides symmetric encryption for sensitive data like
 * external database passwords.
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly authTagLength = 16; // 128 bits

  /**
   * Get the encryption key from environment variable or generate a default one.
   * In production, ENCRYPTION_KEY should be set as an environment variable.
   */
  private getKey(): Buffer {
    const envKey = process.env.ENCRYPTION_KEY;
    if (envKey) {
      // If key is provided, hash it to ensure correct length
      return crypto.createHash("sha256").update(envKey).digest();
    }
    // Fallback for development - NOT recommended for production
    return crypto
      .createHash("sha256")
      .update("default-dev-key-change-in-production")
      .digest();
  }

  /**
   * Encrypts a plaintext string using AES-256-GCM.
   * Returns a base64-encoded string containing IV + AuthTag + Ciphertext.
   *
   * @param plaintext - The text to encrypt
   * @returns Base64-encoded encrypted string
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      return "";
    }

    const key = this.getKey();
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Combine IV + AuthTag + Ciphertext and encode as base64
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, "hex"),
    ]);

    return combined.toString("base64");
  }

  /**
   * Decrypts a base64-encoded encrypted string using AES-256-GCM.
   *
   * @param encryptedText - Base64-encoded encrypted string
   * @returns Decrypted plaintext string
   * @throws Error if decryption fails (invalid data or tampered ciphertext)
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) {
      return "";
    }

    try {
      const key = this.getKey();
      const combined = Buffer.from(encryptedText, "base64");

      // Extract IV, AuthTag, and Ciphertext
      const iv = combined.subarray(0, this.ivLength);
      const authTag = combined.subarray(
        this.ivLength,
        this.ivLength + this.authTagLength
      );
      const ciphertext = combined.subarray(this.ivLength + this.authTagLength);

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(
        ciphertext.toString("hex"),
        "hex",
        "utf8"
      );
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error("Failed to decrypt: Invalid or tampered data");
    }
  }

  /**
   * Checks if a string appears to be encrypted (base64 encoded with correct structure).
   *
   * @param text - The text to check
   * @returns True if the text appears to be encrypted
   */
  isEncrypted(text: string): boolean {
    if (!text) {
      return false;
    }

    try {
      const decoded = Buffer.from(text, "base64");
      // Minimum length: IV (16) + AuthTag (16) + at least 1 byte of ciphertext
      return decoded.length >= this.ivLength + this.authTagLength + 1;
    } catch {
      return false;
    }
  }
}
