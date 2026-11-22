import type { PrismaClient } from "../generated/prisma/client.ts";
import type { DatabaseAdapter, Session, User } from "../authKit.ts";

export class PrismaAdapter implements DatabaseAdapter {
    private prisma: PrismaClient;
    constructor(prisma: PrismaClient) {
        this.prisma = prisma
     }

    async getUserByEmail(email: string): Promise<User | null> {
        const raw = await this.prisma.users.findUnique({ where: { email } });
        if (!raw) return null;

        return {
            id: raw.user_id,
            email: raw.email,
            passwordHash: raw.hashed_password,
            name: raw.username,
            image: raw.image,
        };
    }

    async getUserById(id: string): Promise<User | null> {
        const raw = await this.prisma.users.findUnique({ where: { user_id: id } });
        if (!raw) return null;

        return {
            id: raw.user_id,
            email: raw.email,
            passwordHash: raw.hashed_password,
            name: raw.username,
            image: raw.image,
        };
    }

    async createUser(id: string, user: User): Promise<void> {
        await this.prisma.users.create({
            data: {
                user_id: id,
                email: user.email,
                hashed_password: user.passwordHash,
                username: user.name,
                image: user.image,
            },
        });
    }

    async createSession(hashedSessionId: string, session: Session): Promise<void> {
        await this.prisma.sessions.create({
            data: {
                session_id: hashedSessionId,
                user_id: session.userId,
                expire_at: session.expiresAt,
            },
        });
    }

    async getSessionById(hashedSessionId: string): Promise<Session | null> {
        const raw = await this.prisma.sessions.findUnique({
            where: { session_id: hashedSessionId },
        });
        if (!raw) return null;

        return {
            id: raw.session_id,
            userId: raw.user_id,
            expiresAt: raw.expire_at,
        };
    }

    async deleteSession(hashedSessionId: string): Promise<void> {
        await this.prisma.sessions.delete({
            where: { session_id: hashedSessionId },
        });
    }
}