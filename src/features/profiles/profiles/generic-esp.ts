/**
 * Generic ESP Device Profile — always available fallback.
 */

import {
  CircuitBoard,
  Cpu,
  FolderTree,
  HardDrive,
  Radio,
  Shield,
  Terminal,
} from "lucide-react";

import {
  profileChipLabel,
  profileFirmwareName,
  profileFirmwareVersion,
  profileFilesystemFormat,
  profileFlashSize,
} from "@/features/profiles/profile-metadata";
import type {
  DeviceProfile,
  DeviceProfileAction,
  DeviceProfileDashboardCard,
  DeviceProfileMatchContext,
} from "@/features/profiles/types";

export const GENERIC_ESP_PROFILE_ID = "generic-esp" as const;

/**
 * Default profile for any connected Espressif board.
 */
export const genericEspProfile: DeviceProfile = {
  id: GENERIC_ESP_PROFILE_ID,
  name: "Generic ESP Device",
  icon: CircuitBoard,
  priority: 0,
  match() {
    return true;
  },
  dashboardCards(context) {
    return [
      buildOverviewCard(context),
      buildSectionsCard(),
    ];
  },
  deviceActions() {
    return genericActions();
  },
  settingsSections() {
    return [
      {
        id: "general",
        title: "General",
        description: "Device identity and connection facts from Identify.",
      },
      {
        id: "flash",
        title: "Flash",
        description: "Use Install Firmware / provisioning modes on Flash.",
      },
      {
        id: "filesystem",
        title: "Filesystem",
        description: "Browse and transfer files on SPIFFS / LittleFS volumes.",
      },
      {
        id: "serial",
        title: "Serial",
        description: "Open the Serial Monitor for UTF-8 console output.",
      },
      {
        id: "diagnostics",
        title: "Diagnostics",
        description: "Export a support report without serial or filesystem dumps.",
      },
      {
        id: "provisioning",
        title: "Provisioning",
        description:
          "Update, Reinstall, or Factory erase from the Flash page — never invent on-device firmware names here.",
      },
    ];
  },
  diagnostics(context) {
    return [
      {
        id: "generic-overview",
        title: "Generic ESP profile",
        lines: [
          "Matched profile: Generic ESP Device",
          `Device: ${context.deviceName}`,
          `Chip: ${profileChipLabel(context)}`,
          `Flash size: ${profileFlashSize(context) ?? "unknown"}`,
          `Firmware name: ${profileFirmwareName(context) ?? "unknown"}`,
          `Firmware version: ${profileFirmwareVersion(context) ?? "unknown"}`,
          `Filesystem: ${profileFilesystemFormat(context) ?? "unknown"}`,
        ],
      },
    ];
  },
  filesystemActions() {
    return [
      {
        id: "browse",
        label: "Browse filesystem",
        href: "/filesystem",
      },
    ];
  },
};

function buildOverviewCard(
  context: DeviceProfileMatchContext,
): DeviceProfileDashboardCard {
  return {
    id: "overview",
    title: "Device",
    description: "Connected board facts from Identify and Flash inspection.",
    fields: [
      {
        id: "chip",
        label: "Chip",
        value: profileChipLabel(context),
      },
      {
        id: "status",
        label: "Status",
        value: "Connected",
      },
      {
        id: "firmware",
        label: "Firmware",
        value: profileFirmwareName(context) ?? "Unknown / not verified",
      },
      {
        id: "version",
        label: "Version",
        value: profileFirmwareVersion(context) ?? "—",
      },
      {
        id: "flash",
        label: "Flash",
        value: profileFlashSize(context) ?? "—",
      },
      {
        id: "filesystem",
        label: "Filesystem",
        value: profileFilesystemFormat(context) ?? "—",
      },
      {
        id: "profile",
        label: "Device Profile",
        value: "Generic ESP Device",
      },
    ],
    actions: genericActions(),
  };
}

function buildSectionsCard(): DeviceProfileDashboardCard {
  return {
    id: "sections",
    title: "Core sections",
    description:
      "Generic ESP exposes the shared tool surface — profiles only augment it.",
    fields: [
      { id: "general", label: "General", value: "Device identity" },
      { id: "flash", label: "Flash", value: "Provision / install" },
      { id: "filesystem", label: "Filesystem", value: "Browse & transfer" },
      { id: "serial", label: "Serial", value: "Monitor" },
      { id: "diagnostics", label: "Diagnostics", value: "Support export" },
      { id: "provisioning", label: "Provisioning", value: "Update / Reinstall / Factory erase" },
    ],
  };
}

function genericActions(): readonly DeviceProfileAction[] {
  return [
    {
      id: "serial",
      label: "Open Serial",
      href: "/serial",
      variant: "secondary",
    },
    {
      id: "filesystem",
      label: "Browse Files",
      href: "/filesystem",
      variant: "secondary",
    },
    {
      id: "flash",
      label: "Provision Device",
      href: "/flash",
      variant: "default",
    },
    {
      id: "diagnostics",
      label: "Diagnostics",
      href: "/diagnostics",
      variant: "outline",
    },
  ];
}

/** Icon map for Generic section badges (UI optional). */
export const GENERIC_SECTION_ICONS = {
  general: Cpu,
  flash: HardDrive,
  filesystem: FolderTree,
  serial: Terminal,
  diagnostics: Shield,
  provisioning: Radio,
} as const;
