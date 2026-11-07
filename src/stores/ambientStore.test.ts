import { describe, expect, it } from "vite-plus/test";
import { MAX_CUSTOM_PRESETS, PRESET_NAME_MAX_LENGTH, sanitiseCustomPresets } from "./ambientStore";

describe("sanitiseCustomPresets", () => {
  it("keeps valid presets and drops silent or unknown sounds", () => {
    const presets = sanitiseCustomPresets([
      { id: "a", name: "  Desk  ", mix: { rain: 0.4, notInstalled: 0.9, fire: 0 } },
    ]);
    expect(presets).toEqual([{ id: "a", name: "Desk", mix: { rain: 0.4 } }]);
  });

  it("rejects malformed entries", () => {
    expect(sanitiseCustomPresets("nope")).toEqual([]);
    expect(
      sanitiseCustomPresets([
        null,
        { id: 1, name: "x", mix: { rain: 1 } },
        { id: "b", name: "   ", mix: { rain: 1 } },
        { id: "c", name: "Empty", mix: { rain: 0 } },
        { id: "d", name: "No mix" },
      ]),
    ).toEqual([]);
  });

  it("clamps levels, trims long names and drops duplicate ids", () => {
    const presets = sanitiseCustomPresets([
      { id: "a", name: "x".repeat(40), mix: { rain: 4 } },
      { id: "a", name: "Again", mix: { rain: 0.2 } },
    ]);
    expect(presets).toHaveLength(1);
    expect(presets[0].name).toHaveLength(PRESET_NAME_MAX_LENGTH);
    expect(presets[0].mix.rain).toBe(1);
  });

  it("caps how many presets are kept", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
      mix: { rain: 0.5 },
    }));
    expect(sanitiseCustomPresets(many)).toHaveLength(MAX_CUSTOM_PRESETS);
  });
});
