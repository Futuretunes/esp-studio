import { describe, expect, it } from "vitest";

import {
  APP_ONLY_PRESERVE_MESSAGE,
  BLANK_APP_ONLY_STOP_MESSAGE,
  POST_FLASH_NOT_BOOTABLE_MESSAGE,
  planFlashInstall,
} from "@/features/flash/flash-strategy";
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

describe("planFlashInstall", () => {
  it("stops blank device + application-only firmware", () => {
    const plan = planFlashInstall("blank", appOnly);
    expect(plan.action).toBe("stop");
    if (plan.action !== "stop") {
      return;
    }
    expect(plan.code).toBe("blank-app-only");
    expect(plan.message).toBe(BLANK_APP_ONLY_STOP_MESSAGE);
  });

  it("continues blank device + complete package without confirmation", () => {
    const plan = planFlashInstall("blank", complete);
    expect(plan.action).toBe("continue");
    if (plan.action !== "continue") {
      return;
    }
    expect(plan.notice).toBe("This device appears to be empty.");
  });

  it("requires confirmation for existing firmware + application-only update", () => {
    const plan = planFlashInstall("existing", appOnly);
    expect(plan.action).toBe("confirm");
    if (plan.action !== "confirm") {
      return;
    }
    expect(plan.code).toBe("app-only-preserve");
    expect(plan.preserveBootloader).toBe(true);
    expect(plan.message).toBe(APP_ONLY_PRESERVE_MESSAGE);
  });

  it("requires overwrite confirmation for existing + complete package", () => {
    const plan = planFlashInstall("existing", complete);
    expect(plan.action).toBe("confirm");
    if (plan.action !== "confirm") {
      return;
    }
    expect(plan.code).toBe("overwrite");
    expect(plan.preserveBootloader).toBe(false);
  });

  it("requires confirmation when inspection is unknown or failed", () => {
    expect(planFlashInstall("unknown", complete).action).toBe("confirm");
    expect(planFlashInstall("failed", appOnly).action).toBe("confirm");
  });
});

describe("post-flash messaging", () => {
  it("exposes a clear not-bootable message", () => {
    expect(POST_FLASH_NOT_BOOTABLE_MESSAGE).toContain("not bootable");
    expect(POST_FLASH_NOT_BOOTABLE_MESSAGE).toContain(
      "Application-only firmware on a blank ESP",
    );
  });
});
