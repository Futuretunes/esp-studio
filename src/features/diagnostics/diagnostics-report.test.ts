import { describe, expect, it } from "vitest";

import { EMPTY_DEVICE_CAPABILITIES } from "@/core/device";
import {
  collectDiagnosticsReport,
  DIAGNOSTICS_REPORT_SCHEMA_VERSION,
  serializeDiagnosticsReport,
} from "@/features/diagnostics/diagnostics-report";

const BASE_BROWSER = {
  userAgent: "Vitest",
  platform: "test",
  language: "en-US",
  webSerialAvailable: true,
} as const;

const BASE_APPLICATION = {
  version: "0.1.0",
  commit: "abc1234",
  builtAt: "2026-07-30T12:00:00.000Z",
} as const;

describe("collectDiagnosticsReport", () => {
  it("builds a schemaVersion 1 report without a device", () => {
    const report = collectDiagnosticsReport({
      application: BASE_APPLICATION,
      webSerialSupported: true,
      isConnecting: false,
      isDisconnecting: false,
      errorKind: null,
      errorMessage: null,
      activeDevice: null,
      deviceMetadata: null,
      recentProjectId: null,
      recentProjectName: null,
      recentRepository: null,
      browser: BASE_BROWSER,
      generatedAt: "2026-07-30T16:00:00.000Z",
    });

    expect(report.schemaVersion).toBe(DIAGNOSTICS_REPORT_SCHEMA_VERSION);
    expect(report.generatedAt).toBe("2026-07-30T16:00:00.000Z");
    expect(report.device).toBeNull();
    expect(report.recentErrors).toEqual([]);
    expect(report.application.version).toBe("0.1.0");
    expect(report.browser.webSerialAvailable).toBe(true);
    expect(report.firmware.version).toBeNull();
  });

  it("includes device snapshot, metadata chip name, and reserved null fields", () => {
    const report = collectDiagnosticsReport({
      application: BASE_APPLICATION,
      webSerialSupported: true,
      isConnecting: false,
      isDisconnecting: false,
      errorKind: null,
      errorMessage: null,
      activeDevice: {
        id: "dev-1",
        name: "ESP32 DevKit",
        providerId: "web-serial",
        providerLabel: "Web Serial",
        chipFamily: "esp32",
        status: "connected",
        transportLabel: "USB Serial",
        capabilities: {
          ...EMPTY_DEVICE_CAPABILITIES,
          serial: true,
          flash: true,
          filesystem: true,
        },
      },
      deviceMetadata: { espToolChipName: "ESP32-D0WDQ6" },
      recentProjectId: "wled",
      recentProjectName: "WLED",
      recentRepository: "Aircoookie/WLED",
      browser: BASE_BROWSER,
      generatedAt: "2026-07-30T16:00:00.000Z",
    });

    expect(report.device).not.toBeNull();
    expect(report.device?.chipFamily).toBe("esp32");
    expect(report.device?.chipRawName).toBe("ESP32-D0WDQ6");
    expect(report.device?.chipRevision).toBeNull();
    expect(report.device?.flashSize).toBeNull();
    expect(report.device?.flashManufacturer).toBeNull();
    expect(report.device?.filesystemType).toBeNull();
    expect(report.firmware.recentProjectName).toBe("WLED");
  });

  it("marks filesystem unsupported when capability is false", () => {
    const report = collectDiagnosticsReport({
      application: BASE_APPLICATION,
      webSerialSupported: false,
      isConnecting: false,
      isDisconnecting: false,
      errorKind: null,
      errorMessage: null,
      activeDevice: {
        id: "dev-2",
        name: "Board",
        providerId: "web-serial",
        providerLabel: "Web Serial",
        chipFamily: "unknown",
        status: "connected",
        capabilities: EMPTY_DEVICE_CAPABILITIES,
      },
      deviceMetadata: null,
      recentProjectId: null,
      recentProjectName: null,
      recentRepository: null,
      browser: { ...BASE_BROWSER, webSerialAvailable: false },
    });

    expect(report.device?.filesystemType).toBe("unsupported");
  });

  it("captures the current device UI error as recentErrors", () => {
    const report = collectDiagnosticsReport({
      application: BASE_APPLICATION,
      webSerialSupported: true,
      isConnecting: false,
      isDisconnecting: false,
      errorKind: "lost",
      errorMessage: "Device disconnected unexpectedly.",
      activeDevice: null,
      deviceMetadata: null,
      recentProjectId: null,
      recentProjectName: null,
      recentRepository: null,
      browser: BASE_BROWSER,
    });

    expect(report.recentErrors).toEqual([
      {
        source: "device-ui",
        kind: "lost",
        message: "Device disconnected unexpectedly.",
      },
    ]);
    expect(report.connection.errorKind).toBe("lost");
  });
});

describe("serializeDiagnosticsReport", () => {
  it("pretty-prints JSON without serial or filesystem payloads", () => {
    const report = collectDiagnosticsReport({
      application: BASE_APPLICATION,
      webSerialSupported: true,
      isConnecting: false,
      isDisconnecting: false,
      errorKind: null,
      errorMessage: null,
      activeDevice: null,
      deviceMetadata: null,
      recentProjectId: null,
      recentProjectName: null,
      recentRepository: null,
      browser: BASE_BROWSER,
      generatedAt: "2026-07-30T16:00:00.000Z",
    });

    const text = serializeDiagnosticsReport(report);
    expect(text.endsWith("\n")).toBe(true);
    expect(text).toContain('"schemaVersion": 1');
    expect(text).not.toContain("serialLog");
    expect(text).not.toContain("fileContents");
    expect(JSON.parse(text)).toMatchObject({
      schemaVersion: 1,
      application: BASE_APPLICATION,
    });
  });
});
