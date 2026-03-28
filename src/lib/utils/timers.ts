export interface TimerController {
	isRunning: boolean;
	start(): void;
	stop(): void;
	pause(): void;
	resume(): void;
}

export interface CountdownTimerController extends TimerController {
	remaining: number;
	progress: number;
}

export function createCountdownTimer(
	duration: number,
	onTick: (remaining: number, progress: number) => void,
	onComplete: () => void,
	isPaused: () => boolean = () => false
): CountdownTimerController {
	let remaining = duration;
	let interval: ReturnType<typeof setInterval> | null = null;
	let isRunning = false;

	function tick() {
		if (isPaused()) return;
		
		remaining--;
		onTick(remaining, remaining / duration);
		
		if (remaining <= 0) {
			stop();
			onComplete();
		}
	}

	function start() {
		if (isRunning) return;
		isRunning = true;
		onTick(remaining, remaining / duration);
		interval = setInterval(tick, 1000);
	}

	function stop() {
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
		isRunning = false;
	}

	function pause() {
		// Handled by isPaused callback
	}

	function resume() {
		// Handled by isPaused callback
	}

	return {
		get isRunning() { return isRunning; },
		get remaining() { return remaining; },
		get progress() { return remaining / duration; },
		start,
		stop,
		pause,
		resume
	};
}

export function createIntervalTimer(
	onTick: () => void,
	isPaused: () => boolean = () => false
): TimerController {
	let interval: ReturnType<typeof setInterval> | null = null;
	let isRunning = false;

	function tick() {
		if (!isPaused()) {
			onTick();
		}
	}

	function start() {
		if (isRunning) return;
		isRunning = true;
		interval = setInterval(tick, 1000);
	}

	function stop() {
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
		isRunning = false;
	}

	function pause() {
		// Handled by isPaused callback
	}

	function resume() {
		// Handled by isPaused callback
	}

	return {
		get isRunning() { return isRunning; },
		start,
		stop,
		pause,
		resume
	};
}

export function createActiveSetTimer(
	duration: number,
	onTick: (elapsed: number, remaining: number) => void,
	onCountdown: () => void,
	onComplete: () => void,
	isPaused: () => boolean = () => false
) {
	let elapsed = 0;
	let interval: ReturnType<typeof setInterval> | null = null;
	let isRunning = false;
	let countdownPlayed = false;

	function tick() {
		if (isPaused()) return;
		
		elapsed++;
		const remaining = duration - elapsed;
		
		if (remaining <= 3 && remaining > 0 && !countdownPlayed) {
			onCountdown();
			countdownPlayed = true;
		}
		
		onTick(elapsed, remaining);
		
		if (elapsed >= duration) {
			stop();
			// Small delay to let countdown sound finish
			setTimeout(onComplete, 500);
		}
	}

	function start() {
		if (isRunning) return;
		isRunning = true;
		elapsed = 0;
		countdownPlayed = false;
		interval = setInterval(tick, 1000);
	}

	function stop() {
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
		isRunning = false;
		elapsed = 0;
		countdownPlayed = false;
	}

	function pause() {
		// Handled by isPaused callback
	}

	function resume() {
		// Handled by isPaused callback
	}

	return {
		get isRunning() { return isRunning; },
		get elapsed() { return elapsed; },
		start,
		stop,
		pause,
		resume
	};
}
