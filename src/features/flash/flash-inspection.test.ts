import { describe, expect, it } from "vitest";

import {
  ESP_IMAGE_MAGIC,
  aggregateFlashInspectionOutcome,
  classifyFlashRegionBytes,
  createFailedFlashInspectionReport,
  createFlashInspectionReport,
  flashInspectionRequiresConfirmation,
  formatFlashInspectionMessage,
} from "@/features/flash/flash-inspection";

describe("classifyFlashRegionBytes", () => {
  it("classifies erased flash as blank", () => {
    expect(classifyFlashRegionBytes(new Uint8Array(32).fill(0xff))).toBe(
      "blank",
    );
  });

  it("classifies ESP image magic as image", () => {
    const bytes = new Uint8Array(32).fill(0);
    bytes[0] = ESP_IMAGE_MAGIC;
    expect(classifyFlashRegionBytes(bytes)).toBe("image");
  });

  it("classifies other non-blank data as unknown", () => {
    const bytes = new Uint8Array(32).fill(0);
    bytes[0] = 0x12;
    expect(classifyFlashRegionBytes(bytes)).toBe("unknown");
  });

  it("treats empty buffers as unknown", () => {
    expect(classifyFlashRegionBytes(new Uint8Array(0))).toBe("unknown");
  });
});

describe("aggregateFlashInspectionOutcome", () => {
  it("is blank only when every region is blank", () => {
    expect(
      aggregateFlashInspectionOutcome([
        { address: 0, status: "blank" },
        { address: 0x10000, status: "blank" },
      ]),
    ).toBe("blank");
  });

  it("prefers existing when any region has an image", () => {
    expect(
      aggregateFlashInspectionOutcome([
        { address: 0, status: "blank" },
        { address: 0x10000, status: "image" },
      ]),
    ).toBe("existing");
  });

  it("returns unknown when non-blank without magic", () => {
    expect(
      aggregateFlashInspectionOutcome([
        { address: 0, status: "blank" },
        { address: 0x10000, status: "unknown" },
      ]),
    ).toBe("unknown");
  });
});

describe("formatFlashInspectionMessage", () => {
  it("returns the blank device copy", () => {
    expect(formatFlashInspectionMessage("blank")).toBe(
      "This device appears to be empty.",
    );
  });

  it("returns the failed inspection copy", () => {
    expect(formatFlashInspectionMessage("failed")).toContain(
      "Flash inspection failed",
    );
  });
});

describe("flashInspectionRequiresConfirmation", () => {
  it("skips confirmation only for blank flash", () => {
    expect(flashInspectionRequiresConfirmation("blank")).toBe(false);
    expect(flashInspectionRequiresConfirmation("existing")).toBe(true);
    expect(flashInspectionRequiresConfirmation("unknown")).toBe(true);
    expect(flashInspectionRequiresConfirmation("failed")).toBe(true);
  });
});

describe("createFlashInspectionReport", () => {
  it("aggregates regions and attaches known chip metadata only", () => {
    const report = createFlashInspectionReport(
      [{ address: 0x10000, status: "image" }],
      { chipFamily: "esp32-c3", rawChipName: "ESP32-C3", flashSize: "4MB" },
    );
    expect(report.outcome).toBe("existing");
    expect(report.chipFamily).toBe("esp32-c3");
    expect(report.flashSize).toBe("4MB");
    expect(report.message).toBe("Existing firmware detected.");
  });
});

describe("createFailedFlashInspectionReport", () => {
  it("returns a failed outcome with empty regions", () => {
    const report = createFailedFlashInspectionReport();
    expect(report.outcome).toBe("failed");
    expect(report.regions).toEqual([]);
  });
});
