import { PracticeTimer } from './PracticeTimer.svelte';
import { createAudioController, type AudioController } from '$lib/utils/audio';

export type Side = 'left' | 'right' | null;

export interface MovementSnapshot {
  id: string;              // routineMovementId (ephemeral to this practice instance)
  movementId: string;
  name: string;
  type: 'timed' | 'reps' | 'weighted' | 'resistance_band';
  target: { type: 'time' | 'reps'; value: number; unit?: string };
  sets: number;
  isBilateral: boolean;
  switchSidesDuration: number;
  weight?: number | null;
  weightUnit?: string | null;
  timePerRep?: number | null;
  notes?: string | null;
  order: number;
}

export interface SetRecord {
  movementId: string;
  setNumber: number;
  side: Side;
  value: number;
  weight?: number | null;
  weightUnit?: string | null;
  rating?: number | null;
  status: 'completed' | 'skipped';
  completedAt: Date;
}

export interface PracticeSettings {
  autoPlay: boolean;
  audioEnabled: boolean;
  keepAwake: boolean;
}

function generateSetKey(movementId: string, setNumber: number, side: Side): string {
  return `${movementId}-${setNumber}-${side || 'none'}`;
}

export class PracticeSession {
  // ── Core state ──
  practiceId = $state<string>('');
  routineId = $state<string>('');
  hasStarted = $state(false);
  isCompleted = $state(false);
  movements = $state<MovementSnapshot[]>([]);

  completedSets = $state<Map<string, SetRecord>>(new Map());
  skippedSets = $state<Map<string, SetRecord>>(new Map());
  setRatings = $state<Map<string, number>>(new Map()); // movementId → rating

  currentMovementIndex = $state(0);
  settings = $state<PracticeSettings>({ autoPlay: false, audioEnabled: true, keepAwake: true });
  notes = $state<Map<string, string>>(new Map());

  // Routine settings snapshotted at practice start
  restBetweenSets = $state(15);
  restBetweenMovements = $state(30);

  // ── Timer ──
  timer = new PracticeTimer();

  // ── Audio ──
  audio = $state<AudioController | null>(null);

  // ── Async states ──
  isSaving = $state(false);
  saveError = $state<string | null>(null);

  // ── Derived ──
  totalSets = $derived(this.#calculateTotalSets());
  completedCount = $derived(this.completedSets.size + this.skippedSets.size);
  allComplete = $derived(this.completedCount >= this.totalSets && this.totalSets > 0);
  currentMovement = $derived(this.movements[this.currentMovementIndex] ?? null);
  progress = $derived(this.totalSets > 0 ? (this.completedCount / this.totalSets) * 100 : 0);
  nextIncompleteSet = $derived(this.#computeNextIncompleteSet());

  #calculateTotalSets(): number {
    return this.movements.reduce((sum, m) => {
      return sum + (m.isBilateral ? m.sets * 2 : m.sets);
    }, 0);
  }

  // ── Initialization ──
  loadFromRoutine(
    practiceId: string,
    routineId: string,
    routineMovements: MovementSnapshot[],
    routineRestSettings?: { restBetweenSets?: number; restBetweenMovements?: number },
    userSettings?: Partial<PracticeSettings>,
  ) {
    this.practiceId = practiceId;
    this.routineId = routineId;
    this.movements = routineMovements;
    this.restBetweenSets = routineRestSettings?.restBetweenSets ?? 15;
    this.restBetweenMovements = routineRestSettings?.restBetweenMovements ?? 30;
    this.settings = {
      autoPlay: userSettings?.autoPlay ?? false,
      audioEnabled: userSettings?.audioEnabled ?? true,
      keepAwake: userSettings?.keepAwake ?? true,
    };
    this.completedSets = new Map();
    this.skippedSets = new Map();
    this.setRatings = new Map();
    this.notes = new Map();
    this.currentMovementIndex = 0;
    this.hasStarted = false;
    this.isCompleted = false;
  }

  hydrateFromServer(rows: Array<{
    movementId: string;
    setNumber: number;
    side: Side;
    value: number;
    weight?: number | null;
    weightUnit?: string | null;
    rating?: number | null;
    status: 'completed' | 'skipped';
    completedAt: Date | string;
  }>) {
    for (const row of rows) {
      const key = generateSetKey(row.movementId, row.setNumber, row.side);
      const record: SetRecord = {
        movementId: row.movementId,
        setNumber: row.setNumber,
        side: row.side,
        value: row.value,
        weight: row.weight,
        weightUnit: row.weightUnit,
        rating: row.rating,
        status: row.status,
        completedAt: row.completedAt instanceof Date ? row.completedAt : new Date(row.completedAt),
      };
      if (row.status === 'skipped') {
        this.skippedSets.set(key, record);
      } else {
        this.completedSets.set(key, record);
      }
    }
    this.skippedSets = new Map(this.skippedSets);
    this.completedSets = new Map(this.completedSets);
    this.#syncCurrentIndexToNextIncomplete();
  }

  setAudio(audio: AudioController) {
    this.audio = audio;
  }

  // ── Practice lifecycle ──
  start() {
    if (this.hasStarted) return;
    this.hasStarted = true;
    this.timer.startDuration();
    const isFreshPractice = this.completedSets.size === 0 && this.skippedSets.size === 0;
    if (this.settings.autoPlay && isFreshPractice) {
      this.audio?.play('restStart');
      this.timer.startRest(
        15,
        'get-ready',
        this.movements[0]?.name || '',
        undefined,
        () => {
          this.audio?.play('restEnd');
          this.#checkAndStartTimer();
        },
        () => this.audio?.play('countdown'),
      );
    }
  }

  togglePause() {
    if (this.timer.isPaused) {
      this.timer.resume();
    } else {
      this.timer.pause();
    }
  }

  completeWorkout() {
    this.isCompleted = true;
    this.audio?.play('practiceComplete');
    this.timer.cleanup();
    return this.#toServerData();
  }

  // ── Set operations ──
  completeSet(
    movementId: string,
    setNumber: number,
    side: Side,
    value: number,
    opts?: { weight?: number | null; weightUnit?: string | null; rating?: number | null },
  ) {
    const key = generateSetKey(movementId, setNumber, side);
    const record: SetRecord = {
      movementId,
      setNumber,
      side,
      value,
      weight: opts?.weight,
      weightUnit: opts?.weightUnit,
      rating: opts?.rating,
      status: 'completed',
      completedAt: new Date(),
    };
    this.skippedSets.delete(key);
    this.completedSets.set(key, record);
    this.completedSets = new Map(this.completedSets);
    this.skippedSets = new Map(this.skippedSets);

    if (this.settings.autoPlay) {
      this.#handleAutoAdvance(movementId, setNumber, side);
    } else {
      this.#syncCurrentIndexToNextIncomplete();
    }
  }

  skipSet(movementId: string, setNumber: number, side: Side) {
    const key = generateSetKey(movementId, setNumber, side);
    const record: SetRecord = {
      movementId,
      setNumber,
      side,
      value: 0,
      status: 'skipped',
      completedAt: new Date(),
    };
    this.completedSets.delete(key);
    this.skippedSets.set(key, record);
    this.skippedSets = new Map(this.skippedSets);
    this.completedSets = new Map(this.completedSets);

    if (this.settings.autoPlay) {
      this.#handleAutoAdvance(movementId, setNumber, side);
    } else {
      this.#syncCurrentIndexToNextIncomplete();
    }
  }

  uncompleteSet(movementId: string, setNumber: number, side: Side) {
    const key = generateSetKey(movementId, setNumber, side);
    this.completedSets.delete(key);
    this.skippedSets.delete(key);
    this.completedSets = new Map(this.completedSets);
    this.skippedSets = new Map(this.skippedSets);
    this.#syncCurrentIndexToNextIncomplete();
  }

  // ── Auto-advance logic ──
  #handleAutoAdvance(movementId: string, setNumber: number, side: Side) {
    const movement = this.movements.find((m) => m.id === movementId);
    if (!movement) return;

    // Check if bilateral and just completed left side
    if (movement.isBilateral && side === 'left') {
      const rightKey = generateSetKey(movementId, setNumber, 'right');
      if (!this.completedSets.has(rightKey) && !this.skippedSets.has(rightKey)) {
        if (movement.switchSidesDuration > 0) {
          this.audio?.play('switchSides');
          this.timer.startRest(
            movement.switchSidesDuration,
            'switch-sides',
            movement.name,
            undefined,
            () => {
              this.audio?.play('restEnd');
              this.#syncCurrentIndexToNextIncomplete();
              this.#checkAndStartTimer();
            },
            () => this.audio?.play('countdown'),
          );
        } else {
          this.#syncCurrentIndexToNextIncomplete();
          this.#checkAndStartTimer();
        }
        return;
      }
    }

    // Check if more sets in this movement
    const totalForMovement = movement.isBilateral ? movement.sets * 2 : movement.sets;
    const completedForMovement = this.#countCompletedForMovement(movementId);
    if (completedForMovement < totalForMovement) {
      // More sets in same movement — rest between sets
      if (this.restBetweenSets > 0) {
        this.audio?.play('restStart');
        this.timer.startRest(
          this.restBetweenSets,
          'between-sets',
          movement.name,
          undefined,
          () => {
            this.audio?.play('restEnd');
            this.#syncCurrentIndexToNextIncomplete();
            this.#checkAndStartTimer();
          },
          () => this.audio?.play('countdown'),
        );
      } else {
        this.#syncCurrentIndexToNextIncomplete();
        this.#checkAndStartTimer();
      }
      return;
    }

    // Movement complete — advance to next
    const currentIdx = this.movements.findIndex((m) => m.id === movementId);
    if (currentIdx < this.movements.length - 1) {
      const nextMovement = this.movements[currentIdx + 1];
      if (this.restBetweenMovements > 0) {
        this.audio?.play('restStart');
        this.timer.startRest(
          this.restBetweenMovements,
          'between-movements',
          nextMovement.name,
          undefined,
          () => {
            this.audio?.play('restEnd');
            this.currentMovementIndex = currentIdx + 1;
            this.#checkAndStartTimer();
          },
          () => this.audio?.play('countdown'),
        );
      } else {
        this.currentMovementIndex = currentIdx + 1;
        this.#checkAndStartTimer();
      }
    }
  }

  #countCompletedForMovement(movementId: string): number {
    let count = 0;
    for (const key of this.completedSets.keys()) {
      if (key.startsWith(`${movementId}-`)) count++;
    }
    for (const key of this.skippedSets.keys()) {
      if (key.startsWith(`${movementId}-`)) count++;
    }
    return count;
  }

  #syncCurrentIndexToNextIncomplete() {
    const next = this.findNextIncompleteSet();
    if (next) {
      this.currentMovementIndex = next.movementIndex;
    } else if (this.movements.length > 0) {
      this.currentMovementIndex = this.movements.length - 1;
    }
  }

  #computeNextIncompleteSet(): {
    movementIndex: number;
    movementId: string;
    setNumber: number;
    side: Side;
  } | null {
    for (let i = 0; i < this.movements.length; i++) {
      const m = this.movements[i];
      const total = m.isBilateral ? m.sets * 2 : m.sets;
      for (let j = 1; j <= total; j++) {
        const side: Side = m.isBilateral ? (j % 2 === 1 ? 'left' : 'right') : null;
        const setNumber = m.isBilateral ? Math.ceil(j / 2) : j;
        const key = generateSetKey(m.id, setNumber, side);
        if (!this.completedSets.has(key) && !this.skippedSets.has(key)) {
          return { movementIndex: i, movementId: m.id, setNumber, side };
        }
      }
    }
    return null;
  }

  findNextIncompleteSet() {
    return this.nextIncompleteSet;
  }

  isSetActive(movementId: string, setNumber: number, side: Side): boolean {
    if (!this.hasStarted || this.isCompleted || this.timer.isPaused || this.timer.state === 'rest' || this.timer.state === 'switchSides') return false;
    const next = this.findNextIncompleteSet();
    if (!next) return false;
    return (
      next.movementId === movementId &&
      next.setNumber === setNumber &&
      next.side === side
    );
  }

  isSetCompleted(movementId: string, setNumber: number, side: Side): boolean {
    return this.completedSets.has(generateSetKey(movementId, setNumber, side));
  }

  isSetSkipped(movementId: string, setNumber: number, side: Side): boolean {
    return this.skippedSets.has(generateSetKey(movementId, setNumber, side));
  }

  getSetRecord(movementId: string, setNumber: number, side: Side): SetRecord | undefined {
    return this.completedSets.get(generateSetKey(movementId, setNumber, side));
  }

  // ── Timer integration ──
  #checkAndStartTimer() {
    if (!this.settings.autoPlay || !this.hasStarted || this.isCompleted || this.timer.isPaused) {
      this.timer.stopAll();
      return;
    }

    const next = this.findNextIncompleteSet();
    if (!next) {
      this.timer.stopAll();
      return;
    }

    const movement = this.movements[next.movementIndex];
    if (!movement) return;

    if (movement.type === 'timed' && movement.target.value > 0) {
      this.audio?.play('setStart');
      this.timer.startActiveSet(
        movement.target.value,
        () => {}, // UI reads from timer.activeSetInfo
        () => {
          this.audio?.play('setComplete');
          this.completeSet(next.movementId, next.setNumber, next.side, movement.target.value);
        },
        () => this.audio?.play('countdown'),
      );
    }
  }

  resetActiveSetTimer() {
    this.timer.resetActiveSet();
  }

  toggleActiveSetTimerPaused() {
    this.togglePause();
  }

  skipCurrentSet() {
    const next = this.findNextIncompleteSet();
    if (next) {
      this.skipSet(next.movementId, next.setNumber, next.side);
    }
  }

  skipRest() {
    this.timer.skipRest();
  }

  // ── Structural changes (local only, sync to server later) ──
  addMovement(movement: MovementSnapshot) {
    this.movements = [...this.movements, movement];
    this.movements = this.movements.map((m, i) => ({ ...m, order: i }));
  }

  removeMovement(movementId: string) {
    // Remove any completed sets for this movement
    const completedToDelete = Array.from(this.completedSets.keys()).filter((k) =>
      k.startsWith(`${movementId}-`)
    );
    for (const key of completedToDelete) this.completedSets.delete(key);

    const skippedToDelete = Array.from(this.skippedSets.keys()).filter((k) =>
      k.startsWith(`${movementId}-`)
    );
    for (const key of skippedToDelete) this.skippedSets.delete(key);

    this.movements = this.movements.filter((m) => m.id !== movementId);
    this.movements = this.movements.map((m, i) => ({ ...m, order: i }));
    this.completedSets = new Map(this.completedSets);
    this.skippedSets = new Map(this.skippedSets);
    this.#syncCurrentIndexToNextIncomplete();
  }

  reorderMovement(movementId: string, direction: 'up' | 'down') {
    const idx = this.movements.findIndex((m) => m.id === movementId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= this.movements.length) return;

    const next = [...this.movements];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    this.movements = next.map((m, i) => ({ ...m, order: i }));
  }

  adjustSets(movementId: string, delta: number) {
    const idx = this.movements.findIndex((m) => m.id === movementId);
    if (idx === -1) return;
    const movement = this.movements[idx];
    const newSets = Math.max(1, movement.sets + delta);
    this.movements = this.movements.map((m, i) =>
      i === idx ? { ...m, sets: newSets } : m,
    );
  }

  updateNotes(movementId: string, note: string) {
    this.notes.set(movementId, note);
    this.notes = new Map(this.notes);
  }

  // ── Serialization ──
  toJSON(): object {
    return {
      practiceId: this.practiceId,
      routineId: this.routineId,
      hasStarted: this.hasStarted,
      isCompleted: this.isCompleted,
      movements: this.movements,
      completedSets: Array.from(this.completedSets.entries()),
      skippedSets: Array.from(this.skippedSets.entries()),
      setRatings: Array.from(this.setRatings.entries()),
      currentMovementIndex: this.currentMovementIndex,
      settings: this.settings,
      notes: Array.from(this.notes.entries()),
      timerDuration: this.timer.durationSeconds,
      restBetweenSets: this.restBetweenSets,
      restBetweenMovements: this.restBetweenMovements,
    };
  }

  fromJSON(data: object) {
    const d = data as any;
    this.practiceId = d.practiceId ?? '';
    this.routineId = d.routineId ?? '';
    this.hasStarted = d.hasStarted ?? false;
    this.isCompleted = d.isCompleted ?? false;
    this.movements = d.movements ?? [];
    this.restBetweenSets = d.restBetweenSets ?? 15;
    this.restBetweenMovements = d.restBetweenMovements ?? 30;
    this.completedSets = new Map(d.completedSets ?? []);
    this.skippedSets = new Map(d.skippedSets ?? []);
    this.setRatings = new Map(d.setRatings ?? []);
    this.currentMovementIndex = d.currentMovementIndex ?? 0;
    this.settings = d.settings ?? this.settings;
    this.notes = new Map(d.notes ?? []);
    // Restore duration
    this.timer.durationSeconds = d.timerDuration ?? 0;
    if (this.hasStarted && !this.isCompleted) {
      this.timer.startDuration();
    }
  }

  saveToStorage() {
    if (!this.practiceId) return;
    try {
      localStorage.setItem(`strtchy-practice-${this.practiceId}`, JSON.stringify(this.toJSON()));
    } catch {
      // Ignore storage errors
    }
  }

  static tryRestoreFromStorage(practiceId: string): object | null {
    try {
      const raw = localStorage.getItem(`strtchy-practice-${practiceId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  clearStorage() {
    if (!this.practiceId) return;
    try {
      localStorage.removeItem(`strtchy-practice-${this.practiceId}`);
    } catch {
      // Ignore
    }
  }

  // ── Server sync helpers ──
  #toServerData() {
    const practiceData: Array<{
      movementId: string;
      movementName: string;
      movementType: string;
      targetType: string;
      targetValue: number;
      order: number;
      setNumber: number;
      side: Side;
      value: number;
      weight?: number | null;
      weightUnit?: string | null;
      rating?: number | null;
      status: 'completed' | 'skipped';
    }> = [];

    for (const [key, record] of this.completedSets) {
      const movement = this.movements.find((m) => m.id === record.movementId);
      if (!movement) continue;
      practiceData.push({
        movementId: movement.movementId,
        movementName: movement.name,
        movementType: movement.type,
        targetType: movement.target.type,
        targetValue: movement.target.value,
        order: movement.order,
        setNumber: record.setNumber,
        side: record.side,
        value: record.value,
        weight: record.weight,
        weightUnit: record.weightUnit,
        rating: record.rating,
        status: 'completed',
      });
    }

    for (const [key, record] of this.skippedSets) {
      const movement = this.movements.find((m) => m.id === record.movementId);
      if (!movement) continue;
      practiceData.push({
        movementId: movement.movementId,
        movementName: movement.name,
        movementType: movement.type,
        targetType: movement.target.type,
        targetValue: movement.target.value,
        order: movement.order,
        setNumber: record.setNumber,
        side: record.side,
        value: record.value,
        weight: record.weight,
        weightUnit: record.weightUnit,
        rating: record.rating,
        status: 'skipped',
      });
    }

    return {
      duration: this.timer.durationSeconds,
      practiceData,
    };
  }
}
