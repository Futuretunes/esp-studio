/**
 * Chip compatibility helpers for One-click Install UX.
 */

import type { ChipFamily } from "@/core/device";

/**
 * Returns whether a firmware option is compatible with a device chip.
 *
 * Empty / missing `chipFamilies` means “any chip”. Unknown or missing device
 * chip is treated as compatible (no hard filter).
 *
 * @param chipFamilies - Optional compatibility list from catalog / built-in entry
 * @param deviceChip - Connected device chip family, if known
 */
export function isFirmwareChipCompatible(
  chipFamilies: readonly string[] | undefined,
  deviceChip: ChipFamily | null | undefined,
): boolean {
  if (chipFamilies === undefined || chipFamilies.length === 0) {
    return true;
  }

  if (deviceChip === null || deviceChip === undefined || deviceChip === "unknown") {
    return true;
  }

  return chipFamilies.includes(deviceChip);
}

/**
 * Sorts catalog entries so chip-compatible options come first.
 *
 * @param entries - Firmware catalog entries
 * @param deviceChip - Connected device chip family
 * @param projectChipFamilies - Optional project-level families (built-in entry)
 */
export function sortFirmwareEntriesByChipPreference<
  T extends {
    readonly manifest: {
      readonly title: string;
      readonly chipFamilies?: readonly string[];
    };
  },
>(
  entries: readonly T[],
  deviceChip: ChipFamily | null | undefined,
  projectChipFamilies?: readonly string[],
): T[] {
  const ranked = [...entries];
  ranked.sort((left, right) => {
    const leftFamilies = left.manifest.chipFamilies ?? projectChipFamilies;
    const rightFamilies = right.manifest.chipFamilies ?? projectChipFamilies;
    const leftOk = isFirmwareChipCompatible(leftFamilies, deviceChip);
    const rightOk = isFirmwareChipCompatible(rightFamilies, deviceChip);
    if (leftOk !== rightOk) {
      return leftOk ? -1 : 1;
    }
    return left.manifest.title.localeCompare(right.manifest.title);
  });
  return ranked;
}
