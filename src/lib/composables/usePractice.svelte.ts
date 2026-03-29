import { createAudioController, type AudioController } from "$lib/utils/audio";
import {
  createWakeLockManager,
  type WakeLockManager,
} from "$lib/utils/wakeLock";
import {
  createCountdownTimer,
  createIntervalTimer,
  createActiveSetTimer,
  type TimerController,
} from "$lib/utils/timers";
import {
  generateSetKey,
  findNextIncompleteSet,
  calculateTotalSets,
  isAllSetsComplete,
  countCompletedMovementSets,
  scrollAndHighlightSet,
  scrollToElement,
  type Side,
  type IncompleteSetInfo,
} from "$lib/utils/practiceHelpers";
import { invalidate } from "$app/navigation";
import { goto } from "$app/navigation";

// Types
export interface PracticeSettings {
  autoPlay: boolean;
  audioEnabled: boolean;
  keepAwake: boolean;
}

export interface CompleteSetData {
  setNumber: number;
  side: Side;
  movementIndex: number;
  value: number;
  weight?: number | null;
  weightUnit?: string | null;
  rating?: number;
  skipped?: boolean;
}

export interface UncompleteSetData {
  setNumber: number;
  side: Side;
  routineMovementId: string;
}

export interface MovementData {
  id: string;
  sets: number;
  isBilateral: boolean;
  movement: {
    name: string;
    type: string;
  };
  target: {
    type: "time" | "reps";
    value: number;
  };
  weight?: number | null;
  weightUnit?: string | null;
  notes?: string | null;
}

export interface PracticeData {
  id: string;
  routineId: string;
  startedAt: Date;
  completedAt?: Date | null;
  duration?: number | null;
  notes?: string | null;
  routine: {
    name: string;
    autoAdvance?: boolean | null;
    audioEnabled?: boolean | null;
    keepAwake?: boolean | null;
    restBetweenSets: number;
    restBetweenMovements: number;
  };
  practiceData: Array<{
    routineMovementId: string;
    setNumber: number;
    side: Side;
    value: number;
    status?: "completed" | "skipped";
  }>;
  setOverrides?: Record<string, number> | null;
}

export interface PageData {
  practice: PracticeData;
  allRoutineMovements: MovementData[];
  isReadOnly: boolean;
  userPrefs?: {
    autoAdvance?: boolean;
    audioEnabled?: boolean;
    keepAwake?: boolean;
  };
  setOverrides?: Record<string, number>;
}

export function usePractice(data: PageData) {
  // Core state
  let practiceId = $state(data.practice.id);
  let routineId = $state(data.practice.routineId);
  let hasStarted = $state(false);
  let isPaused = $state(false);
  let isReadOnly = $state(data.isReadOnly);

  // Settings
  let settings = $state<PracticeSettings>({
    autoPlay:
      data.practice.routine.autoAdvance ?? data.userPrefs?.autoAdvance ?? false,
    audioEnabled:
      data.practice.routine.audioEnabled ??
      data.userPrefs?.audioEnabled ??
      true,
    keepAwake:
      data.practice.routine.keepAwake ?? data.userPrefs?.keepAwake ?? true,
  });

  // Set tracking
  let completedSets = $state<Set<string>>(new Set());
  let skippedSets = $state<Set<string>>(new Set());
  let completedValues = $state<Record<string, number>>({});
  let setOverrides = $state<Record<string, number>>(data.setOverrides || {});
  let movementNotes = $state<Record<string, string>>({});

  // Navigation
  let activeMovementIndex = $state(0);

  // Duration
  let duration = $state(0);

  // Rest timer state
  let showRestTimer = $state(false);
  let restType = $state<"between-sets" | "between-movements" | "switch-sides">(
    "between-sets",
  );
  let nextExerciseName = $state("");
  let restingMovementIndex = $state(-1);
  let activeRestSetNumber = $state<number | null>(null);
  let activeRestSide = $state<"left" | "right" | null>(null);
  let restTimerValue = $state(0);
  let restDurationValue = $state(0);
  let isRestTimerRunning = $state(false);

  // Active set timer state
  let activeSetTimerValue = $state(0);
  let activeSetTimerDuration = $state(0);
  let activeSetTimerPaused = $state(false);
  let currentActiveSetKey = $state<string | null>(null);

  // Async states
  let isCompletingSet = $state(false);
  let isCompletingWorkout = $state(false);
  let isSavingSettings = $state(false);
  let settingsError = $state<string | null>(null);
  let isAutoCompletingSet = $state(false);
  let isAutoAdvancing = $state(false);
  let isAdjustingSets = $state<Record<string, boolean>>({});
  let isReordering = $state<Record<string, boolean>>({});
  let isRemoving = $state<Record<string, boolean>>({});
  let isAddingMovement = $state(false);
  let notesSavingStates = $state<Record<string, boolean>>({});

  // Utilities
  let audio = $state<AudioController>(
    createAudioController(settings.audioEnabled),
  );
  let wakeLockManager = $state<WakeLockManager>(
    createWakeLockManager(settings.keepAwake),
  );

  // Timer controllers
  let durationTimer: ReturnType<typeof createIntervalTimer> | null = null;
  let restTimer: ReturnType<typeof createCountdownTimer> | null = null;
  let activeSetTimer: ReturnType<typeof createActiveSetTimer> | null = null;

  // Timeout refs
  let notesTimeout: ReturnType<typeof setTimeout> | null = null;

  // Initialization tracking
  let isInitialized = $state(false);

  // Derived values
  let totalSets = $derived(
    calculateTotalSets(data.allRoutineMovements, setOverrides),
  );
  let completedSetsCount = $derived(completedSets.size + skippedSets.size);
  let allSetsComplete = $derived(
    isAllSetsComplete(
      data.allRoutineMovements,
      completedSets,
      skippedSets,
      setOverrides,
    ),
  );
  let activeMovement = $derived(data.allRoutineMovements[activeMovementIndex]);
  let isInRestPeriod = $derived(showRestTimer);
  let progress = $derived(
    totalSets > 0 ? (completedSetsCount / totalSets) * 100 : 0,
  );

  // Initialize from existing practice data (called once on mount)
  function initializeFromPracticeData() {
    for (const pd of data.practice.practiceData) {
      const key = generateSetKey(pd.routineMovementId, pd.setNumber, pd.side);
      if (pd.status === "skipped") {
        skippedSets.add(key);
      } else {
        completedSets.add(key);
        completedValues[key] = pd.value;
      }
    }
    completedSets = new Set(completedSets);
    skippedSets = new Set(skippedSets);

    // Initialize notes from movements
    for (const rm of data.allRoutineMovements) {
      if (rm.notes) {
        movementNotes[rm.id] = rm.notes;
      }
    }
  }

  // Cleanup
  function cleanup() {
    durationTimer?.stop();
    restTimer?.stop();
    activeSetTimer?.stop();
    wakeLockManager.release();
    if (notesTimeout) clearTimeout(notesTimeout);
  }

  // Start practice
  function startPractice(playStartSound = true) {
    // Set hasStarted FIRST before any other operations
    hasStarted = true;

    // Small delay to ensure state update is processed
    setTimeout(() => {
      if (settings.keepAwake) {
        wakeLockManager.request();
      }

      durationTimer = createIntervalTimer(
        () => {
          duration++;
        },
        () => isPaused,
      );
      durationTimer.start();

      // Start initial rest if auto-play is enabled
      if (settings.autoPlay && data.practice.routine.restBetweenMovements > 0) {
        const firstMovement = data.allRoutineMovements[0];
        if (firstMovement) {
          startRestTimer(
            data.practice.routine.restBetweenMovements,
            "between-movements",
            firstMovement.movement.name,
          );
        }
      }

      if (playStartSound) {
        audio.play("setStart");
      }
    }, 0);
  }

  // Handle user interaction (for wake lock re-request)
  function handleUserInteraction() {
    wakeLockManager.reRequestOnInteraction(audio);
  }

  // Update settings
  function updateSettings(newSettings: PracticeSettings) {
    settings = newSettings;
    audio.setEnabled(newSettings.audioEnabled);

    if (hasStarted) {
      if (newSettings.keepAwake) {
        wakeLockManager.request();
      } else {
        wakeLockManager.release();
      }
    }
  }

  // Check and start active set timer
  function checkAndStartActiveSetTimer() {
    if (
      !hasStarted ||
      !settings.autoPlay ||
      isReadOnly ||
      isAutoCompletingSet ||
      isAutoAdvancing ||
      isRestTimerRunning
    ) {
      stopActiveSetTimer();
      return;
    }

    const nextSet = findNextIncompleteSet(
      data.allRoutineMovements,
      completedSets,
      skippedSets,
      setOverrides,
    );
    if (!nextSet) {
      stopActiveSetTimer();
      return;
    }

    const rm = data.allRoutineMovements[nextSet.movementIndex];
    if (rm.target.type === "time" && rm.target.value > 0) {
      const key = generateSetKey(rm.id, nextSet.setNumber, nextSet.side);

      if (currentActiveSetKey !== key) {
        audio.play("setStart");
        audio.playCountdown();

        activeSetTimer = createActiveSetTimer(
          rm.target.value,
          (elapsed, remaining) => {
            activeSetTimerValue = elapsed;
            activeSetTimerDuration = rm.target.value;
          },
          () => audio.playCountdown(),
          async () => {
            audio.play("setComplete");
            isAutoCompletingSet = true;
            await completeSet({
              setNumber: nextSet.setNumber,
              side: nextSet.side,
              movementIndex: nextSet.movementIndex,
              value: rm.target.value,
              weight: rm.weight,
              rating: 0,
            });
            isAutoCompletingSet = false;
            currentActiveSetKey = null;
          },
          () => isPaused || activeSetTimerPaused,
        );
        activeSetTimer.start();
        currentActiveSetKey = key;
      }
    }
  }

  function stopActiveSetTimer() {
    activeSetTimer?.stop();
    activeSetTimerValue = 0;
    activeSetTimerDuration = 0;
    activeSetTimerPaused = false;
    currentActiveSetKey = null;
  }

  function toggleActiveSetTimerPaused() {
    activeSetTimerPaused = !activeSetTimerPaused;
  }

  function resetActiveSetTimer() {
    if (activeSetTimer?.isRunning && activeSetTimerDuration > 0) {
      activeSetTimerValue = 0;
      activeSetTimerPaused = false;
    }
  }

  // Complete a set
  async function completeSet(setData: CompleteSetData) {
    const { setNumber, side, movementIndex, skipped = false } = setData;

    isCompletingSet = true;
    stopActiveSetTimer();

    const rm = data.allRoutineMovements[movementIndex];

    const formData = new FormData();
    formData.append("routineMovementId", rm.id);
    formData.append("setNumber", setNumber.toString());
    formData.append("value", setData.value.toString());
    formData.append("measurementType", rm.target.type);
    formData.append("status", skipped ? "skipped" : "completed");

    if (side) formData.append("side", side);
    if (setData.weight) {
      formData.append("weight", setData.weight.toString());
      formData.append("weightUnit", rm.weightUnit || "kg");
    }
    if (setData.rating) formData.append("rating", setData.rating.toString());

    const response = await fetch("?/completeSet", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("Failed to complete set:", await response.text());
      alert("Failed to save set. Please try again.");
      isCompletingSet = false;
      return;
    }

    const key = generateSetKey(rm.id, setNumber, side);
    if (skipped) {
      skippedSets.add(key);
      skippedSets = new Set(skippedSets);
    } else {
      completedSets.add(key);
      completedSets = new Set(completedSets);
      completedValues[key] = setData.value;
    }
    currentActiveSetKey = null;
    audio.play("setComplete");

    if (settings.autoPlay) {
      handleAutoPlay(rm, setNumber, side, movementIndex);
    }

    isCompletingSet = false;
  }

  // Uncomplete a set
  async function uncompleteSet(setData: UncompleteSetData) {
    const { setNumber, side, routineMovementId } = setData;

    isCompletingSet = true;

    const formData = new FormData();
    formData.append("routineMovementId", routineMovementId);
    formData.append("setNumber", setNumber.toString());
    if (side) formData.append("side", side);

    const response = await fetch("?/uncompleteSet", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const key = generateSetKey(routineMovementId, setNumber, side);
      completedSets.delete(key);
      skippedSets.delete(key);
      delete completedValues[key];
      completedSets = new Set(completedSets);
      skippedSets = new Set(skippedSets);
      currentActiveSetKey = null;
      scrollToNextIncompleteSet();
    }

    isCompletingSet = false;
  }

  // Skip current set (for auto-play)
  async function skipSet() {
    if (!settings.autoPlay) return;

    const nextSet = findNextIncompleteSet(
      data.allRoutineMovements,
      completedSets,
      skippedSets,
      setOverrides,
    );
    if (nextSet) {
      const rm = data.allRoutineMovements[nextSet.movementIndex];
      await completeSet({
        setNumber: nextSet.setNumber,
        side: nextSet.side,
        movementIndex: nextSet.movementIndex,
        value: 0,
        weight: rm.weight,
        rating: 0,
        skipped: true,
      });
    }
  }

  // Handle auto-play logic
  function handleAutoPlay(
    rm: MovementData,
    setNumber: number,
    side: Side,
    movementIndex: number,
  ) {
    isAutoAdvancing = true;

    // Check if this was a bilateral left side
    if (rm.isBilateral && side === "left") {
      const nextSideKey = generateSetKey(rm.id, setNumber, "right");
      if (!completedSets.has(nextSideKey) && !skippedSets.has(nextSideKey)) {
        // Switch sides duration from movement settings (if available)
        const switchDuration = 5; // Default, should come from rm
        if (switchDuration > 0) {
          isAutoAdvancing = false;
          startRestTimer(
            switchDuration,
            "switch-sides",
            rm.movement.name,
            movementIndex,
            setNumber,
            "left",
          );
          return;
        }
      }
    }

    // Calculate total sets for this movement
    const actualSets = setOverrides[rm.id] ?? rm.sets;
    const movementTotalSets = rm.isBilateral ? actualSets * 2 : actualSets;
    const movementCompletedSets = countCompletedMovementSets(
      rm.id,
      completedSets,
      skippedSets,
    );

    // Check if all sets for this movement are complete
    if (movementCompletedSets < movementTotalSets) {
      // More sets remaining in this movement
      if (data.practice.routine.restBetweenSets > 0) {
        startRestTimer(
          data.practice.routine.restBetweenSets,
          "between-sets",
          rm.movement.name,
          movementIndex,
          setNumber,
        );
      } else {
        scrollToNextIncompleteSet();
      }
    } else {
      // All sets complete, move to next movement
      if (activeMovementIndex < data.allRoutineMovements.length - 1) {
        if (data.practice.routine.restBetweenMovements > 0) {
          const nextMovement =
            data.allRoutineMovements[activeMovementIndex + 1];
          startRestTimer(
            data.practice.routine.restBetweenMovements,
            "between-movements",
            nextMovement.movement.name,
            movementIndex,
          );
        } else {
          scrollToNextIncompleteSet();
        }
      }
    }

    isAutoAdvancing = false;
  }

  // Start rest timer
  function startRestTimer(
    duration: number,
    type: "between-sets" | "between-movements" | "switch-sides",
    nextName: string,
    movementIndex?: number,
    setNumber?: number,
    side?: "left" | "right" | null,
  ) {
    restDurationValue = duration;
    restType = type;
    nextExerciseName = nextName;
    showRestTimer = true;
    isRestTimerRunning = true;
    restingMovementIndex = movementIndex ?? -1;
    activeRestSetNumber = setNumber ?? null;
    activeRestSide = side ?? null;

    if (type === "switch-sides") {
      audio.play("switchSides");
    } else {
      audio.play("restStart");
    }

    restTimer = createCountdownTimer(
      duration,
      (remaining, progress) => {
        restTimerValue = remaining;
        if (remaining === 3) {
          audio.playCountdown();
        }
      },
      () => {
        finishRest();
      },
      () => isPaused,
    );
    restTimer.start();

    scrollToElement("active-rest-timer");
  }

  // Finish rest
  function finishRest() {
    restTimer?.stop();
    isRestTimerRunning = false;
    audio.play("restEnd");
    showRestTimer = false;
    restType = "between-sets";
    restingMovementIndex = -1;
    activeRestSetNumber = null;
    activeRestSide = null;
    scrollToNextIncompleteSet();
  }

  // Skip rest
  function skipRest() {
    finishRest();
  }

  // Scroll to next incomplete set
  function scrollToNextIncompleteSet() {
    const nextSet = findNextIncompleteSet(
      data.allRoutineMovements,
      completedSets,
      skippedSets,
      setOverrides,
    );

    if (nextSet) {
      activeMovementIndex = nextSet.movementIndex;
      scrollAndHighlightSet(
        nextSet.routineMovementId,
        nextSet.setNumber,
        nextSet.side,
      );
      audio.play("setStart");
    } else {
      // If all complete, stay on last movement
      activeMovementIndex = data.allRoutineMovements.length - 1;
    }
  }

  // Check if movement is active
  function isMovementActive(index: number): boolean {
    return index === activeMovementIndex && !isReadOnly && hasStarted;
  }

  // Movement notes
  function updateMovementNotes(routineMovementId: string, notes: string) {
    movementNotes[routineMovementId] = notes;
    notesSavingStates[routineMovementId] = true;

    if (notesTimeout) clearTimeout(notesTimeout);

    notesTimeout = setTimeout(async () => {
      const formData = new FormData();
      formData.append("routineMovementId", routineMovementId);
      formData.append("notes", notes);

      await fetch("?/updateMovementNotes", {
        method: "POST",
        body: formData,
      });

      notesSavingStates[routineMovementId] = false;
    }, 1000);
  }

  // Adjust sets
  async function adjustSets(
    routineMovementId: string,
    direction: "up" | "down",
  ) {
    isAdjustingSets[routineMovementId] = true;

    const formData = new FormData();
    formData.append("routineMovementId", routineMovementId);
    formData.append("direction", direction);

    const response = await fetch("?/adjustSets", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const rm = data.allRoutineMovements.find(
        (m) => m.id === routineMovementId,
      );
      if (rm) {
        const current = setOverrides[routineMovementId] ?? rm.sets;
        setOverrides[routineMovementId] =
          direction === "up" ? current + 1 : Math.max(1, current - 1);
      }
    } else {
      const errorData = await response.json();
      alert(errorData.error || "Failed to adjust sets");
    }

    isAdjustingSets[routineMovementId] = false;
  }

  // Reorder movement
  async function reorderMovement(
    routineMovementId: string,
    direction: "up" | "down",
  ) {
    isReordering[routineMovementId] = true;
    isPaused = true;

    const formData = new FormData();
    formData.append("routineMovementId", routineMovementId);
    formData.append("direction", direction);

    const response = await fetch("?/reorderMovement", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      await invalidate("app:practice");
      isReordering[routineMovementId] = false;

      requestAnimationFrame(() => {
        const element = document.getElementById(
          `movement-${routineMovementId}`,
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    } else {
      isPaused = false;
      alert("Failed to reorder movement");
      isReordering[routineMovementId] = false;
    }
  }

  // Remove movement
  async function removeMovement(routineMovementId: string) {
    if (!confirm("Remove this movement from the routine?")) return;

    isRemoving[routineMovementId] = true;
    isPaused = true;

    const formData = new FormData();
    formData.append("routineMovementId", routineMovementId);

    const response = await fetch("?/removeMovement", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      await invalidate("app:practice");
      isRemoving[routineMovementId] = false;
    } else {
      isPaused = false;
      alert("Failed to remove movement");
      isRemoving[routineMovementId] = false;
    }
  }

  // Add movement
  async function addMovement(movementId: string) {
    isAddingMovement = true;
    isPaused = true;

    const formData = new FormData();
    formData.append("movementId", movementId);

    const response = await fetch("?/addMovement", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      await invalidate("app:practice");
      isAddingMovement = false;
    } else {
      isPaused = false;
      alert("Failed to add movement");
      isAddingMovement = false;
    }
  }

  // Update practice settings
  async function saveSettings(newSettings: PracticeSettings) {
    isSavingSettings = true;
    settingsError = null;

    try {
      const formData = new FormData();
      formData.append("autoPlay", newSettings.autoPlay.toString());
      formData.append("audioEnabled", newSettings.audioEnabled.toString());
      formData.append("keepAwake", newSettings.keepAwake.toString());
      formData.append("practiceId", practiceId);

      const response = await fetch("?/updatePracticeSettings", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        updateSettings(newSettings);
      } else {
        settingsError = "Failed to save settings";
      }
    } catch {
      settingsError = "Failed to save settings";
    } finally {
      isSavingSettings = false;
    }
  }

  // Exit practice
  function exit() {
    if (confirm("Exit practice? Your progress so far is saved.")) {
      cleanup();
      if (isReadOnly) {
        goto(`/routine/${routineId}`);
      } else {
        goto("/");
      }
    }
  }

  // Complete workout
  async function completeWorkout() {
    if (!confirm("Complete workout?")) return;

    isCompletingWorkout = true;
    audio.play("practiceComplete");

    await fetch("?/completePractice", {
      method: "POST",
      body: new FormData(),
    });

    goto(`/practice/${practiceId}/summary`);
  }

  // Toggle pause
  function togglePause() {
    isPaused = !isPaused;
  }

  // Play rep sound
  function playRepSound() {
    audio.play("rep");
  }

  // Initialize on mount
  $effect(() => {
    if (isInitialized) return;

    initializeFromPracticeData();
    isInitialized = true;

    // Auto-start if practice has already started (has existing data)
    if (data.practice.practiceData.length > 0 && !hasStarted) {
      startPractice(false);
    }
  });

  // Watch for settings changes
  $effect(() => {
    audio.setEnabled(settings.audioEnabled);
  });

  $effect(() => {
    if (!hasStarted) return;
    if (settings.keepAwake) {
      wakeLockManager.request();
    } else {
      wakeLockManager.release();
    }
  });

  // Check for active set timer
  $effect(() => {
    // Explicitly track all dependencies that should trigger a re-check
    const _deps = {
      hasStarted,
      autoPlay: settings.autoPlay,
      isReadOnly,
      isAutoCompletingSet,
      isAutoAdvancing,
      isRestTimerRunning,
      completedSetsCount: completedSets.size + skippedSets.size,
      allSetsComplete,
      activeMovementIndex,
    };
    checkAndStartActiveSetTimer();
  });

  // Public API
  return {
    // State getters
    get practiceId() {
      return practiceId;
    },
    get routineId() {
      return routineId;
    },
    get hasStarted() {
      return hasStarted;
    },
    get isPaused() {
      return isPaused;
    },
    get isReadOnly() {
      return isReadOnly;
    },
    get settings() {
      return settings;
    },
    get completedSets() {
      return completedSets;
    },
    get skippedSets() {
      return skippedSets;
    },
    get completedValues() {
      return completedValues;
    },
    get setOverrides() {
      return setOverrides;
    },
    get movementNotes() {
      return movementNotes;
    },
    get activeMovementIndex() {
      return activeMovementIndex;
    },
    get duration() {
      return duration;
    },
    get showRestTimer() {
      return showRestTimer;
    },
    get restType() {
      return restType;
    },
    get nextExerciseName() {
      return nextExerciseName;
    },
    get restingMovementIndex() {
      return restingMovementIndex;
    },
    get activeRestSetNumber() {
      return activeRestSetNumber;
    },
    get activeRestSide() {
      return activeRestSide;
    },
    get activeRestType() {
      return restType;
    },
    get restTimerValue() {
      return restTimerValue;
    },
    get restDurationValue() {
      return restDurationValue;
    },
    get isRestTimerRunning() {
      return isRestTimerRunning;
    },
    get activeSetTimerValue() {
      return activeSetTimerValue;
    },
    get activeSetTimerDuration() {
      return activeSetTimerDuration;
    },
    get activeSetTimerPaused() {
      return activeSetTimerPaused;
    },
    get isCompletingSet() {
      return isCompletingSet;
    },
    get isCompletingWorkout() {
      return isCompletingWorkout;
    },
    get isSavingSettings() {
      return isSavingSettings;
    },
    get settingsError() {
      return settingsError;
    },
    get isAdjustingSets() {
      return isAdjustingSets;
    },
    get isReordering() {
      return isReordering;
    },
    get isRemoving() {
      return isRemoving;
    },
    get isAddingMovement() {
      return isAddingMovement;
    },
    get notesSavingStates() {
      return notesSavingStates;
    },
    get wakeLockError() {
      return wakeLockManager.error;
    },

    // Derived values
    get totalSets() {
      return totalSets;
    },
    get completedSetsCount() {
      return completedSetsCount;
    },
    get allSetsComplete() {
      return allSetsComplete;
    },
    get activeMovement() {
      return activeMovement;
    },
    get isInRestPeriod() {
      return isInRestPeriod;
    },
    get progress() {
      return progress;
    },

    // Methods
    startPractice,
    exit,
    completeWorkout,
    completeSet,
    uncompleteSet,
    skipSet,
    togglePause,
    skipRest,
    adjustSets,
    reorderMovement,
    removeMovement,
    addMovement,
    updateMovementNotes,
    saveSettings,
    toggleActiveSetTimerPaused,
    resetActiveSetTimer,
    handleUserInteraction,
    isMovementActive,
    playRepSound,
    cleanup,
  };
}
