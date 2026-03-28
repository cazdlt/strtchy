export type SoundType = 'countdown' | 'setStart' | 'setComplete' | 'restStart' | 'restEnd' | 'switchSides' | 'practiceComplete' | 'rep';

export class AudioController {
	audioContext: AudioContext | null = null;
	isEnabled = false;

	constructor(enabled = false) {
		this.isEnabled = enabled;
	}

	ensureAudioContext(): AudioContext | null {
		if (!this.isEnabled) return null;
		
		if (!this.audioContext && 'AudioContext' in window) {
			this.audioContext = new AudioContext();
		}
		
		if (this.audioContext?.state === 'suspended') {
			this.audioContext.resume();
		}
		
		return this.audioContext;
	}

	setEnabled(enabled: boolean) {
		this.isEnabled = enabled;
		if (enabled && !this.audioContext) {
			this.ensureAudioContext();
		}
	}

	private playTone(freq: number, duration: number, delay: number = 0) {
		if (!this.audioContext) return;
		
		const oscillator = this.audioContext.createOscillator();
		const gainNode = this.audioContext.createGain();
		oscillator.connect(gainNode);
		gainNode.connect(this.audioContext.destination);
		oscillator.frequency.value = freq;
		oscillator.type = 'sine';
		
		const startTime = this.audioContext.currentTime + delay;
		gainNode.gain.setValueAtTime(0.15, startTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
		oscillator.start(startTime);
		oscillator.stop(startTime + duration);
	}

	play(type: SoundType) {
		if (!this.isEnabled) return;
		this.ensureAudioContext();
		if (!this.audioContext) return;

		switch (type) {
			case 'countdown':
				this.playTone(880, 0.1, 0);
				this.playTone(880, 0.1, 0.15);
				this.playTone(880, 0.1, 0.3);
				break;
			case 'setStart':
				this.playTone(660, 0.15);
				break;
			case 'setComplete':
				this.playTone(523, 0.1);
				this.playTone(659, 0.1, 0.1);
				this.playTone(784, 0.15, 0.2);
				break;
			case 'restStart':
				this.playTone(440, 0.2);
				this.playTone(330, 0.2, 0.2);
				break;
			case 'restEnd':
				this.playTone(523, 0.1);
				this.playTone(659, 0.15, 0.1);
				break;
			case 'switchSides':
				this.playTone(698, 0.12);
				this.playTone(880, 0.12, 0.12);
				this.playTone(1047, 0.2, 0.24);
				break;
			case 'practiceComplete':
				this.playTone(523, 0.1);
				this.playTone(659, 0.1, 0.1);
				this.playTone(784, 0.1, 0.2);
				this.playTone(1047, 0.3, 0.3);
				break;
			case 'rep':
				this.playTone(1200, 0.03);
				break;
		}
	}

	async playCountdown(): Promise<void> {
		this.play('countdown');
		await new Promise(r => setTimeout(r, 450));
	}
}

export function createAudioController(enabled = false): AudioController {
	return new AudioController(enabled);
}
