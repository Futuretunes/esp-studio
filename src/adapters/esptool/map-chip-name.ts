/**
 * Maps esptool-js chip name strings to ESP Studio {@link ChipFamily} values.
 */

import type { ChipFamily } from "@/core/device";

/**
 * Converts an esptool ROM / chip name into a {@link ChipFamily}.
 *
 * @param chipName - Name reported by esptool (e.g. `"ESP32-S3"`)
 * @returns Matching family, or `"unknown"` when unrecognized
 */
export function mapEspToolChipName(chipName: string): ChipFamily {
  const normalized = chipName.trim().toUpperCase().replace(/\s+/g, "-");

  switch (normalized) {
    case "ESP8266":
      return "esp8266";
    case "ESP32":
      return "esp32";
    case "ESP32-S2":
      return "esp32-s2";
    case "ESP32-S3":
      return "esp32-s3";
    case "ESP32-C2":
    case "ESP8684":
      return "esp32-c2";
    case "ESP32-C3":
    case "ESP8685":
      return "esp32-c3";
    case "ESP32-C6":
      return "esp32-c6";
    case "ESP32-H2":
      return "esp32-h2";
    default:
      return "unknown";
  }
}
