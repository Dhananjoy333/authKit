import crypto from "node:crypto";
import { promisify } from "node:util";
import { InMemoryAdapter } from './adapters/InMemoryAdapter.ts'

const scryptAsync = promisify(crypto.scrypt);

// --- Models ---
export interface User {
  user_id: string;
  email: string;
  username?: string | null;
  image?: string | null;
  hashed_password: string; // "hash.salt"
}

export interface Session {
  session_id: string; // SHA-256 hash of the raw token
  user_id: string;
  expire_at: Date;
}

export interface RegisterOptions{
  name? : string | null;
  image? : string | null;
}

export interface DatabaseAdapter {
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>
  createUser(id: string, user: User): Promise<void>;
  createSession(hashedSessionId: string, session: Session): Promise<void>;
  getSessionById(hashedSessionId: string): Promise<Session | null>;
  deleteSession(hashedSessionId: string): Promise<void>
}

// --- Helpers ---
async function hashPassword(
  plainPassword: string,
  salt?: string,
): Promise<{ hash: string; salt: string }> {
  const generatedSalt = salt || crypto.randomBytes(16).toString("hex");
  // N=16384, r=8, p=1 by default
  const derivedKey = (await scryptAsync(
    plainPassword,
    generatedSalt,
    64,
  )) as Buffer;
  return {
    hash: derivedKey.toString("hex"),
    salt: generatedSalt,
  };
}

async function verifyPassword(
  plainPassword: string,
  storedHash: string,
  salt: string,
): Promise<boolean> {
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
  private adapter: DatabaseAdapter
  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter
  }

  // returns error or user
  async register(email: string, plainPassword: string, options?: RegisterOptions): Promise<User> {
    const user_exist = await this.adapter.getUserByEmail(email);
    if (user_exist) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    const { hash, salt } = await hashPassword(plainPassword);
    const user: User = {
      user_id: crypto.randomUUID(),
      email,
      username: options?.name ?? null,
      image: options?.image ?? null,
      hashed_password: `${hash}.${salt}`,
    };

    await this.adapter.createUser(user.user_id, user);

    return user;
  }

  // returns error or {user, sessionToken}
  async login(
    email: string,
    plainPassword: string,
  ): Promise<{ user: User; sessionToken: string }> {
    const user = await this.adapter.getUserByEmail(email);
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const [storedHash, salt] = user.hashed_password.split(".");
    const isValid = await verifyPassword(plainPassword, storedHash, salt);

    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // 1. Create a 32-byte high-entropy session token for the client
    const sessionToken = crypto.randomBytes(32).toString("base64url");

    // 2. Hash the token before storing it in the database
    const hashedSessionId = hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
    const session: Session = {
      session_id: hashedSessionId,
      user_id: user.user_id,
      expire_at: expiresAt,
    };
    await this.adapter.createSession(hashedSessionId, session)

    return { user, sessionToken };
  }

  //returns null or {user, session}
  async validateSession(
    rawToken: string,
  ): Promise<{ user: User; session: Session } | null> {
    const hashedSessionId = hashToken(rawToken);
    const session = await this.adapter.getSessionById(hashedSessionId)

    if (!session) return null;

    // Check expiration
    if (Date.now() >= session.expire_at.getTime()) {
      await this.adapter.deleteSession(hashedSessionId);
      return null;
    }

    const user = await this.adapter.getUserById(session.user_id);
    if (!user) return null;

    return { user, session };
  }

  // no return
  async logout(rawToken: string): Promise<void> {
    const hashedSessionId = hashToken(rawToken);
    await this.adapter.deleteSession(hashedSessionId)
  }
}
