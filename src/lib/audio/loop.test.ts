import { describe, expect, it } from "vite-plus/test";
import { audibleRange, prepareLoop, seamlessLoop, trimSilence } from "./loop";

const ramp = (length: number) => Float32Array.from({ length }, (_, i) => i / length);

describe("audibleRange", () => {
  it("skips leading and trailing near-silence", () => {
    const data = new Float32Array([0, 0.0001, 0.5, -0.2, 0.3, 0, 0]);
    expect(audibleRange([data])).toEqual([2, 5]);
  });

  it("counts a sample as audible when any channel is", () => {
    const left = new Float32Array([0, 0, 0.4, 0]);
    const right = new Float32Array([0, 0.4, 0, 0]);
    expect(audibleRange([left, right])).toEqual([1, 3]);
  });

  it("keeps the whole buffer when it is entirely silent", () => {
    expect(audibleRange([new Float32Array(4)])).toEqual([0, 4]);
  });
});

describe("seamlessLoop", () => {
  it("shortens the loop by the crossfade length", () => {
    expect(seamlessLoop([ramp(100)], 10)[0].length).toBe(90);
  });

  it("joins the end back onto the start without a jump", () => {
    const source = ramp(1000);
    const [looped] = seamlessLoop([source], 100);
    const wrapJump = Math.abs(looped[0] - looped[looped.length - 1]);
    expect(wrapJump).toBeLessThan(0.01);
    expect(Math.abs(source[0] - source[source.length - 1])).toBeGreaterThan(0.9);
  });

  it("leaves the body after the crossfade untouched", () => {
    const source = ramp(1000);
    const [looped] = seamlessLoop([source], 100);
    expect(looped[500]).toBe(source[500]);
  });

  it("caps the crossfade at half the buffer", () => {
    expect(seamlessLoop([ramp(10)], 50)[0].length).toBe(5);
  });
});

describe("prepareLoop", () => {
  it("trims padding before crossfading", () => {
    const padded = new Float32Array(2000);
    padded.set(
      ramp(1000).map((v) => v + 0.1),
      500,
    );
    const [looped] = prepareLoop([padded], 1000);
    expect(looped.length).toBe(900);
    expect(Math.min(...looped)).toBeGreaterThan(0.05);
  });
});

describe("trimSilence", () => {
  it("returns independent copies", () => {
    const data = new Float32Array([0, 0.5, 0]);
    const [trimmed] = trimSilence([data]);
    trimmed[0] = 1;
    expect(data[1]).toBe(0.5);
  });
});
