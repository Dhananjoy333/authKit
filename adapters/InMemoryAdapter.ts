import type { User, Session, DatabaseAdapter } from "../authKit.ts";

export class InMemoryAdapter implements DatabaseAdapter {
  private userById = new Map<string, User>();
  private userIdByEmail = new Map<string, string>();
  private sessionById = new Map<string, Session>();

  async getUserByEmail(email: string) {
    const id = this.userIdByEmail.get(email)
    if (!id) return null
    return this.userById.get(id) ?? null;
  }

  async getUserById(id: string) {
    return this.userById.get(id) ?? null
  }

  async setUserIdByEmail(email: string, id: string) {
    this.userIdByEmail.set(email, id);
  }

  async createUser(id: string, user: User) {
    this.userById.set(id, user);
    this.userIdByEmail.set(user.email, id)
  }

  async createSession(hashedSessionId: string, session: Session) {
    this.sessionById.set(hashedSessionId, session);
  }

  async getSessionById(hashedSessionId: string) {
    const session = this.sessionById.get(hashedSessionId);
    if (!session) {
      return null
    }
    return session
  }

  async deleteSession(hashedSessionId: string) {
    this.sessionById.delete(hashedSessionId);
  }
}
