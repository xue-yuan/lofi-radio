import { createEffect, createSignal, onCleanup, For, Show, type Component } from "solid-js";
import { playerState, setMusicMuted } from "../stores/playerStore";
import {
  PRESET_NAME_MAX_LENGTH,
  SLEEP_TIMER_MINUTES,
  activePresetId,
  ambientEngineState,
  ambientMaster,
  ambientMix,
  applyPreset,
  canSaveCustomPreset,
  cancelSleepTimer,
  clearMix,
  customPresets,
  deleteCustomPreset,
  isAsleep,
  saveCustomPreset,
  setAmbientMaster,
  setSoundLevel,
  sleepTimer,
  startSleepTimer,
  toggleSound,
  wakeAmbient,
} from "../stores/ambientStore";
import { PRESETS, SOUNDS, isSilent } from "../ambient";
import { createAmbientEngine } from "../lib/audio/ambientEngine";

interface AmbientMixerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LABEL = "text-[10px] uppercase font-bold tracking-widest";
const CHIP = "btn btn-xs h-6 min-h-0 rounded-full border-0 text-[10px] font-medium normal-case";

const chipClass = (active: boolean, padding = "px-2.5") =>
  `${CHIP} ${padding} ${
    active
      ? "bg-primary text-primary-content"
      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
  }`;

const formatMinutes = (minutes: number) => (minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`);

const AmbientMixer: Component<AmbientMixerProps> = (props) => {
  const engine = createAmbientEngine(SOUNDS);
  createEffect(() => engine.update(ambientEngineState()));
  onCleanup(() => engine.dispose());

  const mixIsSilent = () => isSilent({ ...ambientMix });

  const [isNaming, setIsNaming] = createSignal(false);
  const [presetName, setPresetName] = createSignal("");
  let nameInput: HTMLInputElement | undefined;

  const openNaming = () => {
    setPresetName("");
    setIsNaming(true);
    queueMicrotask(() => nameInput?.focus());
  };

  const submitPreset = (e: SubmitEvent) => {
    e.preventDefault();
    if (saveCustomPreset(presetName())) setIsNaming(false);
  };

  const [now, setNow] = createSignal(0);
  createEffect(() => {
    if (!sleepTimer()) return;
    const tick = () => setNow(Date.now());
    tick();
    const ticker = setInterval(tick, 15_000);
    onCleanup(() => clearInterval(ticker));
  });

  const minutesLeft = () => {
    const timer = sleepTimer();
    return timer ? Math.max(1, Math.ceil((timer.endsAt - now()) / 60_000)) : 0;
  };

  const toggleSleepTimer = (minutes: number) => {
    if (sleepTimer()?.minutes === minutes) cancelSleepTimer();
    else startSleepTimer(minutes);
  };

  return (
    <div
      class={`fixed bottom-56 left-1/2 -translate-x-1/2 md:absolute md:bottom-full md:mb-8 z-40 transition-all duration-300 origin-bottom ${props.isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"}`}
    >
      <div class="w-[min(300px,calc(100vw-2rem))] h-[min(560px,calc(100dvh_-_16rem))] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div class="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
          <div class="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <h3 class="font-bold text-white tracking-widest uppercase text-xs">Ambient</h3>
          </div>
          <button
            class="btn btn-xs btn-ghost btn-circle text-white/40 hover:text-white"
            onClick={() => props.onClose()}
            aria-label="Close ambient mixer"
          >
            ✕
          </button>
        </div>

        <div class="px-4 pt-3 pb-3 border-b border-white/5 shrink-0">
          <label class="flex items-center justify-between gap-2 cursor-pointer" for="ambient-only">
            <span class="flex flex-col">
              <span class={`${LABEL} text-white/60`}>Ambient Only</span>
              <span class="text-[9px] text-white/30 leading-tight">
                Mute the music, keep these sounds
              </span>
            </span>
            <input
              id="ambient-only"
              type="checkbox"
              class="toggle toggle-xs toggle-primary"
              checked={playerState.isMusicMuted}
              onChange={(e) => setMusicMuted(e.currentTarget.checked)}
            />
          </label>
          <Show when={playerState.isMusicMuted && mixIsSilent()}>
            <p class="mt-2 text-[9px] leading-snug text-warning/80">
              Nothing is playing — raise a slider below, or switch this off.
            </p>
          </Show>
          <div class="mt-3 flex items-center gap-3">
            <span class={`${LABEL} text-white/60 shrink-0`}>Master</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ambientMaster()}
              class="range range-xs range-primary flex-1"
              aria-label="Ambient master volume"
              onInput={(e) => setAmbientMaster(Number(e.currentTarget.value))}
            />
            <span class="text-[10px] text-white/50 font-bold w-8 text-right tabular-nums">
              {Math.round(ambientMaster() * 100)}%
            </span>
          </div>
        </div>

        <div class="px-4 pt-3 pb-2 border-b border-white/5 shrink-0">
          <div class="flex items-center justify-between mb-2">
            <span class={`${LABEL} text-white/40`}>Presets</span>
            <Show when={!mixIsSilent()}>
              <button
                class="btn btn-ghost btn-xs h-5 min-h-0 px-1.5 text-[10px] text-white/40 hover:text-white"
                onClick={clearMix}
              >
                Clear
              </button>
            </Show>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <For each={PRESETS}>
              {(preset) => (
                <button
                  class={chipClass(activePresetId() === preset.id)}
                  onClick={() => applyPreset(preset)}
                  aria-pressed={activePresetId() === preset.id}
                >
                  {preset.name}
                </button>
              )}
            </For>
            <For each={customPresets()}>
              {(preset) => (
                <span
                  class={`inline-flex h-6 items-center rounded-full text-[10px] font-medium ${
                    activePresetId() === preset.id
                      ? "bg-primary text-primary-content"
                      : "bg-white/5 text-white/60"
                  }`}
                >
                  <button
                    class="h-full pl-2.5 pr-1 hover:text-white"
                    onClick={() => applyPreset(preset)}
                    aria-pressed={activePresetId() === preset.id}
                  >
                    {preset.name}
                  </button>
                  <button
                    class="h-full pl-0.5 pr-2 text-[9px] opacity-50 hover:opacity-100"
                    onClick={() => deleteCustomPreset(preset.id)}
                    aria-label={`Delete preset ${preset.name}`}
                  >
                    ✕
                  </button>
                </span>
              )}
            </For>
            <Show when={!isNaming() && canSaveCustomPreset()}>
              <button
                class="btn btn-xs h-6 min-h-0 rounded-full px-2.5 text-[10px] font-medium normal-case bg-transparent border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40"
                onClick={openNaming}
              >
                + Save mix
              </button>
            </Show>
          </div>
          <Show when={isNaming()}>
            <form class="mt-2 flex items-center gap-1.5" onSubmit={submitPreset}>
              <input
                ref={nameInput}
                class="input input-xs h-6 flex-1 min-w-0 bg-white/5 border-white/10 text-[11px] text-white"
                maxLength={PRESET_NAME_MAX_LENGTH}
                placeholder="Name this mix"
                aria-label="Preset name"
                value={presetName()}
                onInput={(e) => setPresetName(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setIsNaming(false);
                  }
                }}
              />
              <button
                type="submit"
                class="btn btn-xs btn-primary h-6 min-h-0 text-[10px]"
                disabled={!presetName().trim()}
              >
                Save
              </button>
              <button
                type="button"
                class="btn btn-xs btn-ghost h-6 min-h-0 text-[10px] text-white/50"
                onClick={() => setIsNaming(false)}
              >
                Cancel
              </button>
            </form>
          </Show>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5">
          <For each={SOUNDS}>
            {(sound) => (
              <div class="flex items-center gap-4">
                <button
                  class={`btn btn-circle btn-sm border-none ${(ambientMix[sound.id] ?? 0) > 0 ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"}`}
                  onClick={() => toggleSound(sound.id)}
                  aria-label={`${(ambientMix[sound.id] ?? 0) > 0 ? "Mute" : "Play"} ${sound.name}`}
                >
                  <sound.icon />
                </button>
                <div class="flex-1 flex flex-col gap-1 min-w-0">
                  <div class="flex justify-between text-[10px] text-white/50 font-bold uppercase tracking-wider">
                    <span>{sound.name}</span>
                    <span>{Math.round((ambientMix[sound.id] ?? 0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={ambientMix[sound.id] ?? 0}
                    class="range range-xs range-primary"
                    aria-label={`${sound.name} volume`}
                    onInput={(e) => setSoundLevel(sound.id, Number(e.currentTarget.value))}
                  />
                </div>
              </div>
            )}
          </For>
        </div>

        <div class="px-4 py-2.5 border-t border-white/10 shrink-0 flex items-center justify-between gap-2 bg-white/5">
          <Show
            when={!isAsleep()}
            fallback={
              <>
                <span class={`${LABEL} text-white/40`}>Faded out</span>
                <button class={chipClass(false)} onClick={wakeAmbient}>
                  Resume
                </button>
              </>
            }
          >
            <span class={`${LABEL} text-white/40 whitespace-nowrap`}>
              {sleepTimer() ? `Fade out · ${minutesLeft()}m` : "Fade out"}
            </span>
            <div class="flex gap-1" role="group" aria-label="Fade-out timer">
              <For each={SLEEP_TIMER_MINUTES}>
                {(minutes) => (
                  <button
                    class={chipClass(sleepTimer()?.minutes === minutes, "px-2")}
                    onClick={() => toggleSleepTimer(minutes)}
                    aria-pressed={sleepTimer()?.minutes === minutes}
                    aria-label={`Fade out the ambient mix in ${minutes} minutes`}
                  >
                    {formatMinutes(minutes)}
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default AmbientMixer;
