import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	name: text('name'),
	username: text('username').notNull().unique(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	passwordHash: text('password_hash').notNull(),
	preferences: text('preferences', { mode: 'json' }).$type<{
		audioVolume?: number;
		defaultRestTime?: number;
		autoAdvance?: boolean;
		keepAwake?: boolean;
	}>(),
});

export const sessions = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
});

export const accounts = sqliteTable('account', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
	providerId: text('provider_id').notNull(),
	accountId: text('account_id').notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	expiresAt: integer('expires_at', { mode: 'timestamp' }),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verifications = sqliteTable('verification', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
	code: text('code').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const movements = sqliteTable('movements', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	type: text('type', { enum: ['timed', 'reps', 'count', 'distance'] }).notNull(),
	svgIllustration: text('svg_illustration'),
	isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
	userId: text('user_id').references(() => users.id),
	metadata: text('metadata', { mode: 'json' }).$type<{
		defaultTarget?: {
			type: 'time' | 'reps' | 'distance';
			value: number;
			unit?: string;
		};
		suggestedTags?: string[];
	}>(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const routines = sqliteTable('routines', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	userId: text('user_id').references(() => users.id),
	restBetweenMovements: integer('rest_between_movements').notNull().default(30),
	restBetweenSets: integer('rest_between_sets').notNull().default(15),
	autoAdvance: integer('auto_advance', { mode: 'boolean' }).notNull().default(true),
	audioEnabled: integer('audio_enabled', { mode: 'boolean' }).notNull().default(true),
	keepAwake: integer('keep_awake', { mode: 'boolean' }).notNull().default(true),
	isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const routineMovements = sqliteTable('routine_movements', {
	id: text('id').primaryKey(),
	routineId: text('routine_id').references(() => routines.id, { onDelete: 'cascade' }).notNull(),
	movementId: text('movement_id').references(() => movements.id).notNull(),
	order: integer('order').notNull(),
	target: text('target', { mode: 'json' }).$type<{
		type: 'time' | 'reps' | 'distance';
		value: number;
		unit?: string;
		customTag?: string;
	}>().notNull(),
	sets: integer('sets').notNull().default(1),
	isBilateral: integer('is_bilateral', { mode: 'boolean' }).notNull().default(false),
	notes: text('notes'),
});

export const practiceLogs = sqliteTable('practice_logs', {
	id: text('id').primaryKey(),
	routineId: text('routine_id').references(() => routines.id).notNull(),
	userId: text('user_id').references(() => users.id),
	startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
	completedAt: integer('completed_at', { mode: 'timestamp' }),
	duration: integer('duration'), // in seconds
	notes: text('notes'),
});

export const practiceData = sqliteTable('practice_data', {
	id: text('id').primaryKey(),
	practiceLogId: text('practice_log_id').references(() => practiceLogs.id, { onDelete: 'cascade' }).notNull(),
	routineMovementId: text('routine_movement_id').references(() => routineMovements.id).notNull(),
	setNumber: integer('set_number').notNull(),
	value: integer('value').notNull(), // time in seconds, reps count, or distance
	measurementType: text('measurement_type', { enum: ['time', 'reps', 'distance', 'custom'] }).notNull(),
	customMeasurement: text('custom_measurement'), // e.g., band color
	completedAt: integer('completed_at', { mode: 'timestamp' }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	movements: many(movements),
	routines: many(routines),
	practiceLogs: many(practiceLogs),
	sessions: many(sessions),
}));

export const movementsRelations = relations(movements, ({ one, many }) => ({
	user: one(users, {
		fields: [movements.userId],
		references: [users.id],
	}),
	routineMovements: many(routineMovements),
}));

export const routinesRelations = relations(routines, ({ one, many }) => ({
	user: one(users, {
		fields: [routines.userId],
		references: [users.id],
	}),
	movements: many(routineMovements),
	practiceLogs: many(practiceLogs),
}));

export const routineMovementsRelations = relations(routineMovements, ({ one, many }) => ({
	routine: one(routines, {
		fields: [routineMovements.routineId],
		references: [routines.id],
	}),
	movement: one(movements, {
		fields: [routineMovements.movementId],
		references: [movements.id],
	}),
	practiceData: many(practiceData),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const practiceLogsRelations = relations(practiceLogs, ({ one, many }) => ({
	routine: one(routines, {
		fields: [practiceLogs.routineId],
		references: [routines.id],
	}),
	user: one(users, {
		fields: [practiceLogs.userId],
		references: [users.id],
	}),
	practiceData: many(practiceData),
}));

export const practiceDataRelations = relations(practiceData, ({ one }) => ({
	practiceLog: one(practiceLogs, {
		fields: [practiceData.practiceLogId],
		references: [practiceLogs.id],
	}),
	routineMovement: one(routineMovements, {
		fields: [practiceData.routineMovementId],
		references: [routineMovements.id],
	}),
}));
