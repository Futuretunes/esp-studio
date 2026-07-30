import type { ChipFamily } from "@/core/device";

/**
 * Formats a chip family for Devices UI labels.
 *
 * @param chipFamily - Device Layer chip family.
 * @returns Display label such as `ESP32-S3` or `Unknown`.
 */
export function formatChipLabel(chipFamily: ChipFamily): string {
  if (chipFamily === "unknown") {
    return "Unknown";
  }

  return chipFamily.toUpperCase();
}
