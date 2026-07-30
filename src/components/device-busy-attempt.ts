/**
 * Maps DeviceBusyBanner page contexts to Device Operation Lock owner ids.
 */

import type { DeviceOperationOwnerId } from "@/core/device";

export type DeviceBusyAttempt = "flash" | "identify" | "filesystem" | "serial";

const ATTEMPTING_TO_OWNER: Readonly<
  Record<DeviceBusyAttempt, DeviceOperationOwnerId>
> = {
  flash: "flash-service",
  identify: "chip-identification",
  filesystem: "filesystem-browser",
  serial: "serial-monitor",
};

/**
 * Maps a page attempt context to the operation owner id for that page.
 *
 * @param attempting - Page context
 */
export function deviceBusyAttemptOwner(
  attempting: DeviceBusyAttempt,
): DeviceOperationOwnerId {
  return ATTEMPTING_TO_OWNER[attempting];
}
