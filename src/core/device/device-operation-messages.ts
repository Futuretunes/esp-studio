/**
 * User-facing labels and busy copy for device operation owners.
 */

import type { CommunicationOwnerId } from "../communication";

/**
 * Known device operation owner ids used across ESP Studio.
 */
export type DeviceOperationOwnerId =
  | "serial-monitor"
  | "chip-identification"
  | "flash-service"
  | "filesystem-browser";

/**
 * Display labels for owner ids.
 */
export const DEVICE_OPERATION_OWNER_LABELS: Readonly<
  Record<DeviceOperationOwnerId, string>
> = {
  "serial-monitor": "Serial Monitor",
  "chip-identification": "Identify",
  "flash-service": "Flash",
  "filesystem-browser": "Filesystem",
};

/**
 * Returns a human label for an owner id.
 *
 * @param ownerId - Owner id or null
 */
export function formatDeviceOperationOwnerLabel(
  ownerId: CommunicationOwnerId | null,
): string {
  if (ownerId === null || ownerId.length === 0) {
    return "another tool";
  }
  if (ownerId in DEVICE_OPERATION_OWNER_LABELS) {
    return DEVICE_OPERATION_OWNER_LABELS[ownerId as DeviceOperationOwnerId];
  }
  return ownerId;
}

/**
 * Builds a clear busy message for a blocked device operation.
 *
 * @param ownerId - Current owner, if known
 * @param attempting - Optional operation the user tried to start
 */
export function formatDeviceBusyMessage(
  ownerId: CommunicationOwnerId | null,
  attempting?: "flash" | "identify" | "filesystem" | "serial",
): string {
  if (ownerId === "serial-monitor") {
    if (attempting === "flash") {
      return "Stop the Serial Monitor before flashing.";
    }
    if (attempting === "identify") {
      return "Stop the Serial Monitor before identifying the chip.";
    }
    if (attempting === "filesystem") {
      return "Stop the Serial Monitor before using the filesystem.";
    }
    return "Stop the Serial Monitor before continuing.";
  }

  const label = formatDeviceOperationOwnerLabel(ownerId);
  return `Device is busy (${label} in progress).`;
}
