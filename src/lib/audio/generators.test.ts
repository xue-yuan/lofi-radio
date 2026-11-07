import { describe, expect, it } from "vite-plus/test";
import { clockTicks, noise, rms, seededRandom, vinylCrackle } from "./generators";

const SAMPLE_RATE = 8000;

const peak = (channels: Float32Array[]) =>
  Math.max(...channels.map((c) => c.reduce((m, x) => Math.max(m, Math.abs(x)), 0)));

const wrapJump = (channels: Float32Array[]) =>
  Math.max(...channels.map((c) => Math.abs(c[0] - c[c.length - 1])));

describe("seededRandom", () => {
  it("is deterministic and stays in [0, 1)", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("noise", () => {
  it.each(["white", "pink", "brown"] as const)("%s noise is a 12 s stereo loop", (color) => {
    const channels = noise(color, SAMPLE_RATE, seededRandom(1));
    expect(channels).toHaveLength(2);
    expect(channels[0].length).toBe(12 * SAMPLE_RATE);
    expect(peak(channels)).toBeLessThan(1);
  });

  it("levels the colours to their target loudness", () => {
    expect(rms(noise("white", SAMPLE_RATE, seededRandom(1)))).toBeCloseTo(0.035, 3);
    expect(rms(noise("brown", SAMPLE_RATE, seededRandom(1)))).toBeCloseTo(0.06, 3);
  });

  it("wraps brown noise without an audible step", () => {
    const channels = noise("brown", SAMPLE_RATE, seededRandom(7));
    expect(wrapJump(channels)).toBeLessThan(0.05);
  });

  it("makes the two channels different for width", () => {
    const [left, right] = noise("pink", SAMPLE_RATE, seededRandom(3));
    expect(left).not.toEqual(right);
  });
});

describe("clockTicks", () => {
  it("is a two-second tick-tock loop with silence between ticks", () => {
    const [channel] = clockTicks(SAMPLE_RATE, seededRandom(1));
    expect(channel.length).toBe(2 * SAMPLE_RATE);
    expect(Math.abs(channel[Math.round(SAMPLE_RATE * 0.5)])).toBeLessThan(1e-4);
    expect(peak([channel.subarray(0, 200)])).toBeGreaterThan(0.1);
    expect(peak([channel.subarray(SAMPLE_RATE, SAMPLE_RATE + 200)])).toBeGreaterThan(0.1);
  });
});

describe("vinylCrackle", () => {
  it("loops on whole record revolutions without clipping", () => {
    const channels = vinylCrackle(SAMPLE_RATE, seededRandom(5));
    expect(channels).toHaveLength(2);
    expect(channels[0].length).toBe(Math.round(SAMPLE_RATE * 1.8) * 10);
    expect(peak(channels)).toBeLessThan(1);
    expect(rms(channels)).toBeGreaterThan(0.001);
  });
});
