import { describe, expect, it } from "vitest";

import type { BuiltInCatalogEntry } from "@/features/firmware/catalog";
import {
  filterFirmwareLibraryEntries,
  resolveRecentFirmwareEntries,
  selectPopularFirmwareEntries,
} from "@/features/library/search";

const SAMPLE: readonly BuiltInCatalogEntry[] = [
  {
    id: "wled",
    name: "WLED",
    description: "LED strips",
    repository: "Aircoookie/WLED",
    category: "lighting",
    chipFamilies: ["esp32"],
    icon: "wled",
    featured: true,
  },
  {
    id: "tasmota",
    name: "Tasmota",
    description: "MQTT rules",
    repository: "arendst/Tasmota",
    category: "home-automation",
    chipFamilies: ["esp8266"],
    icon: "tasmota",
    featured: true,
  },
  {
    id: "openmqttgateway",
    name: "OpenMQTTGateway",
    description: "BLE bridge",
    repository: "1technophile/OpenMQTTGateway",
    category: "mqtt",
    icon: "openmqttgateway",
    featured: false,
  },
];

describe("filterFirmwareLibraryEntries", () => {
  it("filters by category", () => {
    const result = filterFirmwareLibraryEntries(SAMPLE, "", "mqtt");
    expect(result.map((entry) => entry.id)).toEqual(["openmqttgateway"]);
  });

  it("filters by query across name and repository", () => {
    const result = filterFirmwareLibraryEntries(SAMPLE, "aircoo", "all");
    expect(result.map((entry) => entry.id)).toEqual(["wled"]);
  });
});

describe("selectPopularFirmwareEntries", () => {
  it("returns featured entries only", () => {
    expect(selectPopularFirmwareEntries(SAMPLE).map((entry) => entry.id)).toEqual(
      ["wled", "tasmota"],
    );
  });
});

describe("resolveRecentFirmwareEntries", () => {
  it("maps ids to entries and skips unknowns", () => {
    const resolved = resolveRecentFirmwareEntries(SAMPLE, [
      "missing",
      "tasmota",
      "wled",
    ]);
    expect(resolved.map((entry) => entry.id)).toEqual(["tasmota", "wled"]);
  });
});
