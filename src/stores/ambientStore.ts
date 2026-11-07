import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import {
  PRESETS,
  SOUNDS,
  SOUND_IDS,
  isPresetActive,
  presetMix,
  silentMix,
  type AmbientPreset,
  type VolumeMap,
} from "../ambient";
import { clampNumber, readJSON, readString, writeJSON, writeString } from "../lib/storage";
import { initialShareState } from "../lib/initialShareState";
import { MUTE_FADE_SECONDS, type EngineState } from "../lib/audio/ambientEngine";
import { playerState } from "./playerStore";

const VOLUMES_KEY = "lofi_ambient_volumes";
const MASTER_KEY = "lofi_ambient_master";
const PRESETS_KEY = "lofi_ambient_presets";

export const MAX_CUSTOM_PRESETS = 8;
export const PRESET_NAME_MAX_LENGTH = 24;
export const SLEEP_TIMER_MINUTES = [15, 30, 60, 90] as const;
export const SLEEP_FADE_SECONDS = 30;

const sanitiseMix = (raw: unknown): VolumeMap => {
  const mix = silentMix();
  if (typeof raw !== "object" || raw === null) return mix;
  const source = raw as Record<string, unknown>;
  for (const sound of SOUNDS) {
    mix[sound.id] = clampNumber(source[sound.id], 0, 1, 0);
  }
  return mix;
};

const audibleLevels = (mix: Record<string, unknown>): VolumeMap =>
  Object.fromEntries(
    SOUND_IDS.map((id) => [id, clampNumber(mix[id], 0, 1, 0)] as const).filter(
      ([, level]) => level > 0,
    ),
  );

export const sanitiseCustomPresets = (raw: unknown): AmbientPreset[] => {
  if (!Array.isArray(raw)) return [];
  const presets: AmbientPreset[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (presets.length >= MAX_CUSTOM_PRESETS) break;
    if (typeof item !== "object" || item === null) continue;
    const { id, name, mix } = item as Record<string, unknown>;
    if (typeof id !== "string" || seen.has(id) || typeof name !== "string") continue;
    if (typeof mix !== "object" || mix === null) continue;
    const trimmed = name.trim().slice(0, PRESET_NAME_MAX_LENGTH);
    const levels = audibleLevels(mix as Record<string, unknown>);
    if (!trimmed || Object.keys(levels).length === 0) continue;
    seen.add(id);
    presets.push({ id, name: trimmed, mix: levels });
  }
  return presets;
};

const initialMix = initialShareState.ambient
  ? sanitiseMix(initialShareState.ambient)
  : sanitiseMix(readJSON<Record<string, unknown>>(VOLUMES_KEY, {}));

export const [ambientMix, setAmbientMix] = createStore<VolumeMap>(initialMix);
export const [ambientMaster, setAmbientMasterLevel] = createSignal(
  clampNumber(readString(MASTER_KEY, "1"), 0, 1, 1),
);
export const [customPresets, setCustomPresets] = createSignal<AmbientPreset[]>(
  sanitiseCustomPresets(readJSON<unknown>(PRESETS_KEY, [])),
);
const [sleepTimer, setSleepTimer] = createSignal<{ minutes: number; endsAt: number } | null>(null);
const [isAsleep, setIsAsleep] = createSignal(false);
export { isAsleep, sleepTimer };

let sleepTimeout: ReturnType<typeof setTimeout> | undefined;

const persist = () => writeJSON(VOLUMES_KEY, { ...ambientMix });
const persistPresets = () => writeJSON(PRESETS_KEY, customPresets());

export const wakeAmbient = () => setIsAsleep(false);

export const setSoundLevel = (id: string, level: number) => {
  if (!(id in ambientMix)) return;
  setAmbientMix(id, clampNumber(level, 0, 1, 0));
  wakeAmbient();
  persist();
};

export const toggleSound = (id: string) => {
  setSoundLevel(id, (ambientMix[id] ?? 0) > 0 ? 0 : 0.5);
};

export const applyPreset = (preset: AmbientPreset) => {
  setAmbientMix(presetMix(preset));
  wakeAmbient();
  persist();
};

export const clearMix = () => {
  setAmbientMix(silentMix());
  persist();
};

export const setAmbientMaster = (level: number) => {
  const next = clampNumber(level, 0, 1, ambientMaster());
  setAmbientMasterLevel(next);
  wakeAmbient();
  writeString(MASTER_KEY, String(next));
};

export const canSaveCustomPreset = (): boolean =>
  customPresets().length < MAX_CUSTOM_PRESETS &&
  Object.keys(audibleLevels({ ...ambientMix })).length > 0;

export const saveCustomPreset = (name: string): AmbientPreset | null => {
  const trimmed = name.trim().slice(0, PRESET_NAME_MAX_LENGTH);
  if (!trimmed || !canSaveCustomPreset()) return null;
  const preset: AmbientPreset = {
    id: `custom-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`,
    name: trimmed,
    mix: audibleLevels({ ...ambientMix }),
  };
  setCustomPresets((list) => [...list, preset]);
  persistPresets();
  return preset;
};

export const deleteCustomPreset = (id: string) => {
  setCustomPresets((list) => list.filter((preset) => preset.id !== id));
  persistPresets();
};

export const startSleepTimer = (minutes: number) => {
  clearTimeout(sleepTimeout);
  wakeAmbient();
  const durationMs = minutes * 60_000;
  setSleepTimer({ minutes, endsAt: Date.now() + durationMs });
  sleepTimeout = setTimeout(() => {
    setSleepTimer(null);
    setIsAsleep(true);
  }, durationMs);
};

export const cancelSleepTimer = () => {
  clearTimeout(sleepTimeout);
  setSleepTimer(null);
};

export const activePresetId = (): string | null =>
  [...PRESETS, ...customPresets()].find((preset) => isPresetActive(preset, { ...ambientMix }))
    ?.id ?? null;

export const ambientSnapshot = (): VolumeMap => ({ ...ambientMix });

export const ambientEngineState = (): EngineState => {
  const muted = playerState.isMuted;
  const asleep = isAsleep();
  return {
    levels: { ...ambientMix },
    master: muted || asleep ? 0 : ambientMaster(),
    masterFadeSeconds: asleep && !muted ? SLEEP_FADE_SECONDS : MUTE_FADE_SECONDS,
  };
};
