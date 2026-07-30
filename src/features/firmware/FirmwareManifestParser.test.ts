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

  it("rejects invalid JSON", () => {
    const result = parseFirmwareManifestJson("{not-json");
    expect(result.ok).toBe(false);
  });
});
