import type { SoundSource, SoundTrack, VolumeMap } from "../../ambient";
import { prepareLoop, trimSilence } from "./loop";

export const SLIDER_FADE_SECONDS = 0.1;
export const SOUND_FADE_SECONDS = 0.8;
export const MUTE_FADE_SECONDS = 0.15;
const STOP_MARGIN_SECONDS = 0.3;
const SCATTER_FIRST_DELAY_SECONDS: [number, number] = [1, 4];
const SCATTER_GAIN_RANGE: [number, number] = [0.6, 1];
const SCATTER_MAX_PAN = 0.6;

export interface EngineState {
  levels: VolumeMap;
  master: number;
  masterFadeSeconds?: number;
}

export interface AmbientEngine {
  update: (state: EngineState) => void;
  dispose: () => void;
}

export interface EngineDeps {
  createContext?: () => AudioContext | null;
  loadAudio?: (url: string) => Promise<ArrayBuffer>;
  random?: () => number;
}

type Channels = Float32Array<ArrayBuffer>[];

interface Voice {
  level: number;
  setLevel: (level: number) => void;
  dispose: () => void;
}

interface Graph {
  ctx: AudioContext;
  master: GainNode;
}

export const levelToGain = (level: number): number => {
  const clamped = Math.min(1, Math.max(0, level));
  return clamped * clamped;
};

export const randomBetween = ([min, max]: [number, number], random: () => number): number =>
  min + (max - min) * random();

export const pickIndex = (count: number, previous: number, random: () => number): number => {
  if (count <= 1) return 0;
  if (previous < 0 || previous >= count) return Math.floor(random() * count);
  const index = Math.floor(random() * (count - 1));
  return index >= previous ? index + 1 : index;
};

const defaultContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor({ latencyHint: "playback" });
  } catch {
    return null;
  }
};

const defaultLoadAudio = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.arrayBuffer();
};

const hasUserActivation = () =>
  (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
    ?.hasBeenActive ?? true;

const preferPlaybackSession = () => {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (!session) return;
  try {
    session.type = "playback";
  } catch {}
};

const rampTo = (ctx: BaseAudioContext, param: AudioParam, value: number, seconds: number) => {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.setTargetAtTime(value, now, Math.max(seconds, 0.01) / 4);
};

const channelsOf = (buffer: AudioBuffer): Channels =>
  Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));

const toBuffer = (ctx: BaseAudioContext, channels: Float32Array[], sampleRate: number) => {
  const buffer = ctx.createBuffer(channels.length, channels[0].length, sampleRate);
  channels.forEach((channel, i) => buffer.copyToChannel(channel as Float32Array<ArrayBuffer>, i));
  return buffer;
};

const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"] as const;

export const createAmbientEngine = (sounds: SoundTrack[], deps: EngineDeps = {}): AmbientEngine => {
  const createContext = deps.createContext ?? defaultContext;
  const loadAudio = deps.loadAudio ?? defaultLoadAudio;
  const random = deps.random ?? Math.random;

  let graph: Graph | null = null;
  let masterGain = -1;
  let suspendTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let listening = false;
  let pending: EngineState | null = null;
  const voices = new Map<string, Voice>();

  const shouldRun = () => masterGain > 0 && [...voices.values()].some((v) => v.level > 0);

  const resumeIfNeeded = () => {
    if (graph && shouldRun() && graph.ctx.state !== "running") {
      void graph.ctx.resume().catch(() => {});
    }
  };

  const handleGesture = () => {
    if (pending) {
      const state = pending;
      pending = null;
      apply(state);
      return;
    }
    resumeIfNeeded();
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") resumeIfNeeded();
  };

  const listen = () => {
    if (listening) return;
    listening = true;
    for (const event of UNLOCK_EVENTS) {
      window.addEventListener(event, handleGesture, { capture: true, passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibility);
  };

  const syncRunning = (fadeSeconds: number) => {
    if (!graph) return;
    clearTimeout(suspendTimer);
    if (shouldRun()) {
      resumeIfNeeded();
      return;
    }
    suspendTimer = setTimeout(
      () => {
        if (graph && !shouldRun() && graph.ctx.state === "running") {
          void graph.ctx.suspend().catch(() => {});
        }
      },
      (fadeSeconds + STOP_MARGIN_SECONDS) * 1000,
    );
  };

  const ensureGraph = (): Graph | null => {
    if (graph) return graph;
    const ctx = createContext();
    if (!ctx) return null;

    const master = ctx.createGain();
    master.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    master.connect(limiter).connect(ctx.destination);

    preferPlaybackSession();
    graph = { ctx, master };
    return graph;
  };

  const decode = async (ctx: AudioContext, url: string): Promise<AudioBuffer> =>
    ctx.decodeAudioData(await loadAudio(url));

  const loadLoop = async (ctx: AudioContext, source: SoundSource): Promise<AudioBuffer> => {
    if (source.kind === "generated") {
      return toBuffer(ctx, source.generate(ctx.sampleRate), ctx.sampleRate);
    }
    if (source.kind !== "loop") throw new Error("Not a looping source");
    const decoded = await decode(ctx, source.url);
    return toBuffer(ctx, prepareLoop(channelsOf(decoded), decoded.sampleRate), decoded.sampleRate);
  };

  const loadOneShot = async (ctx: AudioContext, url: string): Promise<AudioBuffer> => {
    const decoded = await decode(ctx, url);
    return toBuffer(ctx, trimSilence(channelsOf(decoded)), decoded.sampleRate);
  };

  const createLoopVoice = (sound: SoundTrack, { ctx, master }: Graph): Voice => {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(master);

    let node: AudioBufferSourceNode | null = null;
    let buffer: Promise<AudioBuffer> | null = null;
    let stopTimer: ReturnType<typeof setTimeout> | undefined;

    const stop = () => {
      if (!node) return;
      try {
        node.stop();
      } catch {}
      node.disconnect();
      node = null;
    };

    const start = () => {
      buffer ??= loadLoop(ctx, sound.source).catch((error: unknown) => {
        buffer = null;
        throw error;
      });
      buffer.then(
        (loaded) => {
          if (disposed || node || voice.level === 0) return;
          node = ctx.createBufferSource();
          node.buffer = loaded;
          node.loop = true;
          node.connect(gain);
          node.start(0, random() * loaded.duration);
          rampTo(ctx, gain.gain, levelToGain(voice.level), SOUND_FADE_SECONDS);
        },
        () => {},
      );
    };

    const voice: Voice = {
      level: 0,
      setLevel(level) {
        const fade = voice.level === 0 || level === 0 ? SOUND_FADE_SECONDS : SLIDER_FADE_SECONDS;
        voice.level = level;
        clearTimeout(stopTimer);
        if (level > 0) {
          if (node) rampTo(ctx, gain.gain, levelToGain(level), fade);
          else start();
          return;
        }
        rampTo(ctx, gain.gain, 0, fade);
        stopTimer = setTimeout(
          () => {
            if (voice.level === 0) stop();
          },
          (fade + STOP_MARGIN_SECONDS) * 1000,
        );
      },
      dispose() {
        clearTimeout(stopTimer);
        stop();
        gain.disconnect();
      },
    };
    return voice;
  };

  const createScatterVoice = (
    source: Extract<SoundSource, { kind: "scatter" }>,
    { ctx, master }: Graph,
  ): Voice => {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(master);

    let buffers: Promise<AudioBuffer[]> | null = null;
    let nextTimer: ReturnType<typeof setTimeout> | undefined;
    let stopTimer: ReturnType<typeof setTimeout> | undefined;
    let previous = -1;
    const playing = new Set<AudioBufferSourceNode>();

    const load = () => {
      buffers ??= Promise.all(source.urls.map((url) => loadOneShot(ctx, url))).catch(
        (error: unknown) => {
          buffers = null;
          throw error;
        },
      );
      return buffers;
    };

    const playOne = (list: AudioBuffer[]) => {
      if (disposed || voice.level === 0 || list.length === 0) return;
      const index = pickIndex(list.length, previous, random);
      previous = index;

      const node = ctx.createBufferSource();
      node.buffer = list[index];
      const shot = ctx.createGain();
      shot.gain.value = randomBetween(SCATTER_GAIN_RANGE, random);
      let output: AudioNode = shot;
      if (typeof ctx.createStereoPanner === "function") {
        const panner = ctx.createStereoPanner();
        panner.pan.value = randomBetween([-SCATTER_MAX_PAN, SCATTER_MAX_PAN], random);
        shot.connect(panner);
        output = panner;
      }
      node.connect(shot);
      output.connect(gain);
      node.onended = () => {
        playing.delete(node);
        node.disconnect();
        shot.disconnect();
        output.disconnect();
      };
      playing.add(node);
      node.start();
    };

    const schedule = (delaySeconds: number) => {
      clearTimeout(nextTimer);
      nextTimer = setTimeout(() => {
        if (voice.level === 0) return;
        load().then(playOne, () => {});
        schedule(randomBetween(source.gapSeconds, random));
      }, delaySeconds * 1000);
    };

    const stopAll = () => {
      for (const node of playing) {
        try {
          node.stop();
        } catch {}
      }
      playing.clear();
    };

    const voice: Voice = {
      level: 0,
      setLevel(level) {
        const wasSilent = voice.level === 0;
        const fade = wasSilent || level === 0 ? SOUND_FADE_SECONDS : SLIDER_FADE_SECONDS;
        voice.level = level;
        clearTimeout(stopTimer);
        rampTo(ctx, gain.gain, levelToGain(level), fade);
        if (level > 0) {
          if (wasSilent) {
            load().catch(() => {});
            schedule(randomBetween(SCATTER_FIRST_DELAY_SECONDS, random));
          }
          return;
        }
        clearTimeout(nextTimer);
        stopTimer = setTimeout(stopAll, (fade + STOP_MARGIN_SECONDS) * 1000);
      },
      dispose() {
        clearTimeout(nextTimer);
        clearTimeout(stopTimer);
        stopAll();
        gain.disconnect();
      },
    };
    return voice;
  };

  const voiceFor = (sound: SoundTrack, g: Graph): Voice => {
    let voice = voices.get(sound.id);
    if (!voice) {
      voice =
        sound.source.kind === "scatter"
          ? createScatterVoice(sound.source, g)
          : createLoopVoice(sound, g);
      voices.set(sound.id, voice);
    }
    return voice;
  };

  function apply({ levels, master, masterFadeSeconds = MUTE_FADE_SECONDS }: EngineState) {
    const wantsSound = sounds.some((sound) => (levels[sound.id] ?? 0) > 0);
    if (!graph && !wantsSound) return;
    listen();
    if (!graph && !hasUserActivation()) {
      pending = { levels, master, masterFadeSeconds };
      return;
    }
    const g = ensureGraph();
    if (!g) return;

    for (const sound of sounds) {
      const level = Math.min(1, Math.max(0, levels[sound.id] ?? 0));
      const existing = voices.get(sound.id);
      if ((existing?.level ?? 0) === level) continue;
      voiceFor(sound, g).setLevel(level);
    }

    const nextMaster = levelToGain(master);
    if (nextMaster !== masterGain) {
      masterGain = nextMaster;
      rampTo(g.ctx, g.master.gain, nextMaster, masterFadeSeconds);
    }

    syncRunning(Math.max(masterFadeSeconds, SOUND_FADE_SECONDS));
  }

  return {
    update(state) {
      if (disposed) return;
      if (pending) pending = state;
      else apply(state);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(suspendTimer);
      for (const voice of voices.values()) voice.dispose();
      voices.clear();
      pending = null;
      if (listening) {
        for (const event of UNLOCK_EVENTS) {
          window.removeEventListener(event, handleGesture, { capture: true });
        }
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      if (!graph) return;
      void graph.ctx.close().catch(() => {});
      graph = null;
    },
  };
};
