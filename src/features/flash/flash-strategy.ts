/**
 * Pure install planning from device inspection + firmware package kind.
 *
 * Does not talk to hardware.
 */

import type { FlashInspectionOutcome } from "@/features/flash/flash-inspection";
import {
  formatFirmwarePackageKind,
  type FirmwarePackageKind,
  type FirmwarePackageSummary,
} from "@/features/firmware/firmware-package-kind";

/**
 * Install plan produced before any flash write.
 */
export type FlashInstallPlan =
  | {
      readonly action: "stop";
      readonly code: "blank-app-only";
      readonly message: string;
      readonly packageKind: FirmwarePackageKind;
    }
  | {
      readonly action: "continue";
      readonly notice: string;
      readonly packageKind: FirmwarePackageKind;
    }
  | {
      readonly action: "confirm";
      readonly code: "overwrite" | "app-only-preserve";
      readonly message: string;
      readonly packageKind: FirmwarePackageKind;
      readonly preserveBootloader: boolean;
    };

/**
 * Message shown when app-only firmware targets a blank chip.
 */
export const BLANK_APP_ONLY_STOP_MESSAGE = [
  "This firmware only contains the application.",
  "",
  "This ESP appears to be blank and has no bootloader or partition table.",
  "",
  "The firmware cannot boot on an empty device.",
  "",
  "Please select a complete firmware package.",
].join("\n");

/**
 * Message shown when app-only firmware will update an existing install.
 */
export const APP_ONLY_PRESERVE_MESSAGE = [
  "This firmware contains only the application.",
  "",
  "The existing bootloader and partition table will be preserved.",
].join("\n");

/**
 * Message shown after flash when the device does not look bootable.
 */
export const POST_FLASH_NOT_BOOTABLE_MESSAGE = [
  "The flash completed but the firmware is not bootable.",
  "",
  "Possible causes:",
  "",
  "• Application-only firmware on a blank ESP",
  "• Incorrect flash layout",
  "• Wrong firmware for this board",
].join("\n");

/**
 * Plans the next Install step from device inspection + package summary.
 *
 * @param deviceOutcome - Pre-flash flash inspection outcome
 * @param packageSummary - Selected firmware package classification
 */
export function planFlashInstall(
  deviceOutcome: FlashInspectionOutcome,
  packageSummary: FirmwarePackageSummary,
): FlashInstallPlan {
  const packageKind = packageSummary.kind;

  if (
    deviceOutcome === "blank" &&
    packageKind === "application-only"
  ) {
    return {
      action: "stop",
      code: "blank-app-only",
      message: BLANK_APP_ONLY_STOP_MESSAGE,
      packageKind,
    };
  }

  if (deviceOutcome === "blank") {
    return {
      action: "continue",
      notice: "This device appears to be empty.",
      packageKind,
    };
  }

  if (packageKind === "application-only") {
    return {
      action: "confirm",
      code: "app-only-preserve",
      message: APP_ONLY_PRESERVE_MESSAGE,
      packageKind,
      preserveBootloader: true,
    };
  }

  const baseMessage =
    deviceOutcome === "existing"
      ? "Existing firmware detected."
      : deviceOutcome === "unknown"
        ? "Existing firmware could not be identified. The device may already contain software. Continuing will overwrite the flash."
        : "Flash inspection failed. The device may already contain software. Continuing will overwrite the flash.";

  return {
    action: "confirm",
    code: "overwrite",
    message: `${baseMessage}\n\nInstalling ${formatFirmwarePackageKind(packageKind).toLowerCase()} will overwrite the existing installation.`,
    packageKind,
    preserveBootloader: false,
  };
}
