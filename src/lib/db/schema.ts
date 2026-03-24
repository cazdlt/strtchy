import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// BetterAuth tables
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	name: text('name'),
	username: text('username'),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	passwordHash: text('password_hash'),
	preferences: text('preferences', { mode: 'json' }).$type<{
		audioVolume?: number;
		defaultRestTime?: number;
		autoAdvance?: boolean;
		audioEnabled?: boolean;
		keepAwake?: boolean;
	}>(),
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
});

export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
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

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
	code: text('code').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Legacy exports for compatibility (will be removed)
export const users = user;
export const sessions = session;
export const accounts = account;
export const verifications = verification;

export const movements = sqliteTable('movements', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	type: text('type', { enum: ['timed', 'reps', 'weighted', 'resistance_band'] }).notNull(),
	illustrationPath: text('illustration_path'),
	isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
	userId: text('user_id').references(() => user.id),
	weightUnit: text('weight_unit', { enum: ['lbs', 'kg', 'bodyweight'] }),
	isBilateral: integer('is_bilateral', { mode: 'boolean' }).notNull().default(false),
	switchSidesDuration: integer('switch_sides_duration').notNull().default(5),
	timePerRep: integer('time_per_rep'), // seconds per rep for auto-advance (null for timed exercises)
	equipment: text('equipment', { mode: 'json' }).$type<string[]>(),
	metadata: text('metadata', { mode: 'json' }).$type<{
		defaultTarget?: {
			type: 'time' | 'reps';
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
	userId: text('user_id').references(() => user.id),
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
		type: 'time' | 'reps';
		value: number;
		unit?: string;
		customTag?: string;
	}>().notNull(),
	sets: integer('sets').notNull().default(1),
	isBilateral: integer('is_bilateral', { mode: 'boolean' }).notNull().default(false),
	switchSidesDuration: integer('switch_sides_duration').notNull().default(5),
	weight: integer('weight'), // default weight for weighted/resistance exercises
	weightUnit: text('weight_unit', { enum: ['lbs', 'kg', 'bodyweight'] }),
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
	setOverrides: text('set_overrides', { mode: 'json' }).$type<Record<string, number>>(), // Map of routineMovementId to set count override
});

export const practiceData = sqliteTable('practice_data', {
	id: text('id').primaryKey(),
	practiceLogId: text('practice_log_id').references(() => practiceLogs.id, { onDelete: 'cascade' }).notNull(),
	routineMovementId: text('routine_movement_id').references(() => routineMovements.id).notNull(),
	setNumber: integer('set_number').notNull(),
	side: text('side', { enum: ['left', 'right'] }),
	value: integer('value').notNull(), // time in seconds or reps count
	measurementType: text('measurement_type', { enum: ['time', 'reps'] }).notNull(),
	weight: integer('weight'), // weight value used for weighted/resistance exercises
	weightUnit: text('weight_unit', { enum: ['lbs', 'kg', 'bodyweight'] }),
	customMeasurement: text('custom_measurement'), // e.g., band color
	rating: integer('rating'), // 1-10 rating after completing movement
	status: text('status', { enum: ['completed', 'skipped'] }).notNull().default('completed'),
	completedAt: integer('completed_at', { mode: 'timestamp' }).notNull(),
});

// Relations
export const userRelations = relations(user, ({ many }) => ({
	movements: many(movements),
	routines: many(routines),
	practiceLogs: many(practiceLogs),
	sessions: many(session),
}));

export const movementsRelations = relations(movements, ({ one, many }) => ({
	user: one(user, {
		fields: [movements.userId],
		references: [user.id],
	}),
	routineMovements: many(routineMovements),
}));

export const routinesRelations = relations(routines, ({ one, many }) => ({
	user: one(user, {
		fields: [routines.userId],
		references: [user.id],
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

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const practiceLogsRelations = relations(practiceLogs, ({ one, many }) => ({
	routine: one(routines, {
		fields: [practiceLogs.routineId],
		references: [routines.id],
	}),
	user: one(user, {
		fields: [practiceLogs.userId],
		references: [user.id],
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
