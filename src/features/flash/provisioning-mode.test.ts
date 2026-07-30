import { describe, expect, it } from "vitest";

import {
  APP_ONLY_PRESERVE_MESSAGE,
  BLANK_APP_ONLY_STOP_MESSAGE,
} from "@/features/flash/flash-strategy";
import {
  buildProvisioningSummary,
  planProvisioningInstall,
  resolveProvisioningFilesystem,
} from "@/features/flash/provisioning-mode";
import { summarizeFirmwarePackage } from "@/features/firmware/firmware-package-kind";

const appOnly = summarizeFirmwarePackage({
  packageKind: "application-only",
  images: [
    {
      id: "app",
      label: "application",
      address: 0x10000,
      size: 64,
      required: true,
    },
  ],
});

const complete = summarizeFirmwarePackage({
  packageKind: "complete",
  images: [
    { id: "bl", label: "bootloader", address: 0x0, required: true },
    { id: "pt", label: "partition-table", address: 0x8000, required: true },
    { id: "app", label: "application", address: 0x10000, required: true },
  ],
});

describe("resolveProvisioningFilesystem", () => {
  it("returns null for none / undefined", () => {
    expect(resolveProvisioningFilesystem(undefined)).toBeNull();
    expect(resolveProvisioningFilesystem("none")).toBeNull();
  });

  it("auto-selects a single supported filesystem", () => {
    expect(resolveProvisioningFilesystem("spiffs")).toBe("spiffs");
    expect(resolveProvisioningFilesystem("littlefs")).toBe("littlefs");
  });

  it("prefers user choice when both are supported", () => {
    expect(resolveProvisioningFilesystem("both", "spiffs")).toBe("spiffs");
    expect(resolveProvisioningFilesystem("both", "littlefs")).toBe("littlefs");
    expect(resolveProvisioningFilesystem("both")).toBe("littlefs");
  });
});

describe("planProvisioningInstall", () => {
  it("always stops blank + application-only regardless of mode", () => {
    for (const mode of ["update", "reinstall", "factory-erase"] as const) {
      const plan = planProvisioningInstall(mode, "blank", appOnly);
      expect(plan.action).toBe("stop");
      if (plan.action !== "stop") {
        continue;
      }
      expect(plan.code).toBe("blank-app-only");
      expect(plan.message).toBe(BLANK_APP_ONLY_STOP_MESSAGE);
    }
  });

  it("update requires application-only packages", () => {
    const plan = planProvisioningInstall("update", "existing", complete);
    expect(plan.action).toBe("stop");
    if (plan.action !== "stop") {
      return;
    }
    expect(plan.code).toBe("update-requires-app-only");
  });

  it("update confirms app-only overwrite and preserves bootloader", () => {
    const plan = planProvisioningInstall("update", "existing", appOnly);
    expect(plan.action).toBe("confirm");
    if (plan.action !== "confirm") {
      return;
    }
    expect(plan.code).toBe("update-app");
    expect(plan.eraseAll).toBe(false);
    expect(plan.requireTypedErase).toBe(false);
    expect(plan.preserveBootloader).toBe(true);
    expect(plan.message).toContain(APP_ONLY_PRESERVE_MESSAGE);
  });

  it("reinstall requires a complete package", () => {
    const plan = planProvisioningInstall("reinstall", "existing", appOnly);
    expect(plan.action).toBe("stop");
    if (plan.action !== "stop") {
      return;
    }
    expect(plan.code).toBe("reinstall-requires-complete");
  });

  it("reinstall continues on blank complete without confirmation", () => {
    const plan = planProvisioningInstall(
      "reinstall",
      "blank",
      complete,
      "spiffs",
    );
    expect(plan.action).toBe("continue");
    if (plan.action !== "continue") {
      return;
    }
    expect(plan.eraseAll).toBe(false);
    expect(plan.filesystemChoice).toBe("spiffs");
  });

  it("reinstall confirms on existing complete", () => {
    const plan = planProvisioningInstall(
      "reinstall",
      "existing",
      complete,
      "littlefs",
    );
    expect(plan.action).toBe("confirm");
    if (plan.action !== "confirm") {
      return;
    }
    expect(plan.code).toBe("reinstall");
    expect(plan.eraseAll).toBe(false);
    expect(plan.requireTypedErase).toBe(false);
    expect(plan.filesystemChoice).toBe("littlefs");
  });

  it("factory erase requires a complete package", () => {
    const plan = planProvisioningInstall("factory-erase", "existing", appOnly);
    expect(plan.action).toBe("stop");
    if (plan.action !== "stop") {
      return;
    }
    expect(plan.code).toBe("factory-requires-complete");
  });

  it("factory erase requires typed ERASE and eraseAll", () => {
    const plan = planProvisioningInstall(
      "factory-erase",
      "existing",
      complete,
      "littlefs",
    );
    expect(plan.action).toBe("confirm");
    if (plan.action !== "confirm") {
      return;
    }
    expect(plan.code).toBe("factory-erase");
    expect(plan.eraseAll).toBe(true);
    expect(plan.requireTypedErase).toBe(true);
    expect(plan.message).toContain("Type ERASE");
  });
});

describe("buildProvisioningSummary", () => {
  it("lists update preserve/write sets", () => {
    const summary = buildProvisioningSummary({
      mode: "update",
      packageSummary: appOnly,
      chipLabel: "ESP32",
      flashSize: "4MB",
      deviceOutcome: "existing",
      currentFilesystem: null,
      selectedFilesystem: null,
      projectLabel: "Demo",
      versionLabel: "1.0.0",
    });
    expect(summary.writes).toContain("Application");
    expect(summary.preserves).toContain("Bootloader");
    expect(summary.erases).toContain("Application (overwrite)");
  });

  it("includes selected filesystem on reinstall writes", () => {
    const summary = buildProvisioningSummary({
      mode: "reinstall",
      packageSummary: complete,
      chipLabel: null,
      flashSize: null,
      deviceOutcome: null,
      currentFilesystem: "unknown",
      selectedFilesystem: "spiffs",
      projectLabel: null,
      versionLabel: null,
    });
    expect(summary.writes).toContain("SPIFFS");
  });
});
