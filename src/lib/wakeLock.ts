import { createEffect, onCleanup } from "solid-js";

const isSupported = () => typeof navigator !== "undefined" && "wakeLock" in navigator;

export const createScreenWakeLock = (active: () => boolean): void => {
  if (!isSupported()) return;

  let wanted = false;
  let sentinel: WakeLockSentinel | null = null;
  let requesting = false;

  const acquire = async () => {
    if (!wanted || sentinel || requesting || document.visibilityState !== "visible") return;
    requesting = true;
    try {
      const lock = await navigator.wakeLock.request("screen");
      if (!wanted) {
        void lock.release().catch(() => {});
        return;
      }
      sentinel = lock;
      lock.addEventListener("release", () => {
        if (sentinel === lock) sentinel = null;
      });
    } catch {
      // Denied (e.g. battery saver) or unsupported — the clock still works, the screen may sleep.
    } finally {
      requesting = false;
    }
  };

  const release = () => {
    const lock = sentinel;
    sentinel = null;
    void lock?.release().catch(() => {});
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") void acquire();
  };

  createEffect(() => {
    wanted = active();
    if (wanted) void acquire();
    else release();
  });

  document.addEventListener("visibilitychange", handleVisibility);
  onCleanup(() => {
    wanted = false;
    release();
    document.removeEventListener("visibilitychange", handleVisibility);
  });
};
