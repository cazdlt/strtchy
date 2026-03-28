import type { AudioController } from './audio';

export interface WakeLockManager {
	wakeLock: WakeLockSentinel | null;
	error: string | null;
	request(): Promise<void>;
	release(): void;
	reRequestOnInteraction(audio?: AudioController): void;
}

export function createWakeLockManager(enabled: boolean): WakeLockManager {
	let wakeLock: WakeLockSentinel | null = null;
	let error: string | null = null;

	async function request(): Promise<void> {
		if (!enabled || !('wakeLock' in navigator)) return;
		
		try {
			const lock = await navigator.wakeLock.request('screen');
			wakeLock = lock;
			error = null;
			
			lock.addEventListener('release', () => {
				wakeLock = null;
			});
		} catch (err) {
			console.error('Wake lock error:', err);
			error = 'Screen may turn off. Tap to re-enable.';
		}
	}

	function release() {
		if (wakeLock) {
			wakeLock.release();
			wakeLock = null;
		}
	}

	function reRequestOnInteraction(audio?: AudioController) {
		if (!enabled || wakeLock || !('wakeLock' in navigator)) return;
		
		navigator.wakeLock.request('screen').then((lock) => {
			wakeLock = lock;
			error = null;
			lock.addEventListener('release', () => {
				wakeLock = null;
			});
		}).catch((err) => {
			console.error('Wake lock re-request error:', err);
		});

		// Also ensure audio context is resumed on interaction
		if (audio) {
			audio.ensureAudioContext();
		}
	}

	return {
		get wakeLock() { return wakeLock; },
		get error() { return error; },
		request,
		release,
		reRequestOnInteraction
	};
}
