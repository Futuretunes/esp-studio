/**
 * Static built-in firmware catalog data (no network).
 */

import type { BuiltInCatalogEntry } from "@/features/firmware/catalog/BuiltInCatalogEntry";

/**
 * Curated popular firmware projects for Flash UI cards.
 *
 * Repository values are GitHub `owner/repository` slugs consumed by
 * {@link import("@/features/firmware/providers/github").GitHubFirmwareProvider}.
 */
export const BUILT_IN_FIRMWARE_CATALOG: readonly BuiltInCatalogEntry[] = [
  {
    id: "wled",
    name: "WLED",
    description:
      "Control addressable LED strips and matrices with a polished web UI.",
    repository: "wled-dev/WLED",
    category: "lighting",
    chipFamilies: ["esp8266", "esp32", "esp32-s2", "esp32-s3", "esp32-c3"],
    icon: "wled",
    featured: true,
  },
  {
    id: "esphome",
    name: "ESPHome",
    description:
      "YAML-driven ESP firmware for Home Assistant and local control.",
    repository: "esphome/esphome",
    category: "home-automation",
    chipFamilies: [
      "esp8266",
      "esp32",
      "esp32-s2",
      "esp32-s3",
      "esp32-c3",
      "esp32-c6",
    ],
    icon: "esphome",
    featured: true,
  },
  {
    id: "tasmota",
    name: "Tasmota",
    description:
      "Alternative firmware for ESP devices with MQTT, rules, and sensors.",
    repository: "arendst/Tasmota",
    category: "home-automation",
    chipFamilies: ["esp8266", "esp32", "esp32-s2", "esp32-s3", "esp32-c3"],
    icon: "tasmota",
    featured: true,
  },
  {
    id: "openmqttgateway",
    name: "OpenMQTTGateway",
    description:
      "Bridge BLE, RF, IR, and other sensors to MQTT from an ESP board.",
    repository: "1technophile/OpenMQTTGateway",
    category: "mqtt",
    chipFamilies: ["esp8266", "esp32", "esp32-s3", "esp32-c3"],
    icon: "openmqttgateway",
    featured: false,
  },
] as const;
