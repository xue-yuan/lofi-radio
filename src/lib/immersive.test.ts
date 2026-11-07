import { describe, expect, it } from "vite-plus/test";
import { CLOCK_DRIFT_PX, nextImmersiveMode, randomDrift } from "./immersive";

describe("nextImmersiveMode", () => {
  it("cycles off → fade → clock → off", () => {
    expect(nextImmersiveMode("off")).toBe("fade");
    expect(nextImmersiveMode("fade")).toBe("clock");
    expect(nextImmersiveMode("clock")).toBe("off");
  });
});

describe("randomDrift", () => {
  it("stays within the drift bounds", () => {
    expect(randomDrift(() => 0)).toEqual({ x: -CLOCK_DRIFT_PX.x, y: -CLOCK_DRIFT_PX.y });
    expect(randomDrift(() => 0.5)).toEqual({ x: 0, y: 0 });
    expect(randomDrift(() => 0.999999)).toEqual({ x: CLOCK_DRIFT_PX.x, y: CLOCK_DRIFT_PX.y });
  });
});
