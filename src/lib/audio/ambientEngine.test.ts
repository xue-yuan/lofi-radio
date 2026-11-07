import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vite-plus/test";
import type { SoundTrack } from "../../ambient";
import {
  SOUND_FADE_SECONDS,
  createAmbientEngine,
  levelToGain,
  pickIndex,
  randomBetween,
} from "./ambientEngine";
import { seededRandom } from "./generators";

class FakeParam {
  value = 0;
  cancelScheduledValues = vi.fn();
  setValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  setTargetAtTime = vi.fn((value: number) => {
    this.value = value;
  });
}

class FakeNode {
  connect = vi.fn((node: unknown) => node);
  disconnect = vi.fn();
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeSource extends FakeNode {
  buffer: FakeBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
}

class FakeBuffer {
  readonly numberOfChannels: number;
  readonly length: number;
  readonly sampleRate: number;
  readonly duration: number;
  readonly channels: Float32Array[];
  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }
  getChannelData(i: number) {
    return this.channels[i];
  }
  copyToChannel(data: Float32Array, i: number) {
    this.channels[i].set(data);
  }
}

class FakeContext {
  state: AudioContextState = "running";
  currentTime = 0;
  sampleRate = 8000;
  destination = new FakeNode();
  gains: FakeGain[] = [];
  sources: FakeSource[] = [];
  createGain = () => {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  };
  createBufferSource = () => {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  };
  createStereoPanner = () => Object.assign(new FakeNode(), { pan: new FakeParam() });
  createDynamicsCompressor = () =>
    Object.assign(new FakeNode(), {
      threshold: new FakeParam(),
      knee: new FakeParam(),
      ratio: new FakeParam(),
      attack: new FakeParam(),
      release: new FakeParam(),
    });
  createBuffer = (channels: number, length: number, sampleRate: number) =>
    new FakeBuffer(channels, length, sampleRate);
  decodeAudioData = vi.fn(async () => {
    const buffer = new FakeBuffer(2, 8000, 8000);
    buffer.channels.forEach((c) => c.fill(0.2));
    return buffer;
  });
  resume = vi.fn(async () => {
    this.state = "running";
  });
  suspend = vi.fn(async () => {
    this.state = "suspended";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });
}

const sounds: SoundTrack[] = [
  { id: "rain", name: "Rain", icon: () => null, source: { kind: "loop", url: "/sounds/rain.mp3" } },
  {
    id: "noise",
    name: "Noise",
    icon: () => null,
    source: { kind: "generated", generate: (sr) => [new Float32Array(sr).fill(0.1)] },
  },
  {
    id: "thunder",
    name: "Thunder",
    icon: () => null,
    source: { kind: "scatter", urls: ["/sounds/a.mp3", "/sounds/b.mp3"], gapSeconds: [10, 20] },
  },
];

const silent = { rain: 0, noise: 0, thunder: 0 };

let ctx: FakeContext;
let loadAudio: Mock<(url: string) => Promise<ArrayBuffer>>;

const setup = () => {
  ctx = new FakeContext();
  loadAudio = vi.fn(async (_url: string) => new ArrayBuffer(8));
  return createAmbientEngine(sounds, {
    createContext: () => ctx as unknown as AudioContext,
    loadAudio,
    random: seededRandom(9),
  });
};

const masterGain = () => ctx.gains[0];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("helpers", () => {
  it("maps slider levels onto a perceptual gain curve", () => {
    expect(levelToGain(0)).toBe(0);
    expect(levelToGain(0.5)).toBe(0.25);
    expect(levelToGain(1)).toBe(1);
    expect(levelToGain(3)).toBe(1);
  });

  it("never picks the same one-shot twice in a row", () => {
    const random = seededRandom(2);
    let previous = -1;
    for (let i = 0; i < 200; i++) {
      const next = pickIndex(4, previous, random);
      expect(next).not.toBe(previous);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(4);
      previous = next;
    }
  });

  it("can pick any one-shot first", () => {
    expect(pickIndex(3, -1, () => 0.99)).toBe(2);
  });

  it("draws gaps from the configured range", () => {
    expect(randomBetween([10, 20], () => 0)).toBe(10);
    expect(randomBetween([10, 20], () => 0.5)).toBe(15);
  });
});

describe("createAmbientEngine", () => {
  it("does not create an audio context while everything is silent", () => {
    const createContext = vi.fn();
    const engine = createAmbientEngine(sounds, { createContext });
    engine.update({ levels: silent, master: 1 });
    expect(createContext).not.toHaveBeenCalled();
  });

  it("downloads a sound only once its level is raised", async () => {
    const engine = setup();
    engine.update({ levels: silent, master: 1 });
    expect(loadAudio).not.toHaveBeenCalled();

    engine.update({ levels: { ...silent, rain: 0.5 }, master: 1 });
    await vi.advanceTimersByTimeAsync(0);

    expect(loadAudio).toHaveBeenCalledTimes(1);
    expect(loadAudio).toHaveBeenCalledWith("/sounds/rain.mp3");
    const [source] = ctx.sources;
    expect(source.loop).toBe(true);
    expect(source.start).toHaveBeenCalled();
  });

  it("fades the sound in to the squared level", async () => {
    const engine = setup();
    engine.update({ levels: { ...silent, rain: 0.5 }, master: 1 });
    await vi.advanceTimersByTimeAsync(0);

    const rainGain = ctx.gains[1];
    expect(rainGain.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.25, 0, SOUND_FADE_SECONDS / 4);
    expect(masterGain().gain.value).toBe(1);
  });

  it("builds generated sounds locally", async () => {
    const engine = setup();
    engine.update({ levels: { ...silent, noise: 0.4 }, master: 1 });
    await vi.advanceTimersByTimeAsync(0);

    expect(loadAudio).not.toHaveBeenCalled();
    expect(ctx.sources[0].buffer?.length).toBe(8000);
  });

  it("stops the source after fading out and restarts it later", async () => {
    const engine = setup();
    engine.update({ levels: { ...silent, rain: 0.5 }, master: 1 });
    await vi.advanceTimersByTimeAsync(0);

    engine.update({ levels: silent, master: 1 });
    expect(ctx.sources[0].stop).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);
    expect(ctx.sources[0].stop).toHaveBeenCalled();

    engine.update({ levels: { ...silent, rain: 0.5 }, master: 1 });
    await vi.advanceTimersByTimeAsync(0);
    expect(ctx.sources).toHaveLength(2);
    expect(loadAudio).toHaveBeenCalledTimes(1);
  });

  it("keeps the source when the level comes back before the fade ends", async () => {
    const engine = setup();
    engine.update({ levels: { ...silent, rain: 0.5 }, master: 1 });
    await vi.advanceTimersByTimeAsync(0);

    engine.update({ levels: silent, master: 1 });
    await vi.advanceTimersByTimeAsync(200);
    engine.update({ levels: { ...silent, rain: 0.3 }, master: 1 });
    await vi.advanceTimersByTimeAsync(2000);

    expect(ctx.sources).toHaveLength(1);
    expect(ctx.sources[0].stop).not.toHaveBeenCalled();
  });

  it("suspends the context while muted and resumes on unmute", async () => {
    const engine = setup();
    engine.update({ levels: { ...silent, rain: 0.5 }, master: 1 });
    await vi.advanceTimersByTimeAsync(0);

    engine.update({ levels: { ...silent, rain: 0.5 }, master: 0 });
    expect(masterGain().gain.value).toBe(0);
    await vi.advanceTimersByTimeAsync(2000);
    expect(ctx.suspend).toHaveBeenCalled();

    engine.update({ levels: { ...silent, rain: 0.5 }, master: 1 });
    expect(ctx.resume).toHaveBeenCalled();
  });

  it("uses the requested master fade for slow fade-outs", () => {
    const engine = setup();
    engine.update({ levels: { ...silent, rain: 0.5 }, master: 1 });
    engine.update({ levels: { ...silent, rain: 0.5 }, master: 0, masterFadeSeconds: 30 });
    expect(masterGain().gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 7.5);
  });

  it("plays one-shots at random intervals while a scatter sound is up", async () => {
    const engine = setup();
    engine.update({ levels: { ...silent, thunder: 0.6 }, master: 1 });
    await vi.advanceTimersByTimeAsync(0);
    expect(loadAudio).toHaveBeenCalledTimes(2);
    expect(ctx.sources).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(4_000);
    expect(ctx.sources).toHaveLength(1);
    expect(ctx.sources[0].loop).toBe(false);

    await vi.advanceTimersByTimeAsync(20_000);
    expect(ctx.sources).toHaveLength(2);
    expect(ctx.sources[1].buffer).not.toBe(ctx.sources[0].buffer);

    engine.update({ levels: silent, master: 1 });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(ctx.sources).toHaveLength(2);
  });

  it("waits for a user gesture before creating the context", () => {
    const activation = { hasBeenActive: false };
    Object.defineProperty(navigator, "userActivation", { configurable: true, value: activation });
    const createContext = vi.fn(() => new FakeContext() as unknown as AudioContext);
    const engine = createAmbientEngine(sounds, { createContext, loadAudio: vi.fn() });

    engine.update({ levels: { ...silent, rain: 0.5 }, master: 1 });
    expect(createContext).not.toHaveBeenCalled();

    activation.hasBeenActive = true;
    window.dispatchEvent(new Event("pointerdown"));
    expect(createContext).toHaveBeenCalledTimes(1);

    engine.dispose();
    Reflect.deleteProperty(navigator, "userActivation");
  });

  it("closes the context on dispose", async () => {
    const engine = setup();
    engine.update({ levels: { ...silent, rain: 0.5 }, master: 1 });
    await vi.advanceTimersByTimeAsync(0);
    engine.dispose();
    expect(ctx.close).toHaveBeenCalled();
    expect(ctx.sources[0].stop).toHaveBeenCalled();
  });
});
