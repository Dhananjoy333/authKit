import { Pool } from "pg"
import { DatabaseAdapter, Session, User } from "../authKit";

/* db Schema
users : 
user_id (primary key, unique)
email (varchar, unique, not null)
hashed_password (varchar, not null)

sessions : 
session_id  
user_id (foreign key)
expire_at 
*/

export class PostgresAdapter implements DatabaseAdapter {
    constructor(private pool: Pool) { }

    async getUserByEmail(email: string) {
        const res = await this.pool.query("SELECT * FROM users WHERE email = $1", [email])
        return res.rows[0] ?? null
    }

    async getUserById(id: string) {
        const res = await this.pool.query("SELECT * FROM users WHERE user_id = $1", [id])
        return res.rows[0] ?? null
    }

    async createUser(id: string, user: User) {
        await this.pool.query("INSERT INTO users(used_id, email, hashed_password) VALUES ($1, $2, $3)", [id, user.email, user.passwordHash])
    }

    async createSession(id: string, session: Session) {
        await this.pool.query("INSERT INTO sessions(session_id, user_id, expire_at) VALUES ($1, $2, $3)", [id, session.userId, session.expiresAt])
    }

    async getSessionById(id: string) {
        const res = await this.pool.query("SELECT * FROM sessions WHERE session_id = $1", [id])
        return res.rows[0] ?? null
    }

    async deleteSession(id: string) {
        await this.pool.query("DELETE FROM sessions WHERE session_id = $1", [id])
    }
}