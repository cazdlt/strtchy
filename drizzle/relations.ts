import { relations } from "drizzle-orm/relations";
import { user, account, movements, routineMovements, practiceData, practiceLogs, routines, session, verification } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	movements: many(movements),
	practiceLogs: many(practiceLogs),
	routines: many(routines),
	sessions: many(session),
	verifications: many(verification),
}));

export const movementsRelations = relations(movements, ({one, many}) => ({
	user: one(user, {
		fields: [movements.userId],
		references: [user.id]
	}),
	routineMovements: many(routineMovements),
}));

export const practiceDataRelations = relations(practiceData, ({one}) => ({
	routineMovement: one(routineMovements, {
		fields: [practiceData.routineMovementId],
		references: [routineMovements.id]
	}),
	practiceLog: one(practiceLogs, {
		fields: [practiceData.practiceLogId],
		references: [practiceLogs.id]
	}),
}));

export const routineMovementsRelations = relations(routineMovements, ({one, many}) => ({
	practiceData: many(practiceData),
	movement: one(movements, {
		fields: [routineMovements.movementId],
		references: [movements.id]
	}),
	routine: one(routines, {
		fields: [routineMovements.routineId],
		references: [routines.id]
	}),
}));

export const practiceLogsRelations = relations(practiceLogs, ({one, many}) => ({
	practiceData: many(practiceData),
	user: one(user, {
		fields: [practiceLogs.userId],
		references: [user.id]
	}),
	routine: one(routines, {
		fields: [practiceLogs.routineId],
		references: [routines.id]
	}),
}));

export const routinesRelations = relations(routines, ({one, many}) => ({
	practiceLogs: many(practiceLogs),
	routineMovements: many(routineMovements),
	user: one(user, {
		fields: [routines.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const verificationRelations = relations(verification, ({one}) => ({
	user: one(user, {
		fields: [verification.userId],
		references: [user.id]
	}),
}));