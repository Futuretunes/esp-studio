import { describe, expect, it } from "vitest";

import {
  isFirmwareChipCompatible,
  sortFirmwareEntriesByChipPreference,
} from "@/features/flash/chip-compatibility";

describe("isFirmwareChipCompatible", () => {
  it("treats empty chipFamilies as compatible with any device", () => {
    expect(isFirmwareChipCompatible([], "esp32")).toBe(true);
    expect(isFirmwareChipCompatible(undefined, "esp8266")).toBe(true);
  });

  it("treats unknown device chip as compatible", () => {
    expect(isFirmwareChipCompatible(["esp32"], "unknown")).toBe(true);
    expect(isFirmwareChipCompatible(["esp32"], null)).toBe(true);
  });

  it("matches listed families only when the device chip is known", () => {
    expect(isFirmwareChipCompatible(["esp32", "esp32-s3"], "esp32")).toBe(
      true,
    );
    expect(isFirmwareChipCompatible(["esp32"], "esp8266")).toBe(false);
  });
});

describe("sortFirmwareEntriesByChipPreference", () => {
  it("orders compatible entries before incompatible ones", () => {
    const sorted = sortFirmwareEntriesByChipPreference(
      [
        { manifest: { title: "B", chipFamilies: ["esp8266"] } },
        { manifest: { title: "A", chipFamilies: ["esp32"] } },
        { manifest: { title: "C", chipFamilies: [] } },
      ],
      "esp32",
    );

    expect(sorted.map((entry) => entry.manifest.title)).toEqual([
      "A",
      "C",
      "B",
    ]);
  });
});
