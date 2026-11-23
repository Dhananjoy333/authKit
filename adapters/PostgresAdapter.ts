import { Pool } from "pg";
import type { DatabaseAdapter, Session, User } from "../authKit.ts";

export class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const res = await this.pool.query(
      'SELECT * FROM "Users" WHERE email = $1',
      [email],
    );
    const row = res.rows[0];
    if (!row) return null;

    return {
      id: row.user_id,
      email: row.email,
      passwordHash: row.hashed_password,
      name: row.username,
      image: row.image,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const res = await this.pool.query(
      'SELECT * FROM "Users" WHERE user_id = $1',
      [id],
    );
    const row = res.rows[0];
    if (!row) return null;

    return {
      id: row.user_id,
      email: row.email,
      passwordHash: row.hashed_password,
      name: row.username,
      image: row.image,
    };
  }

  async createUser(id: string, user: User): Promise<void> {
    await this.pool.query(
      'INSERT INTO "Users" (user_id, email, hashed_password, username, image, updated_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [
        id,
        user.email,
        user.passwordHash,
        user.name ?? null,
        user.image ?? null,
      ],
    );
  }

  async createSession(id: string, session: Session): Promise<void> {
    await this.pool.query(
      'INSERT INTO "Sessions" (session_id, user_id, expire_at) VALUES ($1, $2, $3)',
      [id, session.userId, session.expiresAt],
    );
  }

  async getSessionById(id: string): Promise<Session | null> {
    const res = await this.pool.query(
      'SELECT * FROM "Sessions" WHERE session_id = $1',
      [id],
    );
    const row = res.rows[0];
    if (!row) return null;

    return {
      id: row.session_id,
      userId: row.user_id,
      expiresAt: row.expire_at,
    };
  }

  async deleteSession(id: string): Promise<void> {
    await this.pool.query('DELETE FROM "Sessions" WHERE session_id = $1', [id]);
  }
}
