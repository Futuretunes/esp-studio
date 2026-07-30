import { describe, expect, it } from "vitest";

import {
  classifyFirmwareImageRole,
  formatFirmwarePackageKind,
  summarizeFirmwarePackage,
} from "@/features/firmware/firmware-package-kind";
import { parseFirmwareManifestJson } from "@/features/firmware/FirmwareManifestParser";

describe("classifyFirmwareImageRole", () => {
  it("classifies bootloader / partition / boot_app0 / application from labels", () => {
    expect(
      classifyFirmwareImageRole({ id: "bl", label: "bootloader" }),
    ).toBe("bootloader");
    expect(
      classifyFirmwareImageRole({
        id: "pt",
        label: "partition-table",
        path: "partition-table.bin",
      }),
    ).toBe("partition-table");
    expect(
      classifyFirmwareImageRole({ id: "ota", label: "boot_app0" }),
    ).toBe("boot-app0");
    expect(
      classifyFirmwareImageRole({ id: "app", label: "application" }),
    ).toBe("application");
  });

  it("does not invent roles from addresses alone", () => {
    expect(
      classifyFirmwareImageRole({ id: "seg", label: "segment" }),
    ).toBe("other");
  });
});

describe("summarizeFirmwarePackage", () => {
  it("marks local single application images as application-only", () => {
    const summary = summarizeFirmwarePackage({
      images: [
        {
          id: "app",
          label: "application",
          address: 0x10000,
          size: 128,
          required: true,
        },
      ],
    });
    expect(summary.kind).toBe("application-only");
    expect(summary.hasApplication).toBe(true);
    expect(summary.hasBootloader).toBe(false);
  });

  it("marks multi-image bootloader bundles as complete", () => {
    const summary = summarizeFirmwarePackage({
      images: [
        { id: "bl", label: "bootloader", address: 0x0, required: true },
        {
          id: "pt",
          label: "partition-table",
          address: 0x8000,
          required: true,
        },
        { id: "app", label: "application", address: 0x10000, required: true },
      ],
    });
    expect(summary.kind).toBe("complete");
    expect(formatFirmwarePackageKind(summary.kind)).toBe(
      "Complete firmware package",
    );
  });

  it("honors explicit packageKind from the manifest", () => {
    const summary = summarizeFirmwarePackage({
      packageKind: "complete",
      images: [
        {
          id: "app",
          label: "application",
          address: 0x10000,
          required: true,
        },
      ],
    });
    expect(summary.kind).toBe("complete");
    expect(summary.kindSource).toBe("manifest");
  });
});

describe("multi-image manifest parsing", () => {
  it("parses complete packages with required flags", () => {
    const result = parseFirmwareManifestJson(
      JSON.stringify({
        schemaVersion: 1,
        id: "factory",
        title: "Factory Bundle",
        sourceKind: "github",
        packageKind: "complete",
        chipFamilies: ["esp32"],
        images: [
          {
            id: "bootloader",
            label: "bootloader",
            address: "0x1000",
            path: "bootloader.bin",
            required: true,
          },
          {
            id: "partition-table",
            label: "partition-table",
            address: "0x8000",
            path: "partition-table.bin",
            required: true,
          },
          {
            id: "boot_app0",
            label: "boot_app0",
            address: "0xe000",
            path: "boot_app0.bin",
            required: false,
          },
          {
            id: "app",
            label: "application",
            address: "0x10000",
            path: "app.bin",
            required: true,
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.document.packageKind).toBe("complete");
    expect(result.document.images).toHaveLength(4);
    expect(result.document.images[2]?.required).toBe(false);
    expect(result.document.images[0]?.address).toBe(0x1000);
  });

  it("keeps single-bin manifests backwards compatible", () => {
    const result = parseFirmwareManifestJson(
      JSON.stringify({
        schemaVersion: 1,
        id: "app-only",
        title: "App",
        sourceKind: "local",
        chipFamilies: [],
        images: [
          {
            id: "app",
            label: "application",
            address: 65536,
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.document.packageKind).toBeUndefined();
    expect(result.document.images[0]?.required).toBeUndefined();
  });
});
