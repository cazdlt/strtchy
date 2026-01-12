export function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
	if (seconds < 60) {
		return `${seconds}s`;
	}
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	if (secs === 0) {
		return `${mins}m`;
	}
	return `${mins}m ${secs}s`;
}

export function calculateRoutineDuration(
	movements: Array<{
		target: { type: 'time' | 'reps'; value: number };
		sets: number;
		isBilateral: boolean;
		switchSidesDuration: number;
	}>,
	restBetweenMovements: number,
	restBetweenSets: number
): number {
	let totalSeconds = 0;
	let totalSets = 0;

	for (const rm of movements) {
		if (rm.target.type === 'time') {
			totalSeconds += rm.target.value * rm.sets;
		} else {
			totalSeconds += rm.target.value * 4 * rm.sets;
		}

		if (rm.isBilateral) {
			totalSeconds += rm.switchSidesDuration * rm.sets;
		}

		totalSets += rm.sets;
	}

	if (movements.length > 1) {
		totalSeconds += restBetweenMovements * (movements.length - 1);
	}

	const setsWithoutFirstPerMovement = totalSets - movements.length;
	if (setsWithoutFirstPerMovement > 0) {
		totalSeconds += restBetweenSets * setsWithoutFirstPerMovement;
	}

	return totalSeconds;
}

export function getRelativeTime(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}
