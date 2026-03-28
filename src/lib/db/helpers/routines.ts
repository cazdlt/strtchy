import { db } from '$lib/db';
import { routines, routineMovements, movements, practiceData } from '$lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { checkDuplicateRoutineName } from '$lib/validation/helpers/duplicates';
import { generateRoutineId, generateRoutineMovementId } from '$lib/utils/id';
import type { RoutineInput, RoutineUpdateInput, RoutineMovementConfig } from '$lib/validation/schemas/routine';

export async function createRoutine(
	data: RoutineInput,
	userId: string | undefined
) {
	// Check for duplicate name
	const duplicate = await checkDuplicateRoutineName(data.name);
	if (duplicate.exists) {
		throw new Error(`Routine "${duplicate.existingName}" already exists`);
	}

	const routineId = generateRoutineId(data.name);

	await db.insert(routines).values({
		id: routineId,
		name: data.name,
		description: data.description,
		userId,
		restBetweenMovements: data.restBetweenMovements,
		restBetweenSets: data.restBetweenSets,
		autoAdvance: data.autoAdvance,
		audioEnabled: data.audioEnabled,
		keepAwake: data.keepAwake,
		isCustom: true,
		createdAt: new Date()
	});

	// Insert routine movements
	await insertRoutineMovements(routineId, data.name, data.movementsData as RoutineMovementConfig[]);

	return routineId;
}

export async function updateRoutine(
	routineId: string,
	data: RoutineUpdateInput,
	movementsData: RoutineMovementConfig[],
	userId: string | undefined
) {
	const existing = await db.query.routines.findFirst({
		where: eq(routines.id, routineId)
	});

	if (!existing) {
		throw new Error('Routine not found');
	}

	// Check for duplicate name if changing
	if (data.name && data.name !== existing.name) {
		const duplicate = await checkDuplicateRoutineName(data.name, routineId);
		if (duplicate.exists) {
			throw new Error(`Routine "${duplicate.existingName}" already exists`);
		}
	}

	// Update routine
	await db.update(routines).set({
		name: data.name ?? existing.name,
		description: data.description !== undefined ? data.description : existing.description,
		restBetweenMovements: data.restBetweenMovements ?? existing.restBetweenMovements,
		restBetweenSets: data.restBetweenSets ?? existing.restBetweenSets,
		autoAdvance: data.autoAdvance ?? existing.autoAdvance,
		audioEnabled: data.audioEnabled ?? existing.audioEnabled,
		keepAwake: data.keepAwake ?? existing.keepAwake
	}).where(eq(routines.id, routineId));

	// Delete and re-insert movements
	// First, delete practice_data records that reference this routine's movements
	const existingMovements = await db.query.routineMovements.findMany({
		where: eq(routineMovements.routineId, routineId),
		columns: { id: true }
	});
	console.log(`[updateRoutine] Found ${existingMovements.length} existing movements for routine ${routineId}`);
	
	if (existingMovements.length > 0) {
		const movementIds = existingMovements.map(m => m.id);
		console.log(`[updateRoutine] Deleting practice_data for ${movementIds.length} routine movements`);
		const deletedPracticeData = await db.delete(practiceData).where(inArray(practiceData.routineMovementId, movementIds));
		console.log(`[updateRoutine] Deleted practice_data records`);
	}
	
	console.log(`[updateRoutine] Deleting ${existingMovements.length} routine_movements for routine ${routineId}`);
	await db.delete(routineMovements).where(eq(routineMovements.routineId, routineId));
	
	console.log(`[updateRoutine] Inserting ${movementsData.length} new movements for routine ${routineId}`);
	await insertRoutineMovements(routineId, data.name ?? existing.name, movementsData);
	console.log(`[updateRoutine] Successfully updated routine ${routineId}`);

	return routineId;
}

export async function deleteRoutine(routineId: string, userId: string | undefined) {
	const existing = await db.query.routines.findFirst({
		where: eq(routines.id, routineId)
	});

	if (!existing) {
		throw new Error('Routine not found');
	}

	await db.delete(routines).where(eq(routines.id, routineId));
}

export async function insertRoutineMovements(
	routineId: string,
	routineName: string,
	movementsData: RoutineMovementConfig[]
) {
	for (let i = 0; i < movementsData.length; i++) {
		const movement = movementsData[i];

		const movementRecord = await db.query.movements.findFirst({
			where: eq(movements.id, movement.movementId)
		});

		const movementName = movementRecord?.name || 'unknown';
		const id = generateRoutineMovementId(routineName, movementName, i);

		await db.insert(routineMovements).values({
			id,
			routineId,
			movementId: movement.movementId,
			order: movement.order,
			target: movement.target,
			sets: movement.sets,
			isBilateral: movement.isBilateral,
			switchSidesDuration: movement.switchSidesDuration,
			weight: movement.weight,
			weightUnit: movement.weightUnit,
			notes: movement.notes
		});
	}
}

export async function updateRoutineMovement(
	routineId: string,
	routineMovementId: string,
	data: Partial<RoutineMovementConfig>
) {
	const existing = await db.query.routineMovements.findFirst({
		where: eq(routineMovements.id, routineMovementId)
	});

	if (!existing || existing.routineId !== routineId) {
		throw new Error('Routine movement not found');
	}

	await db.update(routineMovements).set({
		order: data.order ?? existing.order,
		target: data.target ?? existing.target,
		sets: data.sets ?? existing.sets,
		isBilateral: data.isBilateral ?? existing.isBilateral,
		switchSidesDuration: data.switchSidesDuration ?? existing.switchSidesDuration,
		weight: data.weight !== undefined ? data.weight : existing.weight,
		weightUnit: data.weightUnit ?? existing.weightUnit,
		notes: data.notes !== undefined ? data.notes : existing.notes
	}).where(eq(routineMovements.id, routineMovementId));

	return routineMovementId;
}

export async function deleteRoutineMovement(routineId: string, routineMovementId: string) {
	const existing = await db.query.routineMovements.findFirst({
		where: eq(routineMovements.id, routineMovementId)
	});

	if (!existing || existing.routineId !== routineId) {
		throw new Error('Routine movement not found');
	}

	await db.delete(routineMovements).where(eq(routineMovements.id, routineMovementId));
}
