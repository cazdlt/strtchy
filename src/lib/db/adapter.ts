import type { User, Session, Adapter } from 'lucia';
import { db } from './index';
import { users, sessions } from './schema';
import { eq } from 'drizzle-orm';

export const drizzleAdapter = (): Adapter => {
	return {
		getUser: async (userId) => {
			const user = db.select().from(users).where(eq(users.id, userId)).get();
			return user || null;
		},
		getUserBySessionId: async (sessionId) => {
			const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
			if (!session) return null;
			const user = db.select().from(users).where(eq(users.id, session.userId)).get();
			return user || null;
		},
	 getSessionAndUser: async (sessionId) => {
			const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
			if (!session) return null;
			const user = db.select().from(users).where(eq(users.id, session.userId)).get();
			if (!user) return null;
			return { session, user };
		},
		updateSession: async (sessionId, partialSession) => {
			const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
			if (!session) return null;
			const updated = { ...session, ...partialSession } as Session;
			db.update(sessions).set(updated).where(eq(sessions.id, sessionId));
			return updated;
		},
		deleteSession: async (sessionId) => {
			await db.delete(sessions).where(eq(sessions.id, sessionId));
		},
		deleteSessionsByUserId: async (userId) => {
			await db.delete(sessions).where(eq(sessions.userId, userId));
		},
		createUser: async (user) => {
			await db.insert(users).values(user);
			return user;
		},
		createSession: async (session) => {
			await db.insert(sessions).values(session);
			return session;
		}
	};
};
