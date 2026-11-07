export type ImmersiveMode = "off" | "fade" | "clock";

export const IMMERSIVE_MODES: readonly ImmersiveMode[] = ["off", "fade", "clock"];

export const IMMERSIVE_MODE_INFO: Record<ImmersiveMode, { icon: string; label: string }> = {
  off: { icon: "👁️", label: "Immersive Off" },
  fade: { icon: "🌙", label: "Immersive On" },
  clock: { icon: "🕰️", label: "Clock Mode" },
};

export const nextImmersiveMode = (mode: ImmersiveMode): ImmersiveMode =>
  IMMERSIVE_MODES[(IMMERSIVE_MODES.indexOf(mode) + 1) % IMMERSIVE_MODES.length];

/** Largest distance, in px, the clock may drift from centre to spread OLED wear. */
export const CLOCK_DRIFT_PX = { x: 40, y: 28 };

export const randomDrift = (random: () => number = Math.random) => ({
  x: Math.round((random() * 2 - 1) * CLOCK_DRIFT_PX.x),
  y: Math.round((random() * 2 - 1) * CLOCK_DRIFT_PX.y),
});
