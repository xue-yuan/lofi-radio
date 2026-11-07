import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createRoot, createSignal } from "solid-js";
import { createScreenWakeLock } from "./wakeLock";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const createSentinel = () => {
  const target = new EventTarget();
  const sentinel = {
    released: false,
    release: vi.fn(async () => {
      sentinel.released = true;
      target.dispatchEvent(new Event("release"));
    }),
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
  };
  return sentinel;
};

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("createScreenWakeLock", () => {
  let sentinels: ReturnType<typeof createSentinel>[];
  let request: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sentinels = [];
    request = vi.fn(async () => {
      const sentinel = createSentinel();
      sentinels.push(sentinel);
      return sentinel;
    });
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request } });
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, "wakeLock");
    Reflect.deleteProperty(document, "visibilityState");
  });

  it("holds the lock only while active", async () => {
    const [active, setActive] = createSignal(false);
    const dispose = createRoot((dispose) => {
      createScreenWakeLock(active);
      return dispose;
    });
    await flush();
    expect(request).not.toHaveBeenCalled();

    setActive(true);
    await flush();
    expect(request).toHaveBeenCalledTimes(1);

    setActive(false);
    await flush();
    expect(sentinels[0].release).toHaveBeenCalled();

    dispose();
  });

  it("re-acquires after the tab becomes visible again", async () => {
    const dispose = createRoot((dispose) => {
      createScreenWakeLock(() => true);
      return dispose;
    });
    await flush();
    expect(request).toHaveBeenCalledTimes(1);

    setVisibility("hidden");
    await sentinels[0].release();
    setVisibility("visible");
    await flush();
    expect(request).toHaveBeenCalledTimes(2);

    dispose();
    expect(sentinels[1].release).toHaveBeenCalled();
  });

  it("does nothing when the API is missing", () => {
    Reflect.deleteProperty(navigator, "wakeLock");
    expect(() =>
      createRoot((dispose) => {
        createScreenWakeLock(() => true);
        dispose();
      }),
    ).not.toThrow();
  });
});
