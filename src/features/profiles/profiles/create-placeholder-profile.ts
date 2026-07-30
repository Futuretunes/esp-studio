/**
 * Shared builders for placeholder firmware profiles.
 */

import type { LucideIcon } from "lucide-react";

import {
  profileChipLabel,
  profileFirmwareName,
  profileFirmwareProjectId,
  profileFirmwareVersion,
  profileFlashSize,
  recentIncludesProject,
} from "@/features/profiles/profile-metadata";
import type {
  DeviceProfile,
  DeviceProfileAction,
  DeviceProfileDashboardCard,
  DeviceProfileDiagnosticsSection,
  DeviceProfileFilesystemAction,
  DeviceProfileMatchContext,
  DeviceProfileSettingsSection,
} from "@/features/profiles/types";

/**
 * Creates a branding/info-only profile for a known firmware project.
 *
 * No project-specific actions beyond linking into existing tools.
 *
 * @param options - Placeholder identity
 */
export function createPlaceholderFirmwareProfile(options: {
  readonly id: string;
  readonly name: string;
  readonly projectId: string;
  readonly icon: LucideIcon;
  readonly priority: number;
  readonly matchNames?: readonly string[];
}): DeviceProfile {
  const nameTokens = [
    options.name.toLowerCase(),
    options.projectId.toLowerCase(),
    ...(options.matchNames ?? []).map((token) => token.toLowerCase()),
  ];

  return {
    id: options.id,
    name: options.name,
    icon: options.icon,
    priority: options.priority,
    match(context) {
      const projectId = profileFirmwareProjectId(context);
      if (projectId === options.projectId) {
        return true;
      }
      if (recentIncludesProject(context, options.projectId)) {
        return true;
      }
      const firmwareName = profileFirmwareName(context)?.toLowerCase() ?? "";
      if (firmwareName.length > 0) {
        return nameTokens.some((token) => firmwareName.includes(token));
      }
      return false;
    },
    dashboardCards(context) {
      return [buildPlaceholderDashboardCard(options.name, context)];
    },
    deviceActions() {
      return standardDeviceActions();
    },
    settingsSections() {
      return [
        {
          id: `${options.id}-placeholder`,
          title: `${options.name} settings`,
          description:
            "Project-specific settings are not available yet. Use the shared Settings page and Flash / Filesystem tools.",
        } satisfies DeviceProfileSettingsSection,
      ];
    },
    diagnostics(context) {
      return [buildPlaceholderDiagnostics(options.name, context)];
    },
    filesystemActions() {
      return standardFilesystemActions();
    },
  };
}

function buildPlaceholderDashboardCard(
  profileName: string,
  context: DeviceProfileMatchContext,
): DeviceProfileDashboardCard {
  const firmware =
    profileFirmwareName(context) ??
    (profileFirmwareProjectId(context) !== null ? profileName : "Not verified");
  const version = profileFirmwareVersion(context) ?? "—";
  const flash = profileFlashSize(context) ?? "—";

  return {
    id: "overview",
    title: profileName,
    description:
      "Placeholder profile — branding and firmware hints only. Core Flash, Filesystem, and Serial tools stay shared.",
    fields: [
      { id: "device", label: "Device", value: context.deviceName },
      { id: "chip", label: "Chip", value: profileChipLabel(context) },
      { id: "status", label: "Status", value: "Connected" },
      { id: "firmware", label: "Firmware", value: firmware },
      { id: "version", label: "Version", value: version },
      { id: "flash", label: "Flash", value: flash },
      { id: "profile", label: "Device Profile", value: profileName },
    ],
    actions: standardDeviceActions(),
  };
}

function buildPlaceholderDiagnostics(
  profileName: string,
  context: DeviceProfileMatchContext,
): DeviceProfileDiagnosticsSection {
  return {
    id: `${profileName}-diagnostics`,
    title: `${profileName} profile`,
    lines: [
      `Matched profile: ${profileName} (placeholder)`,
      `Chip: ${profileChipLabel(context)}`,
      `Firmware name: ${profileFirmwareName(context) ?? "unknown"}`,
      `Firmware version: ${profileFirmwareVersion(context) ?? "unknown"}`,
      "No project-specific diagnostics yet.",
    ],
  };
}

function standardDeviceActions(): readonly DeviceProfileAction[] {
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

function standardFilesystemActions(): readonly DeviceProfileFilesystemAction[] {
  return [
    {
      id: "browse",
      label: "Browse filesystem",
      href: "/filesystem",
    },
  ];
}
