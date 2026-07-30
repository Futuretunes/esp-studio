/**
 * Pure helpers for pre-flash flash-content classification.
 *
 * Does not talk to hardware — callers supply bytes from
 * {@link EspToolAdapter.inspectFlash} / `readFlash`.
 */

import type { ChipFamily } from "@/core/device";

/**
 * Espressif firmware image magic (`ESP_IMAGE_MAGIC`).
 */
export const ESP_IMAGE_MAGIC = 0xe9 as const;

/**
 * Absolute flash offsets sampled during pre-flash inspection.
 */
export const FLASH_INSPECTION_SAMPLE_ADDRESSES = [
  0x0, 0x1000, 0x10000,
] as const;

/**
 * Bytes read at each sample address.
 */
export const FLASH_INSPECTION_SAMPLE_LENGTH = 32 as const;

/**
 * Classification of one sampled flash region.
 */
export type FlashRegionStatus = "blank" | "image" | "unknown";

/**
 * Aggregate pre-flash inspection outcome.
 */
export type FlashInspectionOutcome =
  | "blank"
  | "existing"
  | "unknown"
  | "failed";

/**
 * One sampled region result.
 */
export type FlashInspectionRegion = {
  readonly address: number;
  readonly status: FlashRegionStatus;
};

/**
 * Structured report returned by {@link FlashService.inspectPreFlash}.
 *
 * Only includes fields that were actually observed — never invent product
 * identity for the firmware already on the chip.
 */
export type FlashInspectionReport = {
  readonly outcome: FlashInspectionOutcome;
  readonly message: string;
  readonly chipFamily?: ChipFamily;
  readonly rawChipName?: string;
  readonly flashSize?: string;
  readonly regions: readonly FlashInspectionRegion[];
};

/**
 * True when Install must wait for an explicit overwrite confirmation.
 *
 * @param outcome - Inspection aggregate
 */
export function flashInspectionRequiresConfirmation(
  outcome: FlashInspectionOutcome,
): boolean {
  return (
    outcome === "existing" ||
    outcome === "unknown" ||
    outcome === "failed"
  );
}

/**
 * Classifies raw flash bytes for a single region.
 *
 * @param bytes - Sample from `readFlash`
 */
export function classifyFlashRegionBytes(
  bytes: Uint8Array,
): FlashRegionStatus {
  if (bytes.length === 0) {
    return "unknown";
  }

  let allBlank = true;
  for (const byte of bytes) {
    if (byte !== 0xff) {
      allBlank = false;
      break;
    }
  }
  if (allBlank) {
    return "blank";
  }

  if (bytes[0] === ESP_IMAGE_MAGIC) {
    return "image";
  }

  return "unknown";
}

/**
 * Aggregates per-region statuses into a device-level outcome.
 *
 * @param regions - Sampled region statuses
 */
export function aggregateFlashInspectionOutcome(
  regions: readonly FlashInspectionRegion[],
): Exclude<FlashInspectionOutcome, "failed"> {
  if (regions.length === 0) {
    return "unknown";
  }

  if (regions.every((region) => region.status === "blank")) {
    return "blank";
  }

  if (regions.some((region) => region.status === "image")) {
    return "existing";
  }

  return "unknown";
}

/**
 * Formats a short human message for an inspection outcome.
 *
 * @param outcome - Aggregate outcome
 */
export function formatFlashInspectionMessage(
  outcome: FlashInspectionOutcome,
): string {
  switch (outcome) {
    case "blank":
      return "This device appears to be empty.";
    case "existing":
      return "Existing firmware detected.";
    case "unknown":
      return "Existing firmware could not be identified. The device may already contain software. Continuing will overwrite the flash.";
    case "failed":
      return "Flash inspection failed. The device may already contain software. Continuing will overwrite the flash.";
  }
}

/**
 * Builds a {@link FlashInspectionReport} from sampled regions and optional chip metadata.
 *
 * @param regions - Classified sample regions
 * @param extras - Optional chip / flash size fields (omit unknowns)
 */
export function createFlashInspectionReport(
  regions: readonly FlashInspectionRegion[],
  extras: {
    readonly chipFamily?: ChipFamily;
    readonly rawChipName?: string;
    readonly flashSize?: string;
  } = {},
): FlashInspectionReport {
  const outcome = aggregateFlashInspectionOutcome(regions);
  return {
    outcome,
    message: formatFlashInspectionMessage(outcome),
    regions,
    ...(extras.chipFamily !== undefined
      ? { chipFamily: extras.chipFamily }
      : {}),
    ...(extras.rawChipName !== undefined
      ? { rawChipName: extras.rawChipName }
      : {}),
    ...(extras.flashSize !== undefined ? { flashSize: extras.flashSize } : {}),
  };
}

/**
 * Builds a failed inspection report (read / connect / ownership error).
 *
 * @param message - Optional override; defaults to the failed copy
 * @param extras - Optional chip fields already known from DeviceManager
 */
export function createFailedFlashInspectionReport(
  message: string = formatFlashInspectionMessage("failed"),
  extras: {
    readonly chipFamily?: ChipFamily;
    readonly rawChipName?: string;
    readonly flashSize?: string;
  } = {},
): FlashInspectionReport {
  return {
    outcome: "failed",
    message,
    regions: [],
    ...(extras.chipFamily !== undefined
      ? { chipFamily: extras.chipFamily }
      : {}),
    ...(extras.rawChipName !== undefined
      ? { rawChipName: extras.rawChipName }
      : {}),
    ...(extras.flashSize !== undefined ? { flashSize: extras.flashSize } : {}),
  };
}
