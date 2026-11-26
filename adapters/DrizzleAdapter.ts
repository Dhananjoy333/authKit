// adapters/DrizzleAdapter.ts
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { DatabaseAdapter, Session, User } from "../authKit.ts";

export class DrizzleAdapter implements DatabaseAdapter {
    private db: NodePgDatabase<any>;
    private usersTable: any;
    private sessionsTable: any;

    constructor(db: NodePgDatabase<any>, usersTable: any, sessionsTable: any) {
        this.db = db;
        this.usersTable = usersTable;
        this.sessionsTable = sessionsTable;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const [user] = await this.db
            .select()
            .from(this.usersTable)
            .where(eq(this.usersTable.email, email));
        return (user as User) ?? null;
    }

    async getUserById(id: string): Promise<User | null> {
        const [user] = await this.db.select().from(this.usersTable).where(eq(this.usersTable.user_id, id))
        return (user as User) ?? null
    }

    async getSessionById(session_id: string): Promise<Session | null> {
        const [session] = await this.db.select().from(this.sessionsTable).where(eq(this.sessionsTable.session_id, session_id))
        return (session as Session) ?? null
    }

    async createSession(hashedSessionId: string, session: Session): Promise<void> {
        await this.db.insert(this.sessionsTable).values({
            session_id: hashedSessionId,
            user_id: session.user_id,
            expire_at: session.expire_at
        })
    }

    async createUser(id: string, user: User): Promise<void> {
        await this.db.insert(this.usersTable).values({
            user_id: id,
            email: user.email,
            hashed_password: user.hashed_password,
            username: user.username,
            image: user.image,
            updated_at: new Date(),
        })
    }

    async deleteSession(hashedSessionId: string): Promise<void> {
        await this.db.delete(this.sessionsTable).where(eq(this.sessionsTable.session_id, hashedSessionId))
    }
}