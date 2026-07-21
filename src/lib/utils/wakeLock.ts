import type { AudioController } from "./audio";

export interface WakeLockManager {
  wakeLock: WakeLockSentinel | null;
  error: string | null;
  isSupported: boolean;
  request(): Promise<void>;
  release(): void;
  reRequestOnInteraction(audio?: AudioController): void;
  cleanup(): void;
}

export function createWakeLockManager(enabled: boolean): WakeLockManager {
  let wakeLock: WakeLockSentinel | null = null;
  let error: string | null = null;
  const isSupported = "wakeLock" in navigator;

  async function request(): Promise<void> {
    if (!enabled || !isSupported) return;
    if (wakeLock) return; // already holding

    try {
      const lock = await navigator.wakeLock.request("screen");
      wakeLock = lock;
      error = null;

      lock.addEventListener("release", () => {
        wakeLock = null;
      });
    } catch (err) {
      console.error("Wake lock error:", err);
      error = "Screen may turn off. Tap to re-enable.";
    }
  }

  function release() {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  }

  function reRequestOnInteraction(audio?: AudioController) {
    if (!enabled || wakeLock || !isSupported) return;

    navigator.wakeLock
      .request("screen")
      .then((lock) => {
        wakeLock = lock;
        error = null;
        lock.addEventListener("release", () => {
          wakeLock = null;
        });
      })
      .catch((err) => {
        console.error("Wake lock re-request error:", err);
      });

    if (audio) {
      audio.ensureAudioContext();
    }
  }

  // Re-acquire wake lock when tab becomes visible again
  async function handleVisibilityChange() {
    if (document.visibilityState === "visible" && enabled && isSupported && !wakeLock) {
      try {
        const lock = await navigator.wakeLock.request("screen");
        wakeLock = lock;
        error = null;
        lock.addEventListener("release", () => {
          wakeLock = null;
        });
      } catch (err) {
        console.error("Wake lock re-acquire error:", err);
      }
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  function cleanup() {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    release();
  }

  return {
    get wakeLock() {
      return wakeLock;
    },
    get error() {
      return error;
    },
    get isSupported() {
      return isSupported;
    },
    request,
    release,
    reRequestOnInteraction,
    cleanup,
  };
}
