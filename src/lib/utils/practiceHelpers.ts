export type Side = 'left' | 'right' | null;

export interface SetKeyData {
	routineMovementId: string;
	setNumber: number;
	side: Side;
}

export function generateSetKey(routineMovementId: string, setNumber: number, side: Side): string {
	return `${routineMovementId}-${setNumber}-${side || 'none'}`;
}

export function parseSetKey(key: string): SetKeyData {
	const parts = key.split('-');
	return {
		routineMovementId: parts[0],
		setNumber: parseInt(parts[1]),
		side: parts[2] === 'none' ? null : (parts[2] as Side)
	};
}

export function countCompletedMovementSets(
	routineMovementId: string,
	completedSets: Set<string>,
	skippedSets: Set<string>
): number {
	let count = 0;
	for (const key of completedSets) {
		if (key.startsWith(`${routineMovementId}-`)) {
			count += 1;
		}
	}
	for (const key of skippedSets) {
		if (key.startsWith(`${routineMovementId}-`)) {
			count += 1;
		}
	}
	return count;
}

export interface MovementData {
	id: string;
	sets: number;
	isBilateral: boolean;
}

export function calculateTotalSets(
	movements: MovementData[],
	setOverrides: Record<string, number>
): number {
	return movements.reduce((sum, rm) => {
		const sets = setOverrides[rm.id] ?? rm.sets;
		return sum + (rm.isBilateral ? sets * 2 : sets);
	}, 0);
}

export interface IncompleteSetInfo {
	movementIndex: number;
	routineMovementId: string;
	setNumber: number;
	side: Side;
}

export function findNextIncompleteSet(
	movements: MovementData[],
	completedSets: Set<string>,
	skippedSets: Set<string>,
	setOverrides: Record<string, number>
): IncompleteSetInfo | null {
	for (let i = 0; i < movements.length; i++) {
		const rm = movements[i];
		const actualSets = setOverrides[rm.id] ?? rm.sets;
		const sets = rm.isBilateral ? actualSets * 2 : actualSets;

		for (let j = 1; j <= sets; j++) {
			const side: Side = rm.isBilateral ? (j % 2 === 1 ? 'left' : 'right') : null;
			const actualSetNumber = rm.isBilateral ? Math.ceil(j / 2) : j;
			const key = generateSetKey(rm.id, actualSetNumber, side);

			if (!completedSets.has(key) && !skippedSets.has(key)) {
				return {
					movementIndex: i,
					routineMovementId: rm.id,
					setNumber: actualSetNumber,
					side
				};
			}
		}
	}
	return null;
}

export function isAllSetsComplete(
	movements: MovementData[],
	completedSets: Set<string>,
	skippedSets: Set<string>,
	setOverrides: Record<string, number>
): boolean {
	const total = calculateTotalSets(movements, setOverrides);
	return completedSets.size + skippedSets.size >= total;
}

export function calculateMovementTotalSets(sets: number, isBilateral: boolean): number {
	return isBilateral ? sets * 2 : sets;
}

export function scrollAndHighlightSet(
	routineMovementId: string,
	setNumber: number,
	side: Side
): void {
	const elementId = `set-${generateSetKey(routineMovementId, setNumber, side)}`;
	scrollToElement(elementId);
}

export function scrollToElement(elementId: string): void {
	const element = document.getElementById(elementId);
	if (element) {
		element.scrollIntoView({ behavior: 'smooth', block: 'center' });
		element.classList.add('highlight-set');
		setTimeout(() => {
			element.classList.remove('highlight-set');
		}, 2000);
	}
}
