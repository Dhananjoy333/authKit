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
    return res.rows[0] ?? null;
  }

  async getUserById(id: string): Promise<User | null> {
    const res = await this.pool.query(
      'SELECT * FROM "Users" WHERE user_id = $1',
      [id],
    );
    return res.rows[0] ?? null;
  }

  async createUser(id: string, user: User): Promise<void> {
    await this.pool.query(
      'INSERT INTO "Users" (user_id, email, hashed_password, username, image, updated_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [
        id,
        user.email,
        user.hashed_password,
        user.username ?? null,
        user.image ?? null,
      ],
    );
  }

  async createSession(id: string, session: Session): Promise<void> {
    await this.pool.query(
      'INSERT INTO "Sessions" (session_id, user_id, expire_at) VALUES ($1, $2, $3)',
      [id, session.user_id, session.expire_at],
    );
  }

  async getSessionById(id: string): Promise<Session | null> {
    const res = await this.pool.query(
      'SELECT * FROM "Sessions" WHERE session_id = $1',
      [id],
    );
    return res.rows[0] ?? null;
  }

  async deleteSession(id: string): Promise<void> {
    await this.pool.query('DELETE FROM "Sessions" WHERE session_id = $1', [id]);
  }
}
