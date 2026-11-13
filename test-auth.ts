import crypto from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(crypto.scrypt);

// --- Models ---
export interface User {
  id: string;
  email: string;
  passwordHash: string; // "hash.salt"
}

export interface Session {
  id: string; // SHA-256 hash of the raw token
  userId: string;
  expiresAt: Date;
}

// In-memory storage (will be replaced by your database adapter later)
const userById = new Map<string, User>();
const userIdByEmail = new Map<string, string>();
const sessionById = new Map<string, Session>();

// --- Helpers ---
async function hashPassword(plainPassword: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const generatedSalt = salt || crypto.randomBytes(16).toString("hex");
  // N=16384, r=8, p=1 by default
  const derivedKey = (await scryptAsync(plainPassword, generatedSalt, 64)) as Buffer;
  return {
    hash: derivedKey.toString("hex"),
    salt: generatedSalt,
  };
}

async function verifyPassword(plainPassword: string, storedHash: string, salt: string): Promise<boolean> {
    const derivedKey = (await scryptAsync(plainPassword, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (derivedKey.length !== storedBuffer.length) {
      return false;
    }
    // Constant-time check prevents timing attacks
    return crypto.timingSafeEqual(derivedKey, storedBuffer);
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// --- Core Auth Engine ---
export class AuthEngine {
  async register(email: string, plainPassword: string): Promise<User> {
    if (userIdByEmail.has(email)) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    const { hash, salt } = await hashPassword(plainPassword);
    const user: User = {
      id: crypto.randomUUID(),
      email,
      passwordHash: `${hash}.${salt}`,
    };

    userIdByEmail.set(email, user.id);
    userById.set(user.id, user);

    return user;
  }

  async login(email: string, plainPassword: string): Promise<{ user: User; sessionToken: string }> {
    const userId = userIdByEmail.get(email);
    if (!userId) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const user = userById.get(userId);
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const [storedHash, salt] = user.passwordHash.split(".");
    const isValid = await verifyPassword(plainPassword, storedHash, salt);

    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // 1. Create a 32-byte high-entropy session token for the client
    const sessionToken = crypto.randomBytes(32).toString("base64url");
    
    // 2. Hash the token before storing it in the database
    const hashedSessionId = hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    sessionById.set(hashedSessionId, {
      id: hashedSessionId,
      userId: user.id,
      expiresAt,
    });

    return { user, sessionToken };
  }

  async validateSession(rawToken: string): Promise<{ user: User; session: Session } | null> {
    const hashedSessionId = hashToken(rawToken);
    const session = sessionById.get(hashedSessionId);

    if (!session) return null;

    // Check expiration
    if (Date.now() >= session.expiresAt.getTime()) {
      sessionById.delete(hashedSessionId);
      return null;
    }

    const user = userById.get(session.userId);
    if (!user) return null;

    return { user, session };
  }

  async logout(rawToken: string): Promise<void> {
    const hashedSessionId = hashToken(rawToken);
    sessionById.delete(hashedSessionId);
  }
}

async function test() {
  const auth = new AuthEngine();

  console.log("--- 1. Registering ---");
  const user = await auth.register("dhananjoy@test.com", "pass123");
  console.log("Registered User ID:", user.id);

  console.log("\n--- 2. Duplicate Registration ---");
  try {
    await auth.register("dhananjoy@test.com", "pass123");
  } catch (err: any) {
    console.log("Caught expected error:", err.message);
  }

  console.log("\n--- 3. Login with Wrong Password ---");
  try {
    await auth.login("dhananjoy@test.com", "wrongpass");
  } catch (err: any) {
    console.log("Caught expected error:", err.message);
  }

  console.log("\n--- 4. Valid Login & Token Generation ---");
  const { sessionToken } = await auth.login("dhananjoy@test.com", "pass123");
  console.log("Plain Session Token (Client Cookie):", sessionToken);

  console.log("\n--- 5. Validate Session ---");
  const sessionData = await auth.validateSession(sessionToken);
  console.log("Validated User:", sessionData?.user.email);

  console.log("\n--- 6. Logout ---");
  await auth.logout(sessionToken);
  const afterLogout = await auth.validateSession(sessionToken);
  console.log("After logout validation (should be null):", afterLogout);

}

test();