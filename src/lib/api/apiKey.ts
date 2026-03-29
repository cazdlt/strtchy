import { db } from "$lib/db";
import { user } from "$lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const API_KEY_PREFIX = "strtchy_";
const API_KEY_LENGTH = 32;

/**
 * Generate a new API key
 * Returns the plaintext key (shown once) and the hash for storage
 */
export function generateApiKey(): {
  plaintext: string;
  hash: string;
  prefix: string;
} {
  // Generate random bytes and convert to base64url (no special chars issues)
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  const randomPart = randomBytes.toString("base64url").slice(0, API_KEY_LENGTH);

  const plaintext = `${API_KEY_PREFIX}${randomPart}`;
  const hash = hashApiKey(plaintext);
  const prefix = plaintext.slice(0, 16) + "...****";

  return { plaintext, hash, prefix };
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Validate an API key against the database
 * Returns the user if valid, null otherwise
 */
export async function validateApiKey(
  key: string,
): Promise<typeof user.$inferSelect | null> {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const hash = hashApiKey(key);

  const userData = await db.query.user.findFirst({
    where: eq(user.apiKeyHash, hash),
  });

  if (!userData) {
    return null;
  }

  // Update last used timestamp
  await db
    .update(user)
    .set({ apiKeyLastUsedAt: new Date() })
    .where(eq(user.id, userData.id));

  return userData;
}

/**
 * Extract API key from Authorization header
 * Format: "Bearer strtchy_xxx..."
 */
export function extractApiKeyFromHeader(
  authHeader: string | null,
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const key = authHeader.substring(7).trim();

  // Check if it's an API key (starts with our prefix)
  if (key.startsWith(API_KEY_PREFIX)) {
    return key;
  }

  return null;
}
