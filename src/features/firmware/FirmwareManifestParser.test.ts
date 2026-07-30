import { describe, expect, it } from "vitest";

import { parseFirmwareManifestJson } from "@/features/firmware/FirmwareManifestParser";

describe("parseFirmwareManifestJson", () => {
  it("parses a minimal valid schemaVersion 1 document", () => {
    const result = parseFirmwareManifestJson(
      JSON.stringify({
        schemaVersion: 1,
        id: "demo",
        title: "Demo Firmware",
        sourceKind: "local",
        chipFamilies: ["esp32"],
        images: [
          {
            id: "app",
            label: "Application",
            address: 65536,
            path: "firmware.bin",
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.document.id).toBe("demo");
    expect(result.document.images).toHaveLength(1);
  });

  it("parses schemaVersion 2 with filesystemSupport", () => {
    const result = parseFirmwareManifestJson(
      JSON.stringify({
        schemaVersion: 2,
        id: "demo-v2",
        title: "Demo V2",
        sourceKind: "local",
        packageKind: "complete",
        filesystemSupport: "both",
        chipFamilies: ["esp32-s3"],
        images: [
          {
            id: "bootloader",
            label: "bootloader",
            address: 0,
            path: "bootloader.bin",
          },
          {
            id: "partition-table",
            label: "partition-table",
            address: 0x8000,
            path: "partition-table.bin",
          },
          {
            id: "app",
            label: "application",
            address: 0x10000,
            path: "app.bin",
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.document.schemaVersion).toBe(2);
    expect(result.document.filesystemSupport).toBe("both");
    expect(result.document.packageKind).toBe("complete");
  });

  it("rejects invalid filesystemSupport values", () => {
    const result = parseFirmwareManifestJson(
      JSON.stringify({
        schemaVersion: 2,
        id: "bad-fs",
        title: "Bad FS",
        sourceKind: "local",
        filesystemSupport: "fat",
        chipFamilies: ["esp32"],
        images: [
          {
            id: "app",
            label: "application",
            address: 65536,
          },
        ],
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("rejects invalid JSON", () => {
    const result = parseFirmwareManifestJson("{not-json");
    expect(result.ok).toBe(false);
  });
});
