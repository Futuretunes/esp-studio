import { describe, expect, it } from "vitest";

import { createProfileMatchContext } from "@/features/profiles/profile-metadata";
import {
  DEVICE_PROFILES,
  getDeviceProfileById,
  listMatchingDeviceProfiles,
  resolveDeviceProfile,
} from "@/features/profiles/registry";
import { GENERIC_ESP_PROFILE_ID } from "@/features/profiles/profiles/generic-esp";

describe("resolveDeviceProfile", () => {
  it("falls back to Generic ESP when nothing else matches", () => {
    const matched = resolveDeviceProfile(
      createProfileMatchContext({
        deviceId: "dev-1",
        deviceName: "ESP",
        chipFamily: "esp32-c3",
      }),
    );
    expect(matched.isGeneric).toBe(true);
    expect(matched.profile.id).toBe(GENERIC_ESP_PROFILE_ID);
    expect(matched.profile.name).toBe("Generic ESP Device");
  });

  it("matches WLED from recent firmware library ids", () => {
    const matched = resolveDeviceProfile(
      createProfileMatchContext({
        deviceId: "dev-1",
        deviceName: "ESP",
        chipFamily: "esp32",
        recentFirmwareIds: ["wled", "tasmota"],
      }),
    );
    expect(matched.isGeneric).toBe(false);
    expect(matched.profile.id).toBe("wled");
  });

  it("matches Sentinel Node from firmware metadata project id", () => {
    const matched = resolveDeviceProfile(
      createProfileMatchContext({
        deviceId: "dev-1",
        deviceName: "ESP",
        chipFamily: "esp32-c3",
        metadata: {
          firmwareProjectId: "sentinel-node",
          firmwareName: "Sentinel Node",
          firmwareVersion: "1.4.2",
          espToolFlashSize: "4MB",
        },
      }),
    );
    expect(matched.profile.id).toBe("sentinel-node");
    expect(matched.profile.name).toBe("Sentinel Node");
    const card = matched.profile.dashboardCards(matched.context)[0];
    expect(card?.fields.some((field) => field.value === "1.4.2")).toBe(true);
  });

  it("prefers higher-priority matches over Generic ESP", () => {
    const matches = listMatchingDeviceProfiles(
      createProfileMatchContext({
        deviceId: "dev-1",
        deviceName: "ESP",
        chipFamily: "esp32",
        recentFirmwareIds: ["esphome"],
      }),
    );
    expect(matches[0]?.id).toBe("esphome");
    expect(matches.some((profile) => profile.id === GENERIC_ESP_PROFILE_ID)).toBe(
      true,
    );
  });

  it("registers all built-in profiles", () => {
    expect(DEVICE_PROFILES.map((profile) => profile.id).sort()).toEqual(
      [
        "esphome",
        "generic-esp",
        "openmqttgateway",
        "sentinel-node",
        "tasmota",
        "wled",
      ].sort(),
    );
    expect(getDeviceProfileById("tasmota")?.name).toBe("Tasmota");
  });

  it("exposes Generic ESP section settings without replacing core tools", () => {
    const generic = getDeviceProfileById(GENERIC_ESP_PROFILE_ID);
    expect(generic).toBeDefined();
    if (generic === undefined) {
      return;
    }
    const sections = generic.settingsSections(
      createProfileMatchContext({
        deviceId: "dev-1",
        deviceName: "ESP",
        chipFamily: "esp32",
      }),
    );
    expect(sections.map((section) => section.id)).toEqual([
      "general",
      "flash",
      "filesystem",
      "serial",
      "diagnostics",
      "provisioning",
    ]);
  });
});
