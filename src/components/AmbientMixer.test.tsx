import { beforeEach, afterEach, describe, expect, it, vi } from "vite-plus/test";
import { render, screen, cleanup, fireEvent } from "@solidjs/testing-library";
import type { EngineState } from "../lib/audio/ambientEngine";

const engineUpdates = vi.hoisted(() => [] as EngineState[]);

vi.mock("../lib/audio/ambientEngine", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/audio/ambientEngine")>()),
  createAmbientEngine: () => ({
    update: (state: EngineState) => engineUpdates.push(state),
    dispose: () => {},
  }),
}));

import AmbientMixer from "./AmbientMixer";
import {
  cancelSleepTimer,
  clearMix,
  customPresets,
  deleteCustomPreset,
  isAsleep,
  setAmbientMaster,
  wakeAmbient,
} from "../stores/ambientStore";
import { setMusicMuted, setMuted, playerState } from "../stores/playerStore";
import { PRESETS, presetMix } from "../ambient";

const slider = (name: string) => screen.getByLabelText(`${name} volume`) as HTMLInputElement;

const percentFor = (name: string) => {
  const row = screen.getByText(name).closest("div")!;
  return row.textContent?.match(/(\d+)%/)?.[1];
};

const lastEngineState = () => engineUpdates[engineUpdates.length - 1];

beforeEach(() => {
  localStorage.clear();
  clearMix();
  setAmbientMaster(1);
  for (const preset of customPresets()) deleteCustomPreset(preset.id);
  cancelSleepTimer();
  wakeAmbient();
  setMusicMuted(false);
  setMuted(false);
  engineUpdates.length = 0;
});
afterEach(cleanup);

describe("AmbientMixer presets", () => {
  it("writes the sliders when a preset is applied", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    const rainyNight = PRESETS.find((p) => p.id === "rainy-night")!;
    const expected = presetMix(rainyNight);

    fireEvent.click(screen.getByRole("button", { name: "Rainy Night" }));

    expect(Number(slider("Rain").value)).toBeCloseTo(expected.rain, 2);
    expect(Number(slider("Thunder").value)).toBeCloseTo(expected.thunder, 2);
    expect(Number(slider("Campfire").value)).toBe(0);
  });

  it("leaves the sliders editable afterwards - a preset is a starting point", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Rainy Night" }));

    fireEvent.input(slider("Rain"), { target: { value: "0.2" } });

    expect(Number(slider("Rain").value)).toBeCloseTo(0.2, 2);
    expect(Number(slider("Thunder").value)).toBeCloseTo(0.35, 2);
  });

  it("stops marking a preset active once the mix is edited", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    const chip = screen.getByRole("button", { name: "Rainy Night" });

    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");

    fireEvent.input(slider("Rain"), { target: { value: "0.05" } });
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("clears every track", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Storm" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(Number(slider("Rain").value)).toBe(0);
    expect(Number(slider("Thunder").value)).toBe(0);
  });

  it("hides Clear when nothing is playing", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("persists the mix", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Campfire" }));

    const stored = JSON.parse(localStorage.getItem("lofi_ambient_volumes")!);
    expect(stored.fire).toBeCloseTo(0.6, 2);
  });

  it("shows the level as a percentage", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    fireEvent.input(slider("Rain"), { target: { value: "0.42" } });
    expect(percentFor("Rain")).toBe("42");
  });
});

describe("ambient store seeding", () => {
  it("prefers a shared link's mix over stored levels", async () => {
    vi.resetModules();
    localStorage.setItem("lofi_ambient_volumes", JSON.stringify({ rain: 0.9 }));
    vi.stubGlobal("location", {
      search: "?ambient=thunder:40",
      pathname: "/",
      origin: "http://localhost",
    });

    const { ambientMix } = await import("../stores/ambientStore");
    expect(ambientMix.thunder).toBeCloseTo(0.4, 2);
    expect(ambientMix.rain).toBe(0);

    vi.unstubAllGlobals();
  });
});

describe("ambient-only toggle", () => {
  it("mutes the music without muting the ambient mix", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);

    fireEvent.click(screen.getByLabelText(/Ambient Only/i));

    expect(playerState.isMusicMuted).toBe(true);
    expect(playerState.isMuted).toBe(false);
  });

  it("warns when it would leave nothing audible", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText(/Ambient Only/i));

    expect(screen.getByText(/Nothing is playing/i)).toBeInTheDocument();
  });

  it("drops the warning once a track is raised", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText(/Ambient Only/i));
    fireEvent.click(screen.getByRole("button", { name: "Rainy Night" }));

    expect(screen.queryByText(/Nothing is playing/i)).not.toBeInTheDocument();
  });

  it("reflects the stored state when reopened", () => {
    setMusicMuted(true);
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    expect(screen.getByLabelText(/Ambient Only/i)).toBeChecked();
  });
});

describe("audio routing", () => {
  it("keeps the ambient mix audible while the music is muted", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);

    fireEvent.input(slider("Rain"), { target: { value: "0.7" } });
    fireEvent.click(screen.getByLabelText(/Ambient Only/i));

    expect(lastEngineState().levels.rain).toBeCloseTo(0.7, 2);
    expect(lastEngineState().master).toBe(1);
  });

  it("still silences the ambient mix on master mute", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);

    fireEvent.input(slider("Rain"), { target: { value: "0.7" } });
    setMuted(true);

    expect(lastEngineState().master).toBe(0);
    setMuted(false);
    expect(lastEngineState().master).toBe(1);
  });

  it("applies the ambient master volume and remembers it", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);

    fireEvent.input(screen.getByLabelText("Ambient master volume"), {
      target: { value: "0.4" },
    });

    expect(lastEngineState().master).toBeCloseTo(0.4, 2);
    expect(localStorage.getItem("lofi_ambient_master")).toBe("0.4");
  });
});

describe("custom presets", () => {
  const saveAs = (name: string) => {
    fireEvent.click(screen.getByRole("button", { name: "+ Save mix" }));
    fireEvent.input(screen.getByLabelText("Preset name"), { target: { value: name } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
  };

  it("only offers saving once something is playing", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    expect(screen.queryByRole("button", { name: "+ Save mix" })).not.toBeInTheDocument();

    fireEvent.input(slider("Rain"), { target: { value: "0.3" } });
    expect(screen.getByRole("button", { name: "+ Save mix" })).toBeInTheDocument();
  });

  it("saves the current mix as a chip that restores it", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    fireEvent.input(slider("Rain"), { target: { value: "0.3" } });
    fireEvent.input(slider("Vinyl"), { target: { value: "0.6" } });
    saveAs("My Desk");

    const chip = screen.getByRole("button", { name: "My Desk" });
    expect(chip).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    fireEvent.click(chip);
    expect(Number(slider("Rain").value)).toBeCloseTo(0.3, 2);
    expect(Number(slider("Vinyl").value)).toBeCloseTo(0.6, 2);

    const stored = JSON.parse(localStorage.getItem("lofi_ambient_presets")!);
    expect(stored).toEqual([expect.objectContaining({ name: "My Desk" })]);
  });

  it("deletes a saved preset", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    fireEvent.input(slider("Rain"), { target: { value: "0.3" } });
    saveAs("Temp");

    fireEvent.click(screen.getByRole("button", { name: "Delete preset Temp" }));

    expect(screen.queryByRole("button", { name: "Temp" })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("lofi_ambient_presets")!)).toEqual([]);
  });

  it("cancels naming with Escape", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    fireEvent.input(slider("Rain"), { target: { value: "0.3" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Save mix" }));

    fireEvent.keyDown(screen.getByLabelText("Preset name"), { key: "Escape" });

    expect(screen.queryByLabelText("Preset name")).not.toBeInTheDocument();
  });
});

describe("fade-out timer", () => {
  afterEach(() => vi.useRealTimers());

  it("fades the ambient mix out when the timer ends, then resumes on demand", () => {
    vi.useFakeTimers();
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    fireEvent.input(slider("Rain"), { target: { value: "0.5" } });

    fireEvent.click(screen.getByRole("button", { name: /in 15 minutes/ }));
    expect(screen.getByText("Fade out · 15m")).toBeInTheDocument();

    vi.advanceTimersByTime(15 * 60_000);

    expect(isAsleep()).toBe(true);
    expect(lastEngineState().master).toBe(0);
    expect(lastEngineState().masterFadeSeconds).toBe(30);
    expect(Number(slider("Rain").value)).toBeCloseTo(0.5, 2);

    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(lastEngineState().master).toBe(1);
  });

  it("cancels when the active duration is pressed again", () => {
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    const thirty = screen.getByRole("button", { name: /in 30 minutes/ });

    fireEvent.click(thirty);
    expect(thirty).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(thirty);
    expect(thirty).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Fade out")).toBeInTheDocument();
  });

  it("wakes up when the mix is touched", () => {
    vi.useFakeTimers();
    render(() => <AmbientMixer isOpen onClose={() => {}} />);
    fireEvent.input(slider("Rain"), { target: { value: "0.5" } });
    fireEvent.click(screen.getByRole("button", { name: /in 15 minutes/ }));
    vi.advanceTimersByTime(15 * 60_000);

    fireEvent.input(slider("Rain"), { target: { value: "0.6" } });

    expect(isAsleep()).toBe(false);
    expect(lastEngineState().master).toBe(1);
  });
});
