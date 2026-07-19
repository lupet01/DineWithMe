import { createHmac } from "crypto";

/**
 * QR Token Generator/Verifier for Check-in
 * 
 * Simple HMAC-based token for MVP.
 * Format: {seatId}.{timestamp}.{signature}
 * 
 * Future: Replace with JWT or more robust solution
 */

const TOKEN_EXPIRY_HOURS = 24; // Tokens valid for 24 hours

function getTokenSecret(): string {
  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) {
    throw new Error("QR_TOKEN_SECRET environment variable is required");
  }
  return secret;
}

/**
 * Generate a check-in token for a seat
 * 
 * @param seatId - ID of the seat
 * @param dinnerId - ID of the dinner
 * @returns Token string
 */
export function generateCheckInToken(seatId: string, dinnerId: string): string {
  const TOKEN_SECRET = getTokenSecret();
  const timestamp = Date.now().toString();
  const payload = `${seatId}.${dinnerId}.${timestamp}`;
  const signature = createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("hex");
  
  return `${payload}.${signature}`;
}

/**
 * Verify a check-in token
 * 
 * @param token - Token string to verify
 * @returns Object with valid flag and parsed data
 */
export function verifyCheckInToken(token: string): {
  valid: boolean;
  seatId?: string;
  dinnerId?: string;
  reason?: string;
} {
  try {
    const TOKEN_SECRET = getTokenSecret();
    const parts = token.split(".");
    
    if (parts.length !== 4) {
      return { valid: false, reason: "Invalid token format" };
    }

    const [seatId, dinnerId, timestamp, signature] = parts;

    if (!seatId || !dinnerId || !timestamp || !signature) {
      return { valid: false, reason: "Invalid token format" };
    }

    // Verify signature
    const payload = `${seatId}.${dinnerId}.${timestamp}`;
    const expectedSignature = createHmac("sha256", TOKEN_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false, reason: "Invalid token signature" };
    }

    // Check expiry
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    const expiryMs = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

    if (now - tokenTime > expiryMs) {
      return { valid: false, reason: "Token expired" };
    }

    return {
      valid: true,
      seatId,
      dinnerId,
    };
  } catch (error) {
    return { valid: false, reason: "Token verification failed" };
  }
}

/**
 * Generate check-in URL for a seat
 * 
 * @param seatId - ID of the seat
 * @param dinnerId - ID of the dinner
 * @param baseUrl - Base URL of the app (e.g., "https://dinewithme.com")
 * @returns Full check-in URL
 */
export function generateCheckInUrl(
  seatId: string,
  dinnerId: string,
  baseUrl: string
): string {
  const token = generateCheckInToken(seatId, dinnerId);
  return `${baseUrl}/dinner/${dinnerId}/check-in?token=${token}`;
}
