/** PracticeTimer — single source of truth for all practice intervals.
 *  Enforces: only ONE timer runs at a time (mutual exclusion).
 */
export type TimerState = 'idle' | 'duration' | 'activeSet' | 'rest' | 'switchSides';

export interface RestInfo {
  type: 'between-sets' | 'between-movements' | 'switch-sides' | 'get-ready';
  duration: number;
  remaining: number;
  nextMovementName?: string;
}

export interface ActiveSetInfo {
  duration: number;
  elapsed: number;
  remaining: number;
  isPaused: boolean;
}

export class PracticeTimer {
  // ── Reactive public state ──
  state = $state<TimerState>('idle');
  durationSeconds = $state(0);            // total practice duration
  restInfo = $state<RestInfo | null>(null);
  activeSetInfo = $state<ActiveSetInfo | null>(null);

  // ── Private interval refs ──
  #durationInterval: ReturnType<typeof setInterval> | null = null;
  #activeInterval: ReturnType<typeof setInterval> | null = null;
  #restInterval: ReturnType<typeof setInterval> | null = null;

  // ── Active set internals ──
  #activeSetElapsed = 0;
  #activeSetDuration = 0;
  #activeSetOnTick: ((elapsed: number, remaining: number) => void) | null = null;
  #activeSetOnComplete: (() => void) | null = null;
  #activeSetCountdownPlayed = false;

  // ── Rest internals ──
  #restRemaining = 0;
  #restDuration = 0;
  #restOnTick: ((remaining: number) => void) | null = null;
  #restOnComplete: (() => void) | null = null;

  // ── Pause ──
  #isPaused = false;

  // ── Duration timer (always runs once practice starts) ──
  startDuration() {
    if (this.#durationInterval) return;
    this.#durationInterval = setInterval(() => {
      if (!this.#isPaused) {
        this.durationSeconds++;
      }
    }, 1000);
    this.state = 'duration';
  }

  stopDuration() {
    if (this.#durationInterval) {
      clearInterval(this.#durationInterval);
      this.#durationInterval = null;
    }
  }

  // ── Active set timer (counts UP to duration) ──
  startActiveSet(
    duration: number,
    onTick: (elapsed: number, remaining: number) => void,
    onComplete: () => void,
  ) {
    this.stopAll(); // MUTUAL EXCLUSION

    this.#activeSetDuration = duration;
    this.#activeSetElapsed = 0;
    this.#activeSetOnTick = onTick;
    this.#activeSetOnComplete = onComplete;
    this.#activeSetCountdownPlayed = false;

    this.activeSetInfo = {
      duration,
      elapsed: 0,
      remaining: duration,
      isPaused: false,
    };

    this.state = 'activeSet';

    // Immediate tick
    onTick(0, duration);

    this.#activeInterval = setInterval(() => {
      if (this.#isPaused) return;

      this.#activeSetElapsed++;
      const remaining = this.#activeSetDuration - this.#activeSetElapsed;

      if (remaining <= 3 && remaining > 0 && !this.#activeSetCountdownPlayed) {
        this.#activeSetCountdownPlayed = true;
      }

      this.activeSetInfo = {
        duration: this.#activeSetDuration,
        elapsed: this.#activeSetElapsed,
        remaining,
        isPaused: false,
      };

      this.#activeSetOnTick?.(this.#activeSetElapsed, remaining);

      if (this.#activeSetElapsed >= this.#activeSetDuration) {
        this.stopActiveSet();
        // Small delay for audio finish
        setTimeout(() => this.#activeSetOnComplete?.(), 500);
      }
    }, 1000);
  }

  stopActiveSet() {
    if (this.#activeInterval) {
      clearInterval(this.#activeInterval);
      this.#activeInterval = null;
    }
    this.activeSetInfo = null;
    if (this.state === 'activeSet') {
      this.state = 'idle';
    }
  }

  resetActiveSet() {
    if (!this.activeSetInfo || this.#activeSetDuration <= 0) return;

    // Stop current interval
    if (this.#activeInterval) {
      clearInterval(this.#activeInterval);
      this.#activeInterval = null;
    }

    this.#activeSetElapsed = 0;
    this.#activeSetCountdownPlayed = false;

    this.activeSetInfo = {
      duration: this.#activeSetDuration,
      elapsed: 0,
      remaining: this.#activeSetDuration,
      isPaused: false,
    };

    this.#activeSetOnTick?.(0, this.#activeSetDuration);

    // Restart the interval from 0
    this.#activeInterval = setInterval(() => {
      if (this.#isPaused) return;

      this.#activeSetElapsed++;
      const remaining = this.#activeSetDuration - this.#activeSetElapsed;

      if (remaining <= 3 && remaining > 0 && !this.#activeSetCountdownPlayed) {
        this.#activeSetCountdownPlayed = true;
      }

      this.activeSetInfo = {
        duration: this.#activeSetDuration,
        elapsed: this.#activeSetElapsed,
        remaining,
        isPaused: false,
      };

      this.#activeSetOnTick?.(this.#activeSetElapsed, remaining);

      if (this.#activeSetElapsed >= this.#activeSetDuration) {
        this.stopActiveSet();
        setTimeout(() => this.#activeSetOnComplete?.(), 500);
      }
    }, 1000);
  }

  // ── Rest timer (counts DOWN) ──
  startRest(
    duration: number,
    type: 'between-sets' | 'between-movements' | 'switch-sides' | 'get-ready',
    nextMovementName: string = '',
    onTick?: (remaining: number) => void,
    onComplete?: () => void,
  ) {
    this.stopAll(); // MUTUAL EXCLUSION

    this.#restDuration = duration;
    this.#restRemaining = duration;
    this.#restOnTick = onTick ?? null;
    this.#restOnComplete = onComplete ?? null;

    this.restInfo = {
      type,
      duration,
      remaining: duration,
      nextMovementName,
    };

    this.state = type === 'switch-sides' ? 'switchSides' : 'rest';

    this.#restInterval = setInterval(() => {
      if (this.#isPaused) return;

      this.#restRemaining--;

      this.restInfo = {
        type,
        duration: this.#restDuration,
        remaining: this.#restRemaining,
        nextMovementName,
      };

      this.#restOnTick?.(this.#restRemaining);

      if (this.#restRemaining <= 0) {
        this.stopRest();
        this.#restOnComplete?.();
      }
    }, 1000);
  }

  stopRest() {
    if (this.#restInterval) {
      clearInterval(this.#restInterval);
      this.#restInterval = null;
    }
    this.restInfo = null;
    if (this.state === 'rest' || this.state === 'switchSides') {
      this.state = 'idle';
    }
  }

  skipRest() {
    this.stopRest();
    this.#restOnComplete?.();
  }

  // ── Pause / resume ──
  pause() {
    this.#isPaused = true;
    if (this.activeSetInfo) {
      this.activeSetInfo = { ...this.activeSetInfo, isPaused: true };
    }
  }

  resume() {
    this.#isPaused = false;
    if (this.activeSetInfo) {
      this.activeSetInfo = { ...this.activeSetInfo, isPaused: false };
    }
  }

  get isPaused() {
    return this.#isPaused;
  }

  // ── Emergency stop ALL ──
  stopAll() {
    this.stopActiveSet();
    this.stopRest();
  }

  // ── Full cleanup (practice end) ──
  cleanup() {
    this.stopDuration();
    this.stopAll();
    this.state = 'idle';
    this.durationSeconds = 0;
    this.#isPaused = false;
  }
}
