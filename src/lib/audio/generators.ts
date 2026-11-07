import { seamlessLoop } from "./loop";

export type Random = () => number;

export const seededRandom = (seed: number): Random => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type NoiseColor = "white" | "pink" | "brown";

const NOISE_SECONDS = 12;
const NOISE_CROSSFADE_SECONDS = 0.5;
const NOISE_RMS: Record<NoiseColor, number> = { white: 0.035, pink: 0.052, brown: 0.06 };

export const rms = (channels: Float32Array[]): number => {
  let sum = 0;
  let count = 0;
  for (const channel of channels) {
    for (const x of channel) sum += x * x;
    count += channel.length;
  }
  return count === 0 ? 0 : Math.sqrt(sum / count);
};

const scaleToRms = (channels: Float32Array[], target: number): Float32Array[] => {
  const current = rms(channels);
  if (current === 0) return channels;
  const gain = target / current;
  for (const channel of channels) {
    for (let i = 0; i < channel.length; i++) channel[i] *= gain;
  }
  return channels;
};

const bipolar = (random: Random) => random() * 2 - 1;

const noiseChannel = (color: NoiseColor, length: number, random: Random): Float32Array => {
  const out = new Float32Array(length);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let brown = 0;

  for (let i = 0; i < length; i++) {
    const white = bipolar(random);
    if (color === "white") {
      out[i] = white;
    } else if (color === "pink") {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
    } else {
      brown = (brown + 0.02 * white) / 1.02;
      out[i] = brown;
    }
  }
  return out;
};

export const noise = (
  color: NoiseColor,
  sampleRate: number,
  random: Random = Math.random,
): Float32Array[] => {
  const fade = Math.round(sampleRate * NOISE_CROSSFADE_SECONDS);
  const length = Math.round(sampleRate * NOISE_SECONDS) + fade;
  const channels = [noiseChannel(color, length, random), noiseChannel(color, length, random)];
  return scaleToRms(seamlessLoop(channels, fade), NOISE_RMS[color]);
};

const TICK_SECONDS = 0.08;

const addTick = (
  out: Float32Array,
  at: number,
  pitch: number,
  sampleRate: number,
  random: Random,
) => {
  const length = Math.min(Math.round(sampleRate * TICK_SECONDS), out.length - at);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const click = bipolar(random) * Math.exp(-t / 0.0015);
    const ring = Math.sin(2 * Math.PI * pitch * t) * Math.exp(-t / 0.01);
    const body = Math.sin(2 * Math.PI * pitch * 0.27 * t) * Math.exp(-t / 0.025);
    out[at + i] += 0.38 * click + 0.25 * ring + 0.13 * body;
  }
};

export const clockTicks = (sampleRate: number, random: Random = Math.random): Float32Array[] => {
  const second = Math.round(sampleRate);
  const out = new Float32Array(second * 2);
  addTick(out, 0, 3200, sampleRate, random);
  addTick(out, second, 2600, sampleRate, random);
  return [out];
};

const VINYL_REVOLUTION_SECONDS = 1.8;
const VINYL_REVOLUTIONS = 10;
const VINYL_CRACKLES_PER_SECOND = 30;
const VINYL_POPS_PER_SECOND = 0.35;

export const vinylCrackle = (sampleRate: number, random: Random = Math.random): Float32Array[] => {
  const revolution = Math.round(sampleRate * VINYL_REVOLUTION_SECONDS);
  const length = revolution * VINYL_REVOLUTIONS;
  const seconds = length / sampleRate;
  const fade = Math.round(sampleRate * 0.2);

  const channels = [0, 1].map(() => {
    const hiss = new Float32Array(length + fade);
    let lowpass = 0;
    for (let i = 0; i < hiss.length; i++) {
      lowpass += 0.2 * (bipolar(random) - lowpass);
      hiss[i] = lowpass * 0.05;
    }
    return seamlessLoop([hiss], fade)[0];
  });

  const addAt = (index: number, left: number, right: number) => {
    const i = ((index % length) + length) % length;
    channels[0][i] += left;
    channels[1][i] += right;
  };

  const addImpulse = (at: number, amplitude: number, decaySeconds: number, thumpHz = 0) => {
    const pan = bipolar(random) * 0.4;
    const span = Math.ceil(decaySeconds * 6 * sampleRate);
    const thumpSpan = thumpHz > 0 ? Math.ceil(0.03 * sampleRate) : 0;
    for (let i = 0; i < Math.max(span, thumpSpan); i++) {
      const t = i / sampleRate;
      let value = i < span ? amplitude * Math.exp(-t / decaySeconds) * bipolar(random) : 0;
      if (thumpHz > 0) {
        value += amplitude * 0.5 * Math.sin(2 * Math.PI * thumpHz * t) * Math.exp(-t / 0.005);
      }
      addAt(at + i, value * (1 - pan), value * (1 + pan));
    }
  };

  const crackles = Math.round(seconds * VINYL_CRACKLES_PER_SECOND);
  for (let n = 0; n < crackles; n++) {
    const amplitude = 0.03 + 0.2 * random() ** 4;
    addImpulse(Math.floor(random() * length), amplitude, 0.0001 + random() * 0.0003);
  }

  const pops = Math.round(seconds * VINYL_POPS_PER_SECOND);
  for (let n = 0; n < pops; n++) {
    const amplitude = 0.2 + 0.25 * random();
    addImpulse(Math.floor(random() * length), amplitude, 0.0006, 120 + random() * 100);
  }

  const thumpOffset = Math.floor(revolution * 0.37);
  for (let r = 0; r < VINYL_REVOLUTIONS; r++) {
    addImpulse(r * revolution + thumpOffset, 0.12, 0.0008, 70);
  }

  return channels;
};
