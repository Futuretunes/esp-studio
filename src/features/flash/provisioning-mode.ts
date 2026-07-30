/**
 * Explicit flash / provisioning modes for ESP Studio Install.
 *
 * Pure planning helpers — no hardware access.
 */

import type { FlashInspectionOutcome } from "@/features/flash/flash-inspection";
import {
  APP_ONLY_PRESERVE_MESSAGE,
  BLANK_APP_ONLY_STOP_MESSAGE,
} from "@/features/flash/flash-strategy";
import {
  formatFirmwarePackageKind,
  type FirmwarePackageKind,
  type FirmwarePackageSummary,
} from "@/features/firmware/firmware-package-kind";
import type { FirmwareFilesystemSupport } from "@/features/firmware/FirmwareManifestSchema";

/**
 * User-selected install mode.
 */
export type ProvisioningMode = "update" | "reinstall" | "factory-erase";

/**
 * Filesystem layout choice when reinstalling.
 */
export type ProvisioningFilesystemChoice = "spiffs" | "littlefs";

/**
 * Structured provisioning summary for Install UI.
 */
export type ProvisioningSummary = {
  readonly mode: ProvisioningMode;
  readonly packageKind: FirmwarePackageKind;
  readonly chipLabel: string | null;
  readonly flashSize: string | null;
  readonly deviceOutcome: FlashInspectionOutcome | null;
  readonly currentFilesystem: ProvisioningFilesystemChoice | "unknown" | null;
  readonly selectedFilesystem: ProvisioningFilesystemChoice | null;
  readonly projectLabel: string | null;
  readonly versionLabel: string | null;
  readonly erases: readonly string[];
  readonly preserves: readonly string[];
  readonly writes: readonly string[];
};

/**
 * Install plan for a selected provisioning mode.
 */
export type ProvisioningPlan =
  | {
      readonly action: "stop";
      readonly code:
        | "blank-app-only"
        | "update-requires-app-only"
        | "reinstall-requires-complete"
        | "factory-requires-complete";
      readonly message: string;
      readonly mode: ProvisioningMode;
      readonly packageKind: FirmwarePackageKind;
    }
  | {
      readonly action: "continue";
      readonly notice: string;
      readonly mode: ProvisioningMode;
      readonly packageKind: FirmwarePackageKind;
      readonly eraseAll: boolean;
      readonly filesystemChoice: ProvisioningFilesystemChoice | null;
    }
  | {
      readonly action: "confirm";
      readonly code:
        | "update-app"
        | "reinstall"
        | "factory-erase";
      readonly message: string;
      readonly mode: ProvisioningMode;
      readonly packageKind: FirmwarePackageKind;
      readonly eraseAll: boolean;
      readonly requireTypedErase: boolean;
      readonly preserveBootloader: boolean;
      readonly filesystemChoice: ProvisioningFilesystemChoice | null;
    };

/**
 * Formats a mode for UI labels.
 *
 * @param mode - Provisioning mode
 */
export function formatProvisioningMode(mode: ProvisioningMode): string {
  switch (mode) {
    case "update":
      return "Update firmware";
    case "reinstall":
      return "Reinstall firmware";
    case "factory-erase":
      return "Factory erase";
  }
}

/**
 * Picks a filesystem when the package declares support.
 *
 * @param support - Manifest filesystem support
 * @param preferred - Optional user preference when both are supported
 */
export function resolveProvisioningFilesystem(
  support: FirmwareFilesystemSupport | undefined,
  preferred: ProvisioningFilesystemChoice | null = null,
): ProvisioningFilesystemChoice | null {
  if (support === undefined || support === "none") {
    return null;
  }
  if (support === "spiffs") {
    return "spiffs";
  }
  if (support === "littlefs") {
    return "littlefs";
  }
  // both
  return preferred ?? "littlefs";
}

/**
 * Plans install for the selected mode + device inspection + package.
 *
 * @param mode - User mode
 * @param deviceOutcome - Pre-flash inspection
 * @param packageSummary - Selected package
 * @param filesystemChoice - Resolved FS choice for reinstall/factory
 */
export function planProvisioningInstall(
  mode: ProvisioningMode,
  deviceOutcome: FlashInspectionOutcome,
  packageSummary: FirmwarePackageSummary,
  filesystemChoice: ProvisioningFilesystemChoice | null = null,
): ProvisioningPlan {
  const packageKind = packageSummary.kind;

  if (
    deviceOutcome === "blank" &&
    packageKind === "application-only"
  ) {
    return {
      action: "stop",
      code: "blank-app-only",
      message: BLANK_APP_ONLY_STOP_MESSAGE,
      mode,
      packageKind,
    };
  }

  if (mode === "update") {
    if (packageKind !== "application-only") {
      return {
        action: "stop",
        code: "update-requires-app-only",
        message: [
          "Update firmware only overwrites the application image.",
          "",
          "The selected package is a complete firmware layout.",
          "Choose Reinstall firmware to rewrite bootloader and partitions,",
          "or select an application-only package.",
        ].join("\n"),
        mode,
        packageKind,
      };
    }

    if (deviceOutcome === "blank") {
      return {
        action: "stop",
        code: "blank-app-only",
        message: BLANK_APP_ONLY_STOP_MESSAGE,
        mode,
        packageKind,
      };
    }

    return {
      action: "confirm",
      code: "update-app",
      message: [
        APP_ONLY_PRESERVE_MESSAGE,
        "",
        "Preserved: bootloader, partition table, NVS, calibration, filesystem.",
        "Overwritten: application only.",
      ].join("\n"),
      mode,
      packageKind,
      eraseAll: false,
      requireTypedErase: false,
      preserveBootloader: true,
      filesystemChoice: null,
    };
  }

  if (mode === "reinstall") {
    if (packageKind !== "complete") {
      return {
        action: "stop",
        code: "reinstall-requires-complete",
        message: [
          "Reinstall firmware needs a complete package",
          "(bootloader, partition table, application).",
          "",
          "The selected firmware is application-only.",
          "Choose Update firmware for an app-only update,",
          "or select a complete firmware package.",
        ].join("\n"),
        mode,
        packageKind,
      };
    }

    const fsLine =
      filesystemChoice === null
        ? "Filesystem: use layout from the firmware package."
        : `Filesystem: ${filesystemChoice === "spiffs" ? "SPIFFS" : "LittleFS"}.`;

    if (deviceOutcome === "blank") {
      return {
        action: "continue",
        notice: [
          "This device appears to be empty.",
          "Reinstall will write a complete bootable layout.",
          fsLine,
        ].join("\n"),
        mode,
        packageKind,
        eraseAll: false,
        filesystemChoice,
      };
    }

    return {
      action: "confirm",
      code: "reinstall",
      message: [
        "Reinstall firmware will rewrite:",
        "• Bootloader",
        "• Partition table",
        "• boot_app0 (when present)",
        "• Application",
        "",
        "Preserved: factory calibration, MAC, eFuse data.",
        fsLine,
      ].join("\n"),
      mode,
      packageKind,
      eraseAll: false,
      requireTypedErase: false,
      preserveBootloader: false,
      filesystemChoice,
    };
  }

  // factory-erase
  if (packageKind !== "complete") {
    return {
      action: "stop",
      code: "factory-requires-complete",
      message: [
        "Factory erase clears user flash and must reinstall a complete package.",
        "",
        `Selected package is ${formatFirmwarePackageKind(packageKind).toLowerCase()}.`,
        "Select a complete firmware package first.",
      ].join("\n"),
      mode,
      packageKind,
    };
  }

  return {
    action: "confirm",
    code: "factory-erase",
    message: [
      "Factory erase will completely erase user flash, then write a complete package.",
      "",
      "Erased: application, bootloader, partitions, filesystem, NVS (user data).",
      "NOT erased: eFuse, factory MAC, chip calibration, Boot ROM.",
      "",
      'Type ERASE to confirm.',
    ].join("\n"),
    mode,
    packageKind,
    eraseAll: true,
    requireTypedErase: true,
    preserveBootloader: false,
    filesystemChoice,
  };
}

/**
 * Builds a user-facing provisioning summary.
 */
export function buildProvisioningSummary(options: {
  readonly mode: ProvisioningMode;
  readonly packageSummary: FirmwarePackageSummary | null;
  readonly chipLabel: string | null;
  readonly flashSize: string | null;
  readonly deviceOutcome: FlashInspectionOutcome | null;
  readonly currentFilesystem: ProvisioningFilesystemChoice | "unknown" | null;
  readonly selectedFilesystem: ProvisioningFilesystemChoice | null;
  readonly projectLabel: string | null;
  readonly versionLabel: string | null;
}): ProvisioningSummary {
  const packageKind = options.packageSummary?.kind ?? "application-only";
  const erases: string[] = [];
  const preserves: string[] = [];
  const writes: string[] = [];

  if (options.mode === "update") {
    erases.push("Application (overwrite)");
    preserves.push(
      "Bootloader",
      "Partition table",
      "NVS",
      "Calibration",
      "Filesystem",
    );
    writes.push("Application");
  } else if (options.mode === "reinstall") {
    erases.push("Application", "Bootloader", "Partition table", "boot_app0");
    preserves.push("Factory calibration", "MAC", "eFuse");
    writes.push("Bootloader", "Partition table", "boot_app0", "Application");
    if (options.selectedFilesystem) {
      writes.push(
        options.selectedFilesystem === "spiffs" ? "SPIFFS" : "LittleFS",
      );
    }
  } else {
    erases.push("All user flash (bootloader, partitions, app, FS, NVS)");
    preserves.push("eFuse", "Factory MAC", "Chip calibration", "Boot ROM");
    writes.push("Complete firmware package");
  }

  return {
    mode: options.mode,
    packageKind,
    chipLabel: options.chipLabel,
    flashSize: options.flashSize,
    deviceOutcome: options.deviceOutcome,
    currentFilesystem: options.currentFilesystem,
    selectedFilesystem: options.selectedFilesystem,
    projectLabel: options.projectLabel,
    versionLabel: options.versionLabel,
    erases,
    preserves,
    writes,
  };
}
