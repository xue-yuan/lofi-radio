import { createEffect, createSignal, onCleanup, Show, type Component } from "solid-js";
import { playerState } from "../stores/playerStore";
import { findChannel } from "../stations";
import { randomDrift } from "../lib/immersive";
import DigitalClock from "./DigitalClock";

const DRIFT_INTERVAL_MS = 60_000;

interface ClockScreenProps {
  active: boolean;
}

const ClockScreen: Component<ClockScreenProps> = (props) => {
  const [drift, setDrift] = createSignal({ x: 0, y: 0 });

  createEffect(() => {
    if (!props.active) return;
    const timer = setInterval(() => setDrift(randomDrift()), DRIFT_INTERVAL_MS);
    onCleanup(() => {
      clearInterval(timer);
      setDrift({ x: 0, y: 0 });
    });
  });

  const trackTitle = () => findChannel(playerState.currentChannelId)?.channel.title;

  return (
    <div
      class={`fixed inset-0 z-[5] flex items-center justify-center bg-black pointer-events-none transition-opacity duration-1000 ${
        props.active ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!props.active}
    >
      <div
        class="flex flex-col items-center motion-safe:transition-transform motion-safe:duration-[3000ms] ease-in-out"
        style={{ transform: `translate(${drift().x}px, ${drift().y}px)` }}
      >
        <DigitalClock variant="center" />
        <Show when={trackTitle()}>
          {(title) => (
            <p class="mt-[4vh] max-w-[80vw] truncate text-center text-xs md:text-sm font-medium tracking-[0.2em] text-white opacity-25 grayscale">
              ♪ {title()}
            </p>
          )}
        </Show>
      </div>
    </div>
  );
};

export default ClockScreen;
