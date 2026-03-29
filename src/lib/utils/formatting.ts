export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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
    target: { type: "time" | "reps"; value: number };
    sets: number;
    isBilateral: boolean;
    switchSidesDuration: number;
    timePerRep?: number | null;
  }>,
  restBetweenMovements: number,
  restBetweenSets: number,
): number {
  let totalSeconds = 0;

  // Initial "Get Ready" rest
  if (movements.length > 0) {
    totalSeconds += restBetweenMovements;
  }

  for (let i = 0; i < movements.length; i++) {
    const rm = movements[i];
    const sideMultiplier = rm.isBilateral ? 2 : 1;
    // Use timePerRep if available (for rep-based exercises), otherwise default to 3 seconds per rep
    const secondsPerRep = rm.timePerRep ?? 3;
    const executionTime =
      rm.target.type === "time" ? rm.target.value : rm.target.value * secondsPerRep;

    // Time spent exercising (both sides if bilateral)
    totalSeconds += executionTime * sideMultiplier * rm.sets;

    // Time spent switching sides
    if (rm.isBilateral) {
      totalSeconds += rm.switchSidesDuration * rm.sets;
    }

    // Time spent resting between sets
    if (rm.sets > 1) {
      totalSeconds += restBetweenSets * (rm.sets - 1);
    }

    // Time spent resting between movements (if not the last movement)
    if (i < movements.length - 1) {
      totalSeconds += restBetweenMovements;
    }
  }

  return totalSeconds;
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
