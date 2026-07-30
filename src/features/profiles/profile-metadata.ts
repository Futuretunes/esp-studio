/**
 * Helpers for reading known metadata keys used by Device Profiles.
 */

import type { ChipFamily } from "@/core/device";
import { formatChipLabel } from "@/features/identification/format-chip-label";
import type { DeviceProfileMatchContext } from "@/features/profiles/types";

/** Optional DeviceInfo.metadata keys profiles may read (never invent). */
export const PROFILE_METADATA_KEYS = {
  chipName: "espToolChipName",
  flashSize: "espToolFlashSize",
  firmwareProjectId: "firmwareProjectId",
  firmwareName: "firmwareName",
  firmwareVersion: "firmwareVersion",
  filesystem: "filesystemFormat",
} as const;

/**
 * Reads a metadata string when present and non-empty.
 */
export function readProfileMetadata(
  metadata: Readonly<Record<string, string>>,
  key: string,
): string | null {
  const value = metadata[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value;
}

/**
 * Chip display label from context.
 */
export function profileChipLabel(context: DeviceProfileMatchContext): string {
  const raw = readProfileMetadata(
    context.metadata,
    PROFILE_METADATA_KEYS.chipName,
  );
  if (raw !== null) {
    return raw;
  }
  return formatChipLabel(context.chipFamily);
}

/**
 * Flash size string when known from inspection metadata.
 */
export function profileFlashSize(
  context: DeviceProfileMatchContext,
): string | null {
  return readProfileMetadata(context.metadata, PROFILE_METADATA_KEYS.flashSize);
}

/**
 * Firmware project id hint when recorded in metadata.
 */
export function profileFirmwareProjectId(
  context: DeviceProfileMatchContext,
): string | null {
  return readProfileMetadata(
    context.metadata,
    PROFILE_METADATA_KEYS.firmwareProjectId,
  );
}

/**
 * Firmware display name when recorded.
 */
export function profileFirmwareName(
  context: DeviceProfileMatchContext,
): string | null {
  return readProfileMetadata(
    context.metadata,
    PROFILE_METADATA_KEYS.firmwareName,
  );
}

/**
 * Firmware version when recorded.
 */
export function profileFirmwareVersion(
  context: DeviceProfileMatchContext,
): string | null {
  return readProfileMetadata(
    context.metadata,
    PROFILE_METADATA_KEYS.firmwareVersion,
  );
}

/**
 * Filesystem format hint when recorded.
 */
export function profileFilesystemFormat(
  context: DeviceProfileMatchContext,
): string | null {
  return readProfileMetadata(
    context.metadata,
    PROFILE_METADATA_KEYS.filesystem,
  );
}

/**
 * True when recent library ids include `projectId`.
 */
export function recentIncludesProject(
  context: DeviceProfileMatchContext,
  projectId: string,
): boolean {
  return context.recentFirmwareIds.includes(projectId);
}

/**
 * Builds a match context from device facts.
 */
export function createProfileMatchContext(options: {
  readonly deviceId: string;
  readonly deviceName: string;
  readonly chipFamily: ChipFamily;
  readonly metadata?: Readonly<Record<string, string>>;
  readonly recentFirmwareIds?: readonly string[];
}): DeviceProfileMatchContext {
  return {
    deviceId: options.deviceId,
    deviceName: options.deviceName,
    chipFamily: options.chipFamily,
    metadata: options.metadata ?? {},
    recentFirmwareIds: options.recentFirmwareIds ?? [],
  };
}
