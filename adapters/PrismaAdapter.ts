import type { PrismaClient } from "../generated/prisma/client.ts";
import type { DatabaseAdapter, Session, User } from "../authKit.ts";

export class PrismaAdapter implements DatabaseAdapter {
    private prisma: PrismaClient;
    constructor(prisma: PrismaClient) {
        this.prisma = prisma
     }

    async getUserByEmail(email: string): Promise<User | null> {
        return await this.prisma.users.findUnique({ where: { email } });
    }

    async getUserById(id: string): Promise<User | null> {
        return await this.prisma.users.findUnique({ where: { user_id: id } });
    }

    async createUser(id: string, user: User): Promise<void> {
        await this.prisma.users.create({
            data: {
                user_id: id,
                email: user.email,
                hashed_password: user.hashed_password,
                username: user.username,
                image: user.image,
            },
        });
    }

    async createSession(hashedSessionId: string, session: Session): Promise<void> {
        await this.prisma.sessions.create({
            data: {
                session_id: hashedSessionId,
                user_id: session.user_id,
                expire_at: session.expire_at,
            },
        });
    }

    async getSessionById(hashedSessionId: string): Promise<Session | null> {
        return await this.prisma.sessions.findUnique({
            where: { session_id: hashedSessionId },
        });
    }

    async deleteSession(hashedSessionId: string): Promise<void> {
        await this.prisma.sessions.delete({
            where: { session_id: hashedSessionId },
        });
    }
}