/**
 * Identifies the chip on a connected device and updates Device metadata.
 */

import { EspToolChipIdentifier } from "@/adapters/esptool";
import { CommunicationOwnershipError } from "@/core/communication";
import {
  formatDeviceBusyMessage,
  type ChipFamily,
  type DeviceManager,
} from "@/core/device";
import { CHIP_IDENTIFICATION_OWNER_ID } from "@/features/identification/constants";
import {
  WebSerialProvider,
  WEB_SERIAL_PROVIDER_ID,
} from "@/providers/web-serial";

/**
 * Result returned to UI after an identification attempt.
 */
export type IdentifyDeviceResult = {
  readonly chipFamily: ChipFamily;
  readonly rawName?: string;
};

/**
 * Identifies the chip on a connected device and updates Device metadata.
 *
 * Claims the shared device operation lock (`chip-identification`), runs the
 * esptool adapter against the native Web Serial port, releases ownership, then
 * patches {@link DeviceManager} info.
 *
 * @param manager - App DeviceManager
 * @param deviceId - Connected device id
 * @returns Detected chip family (may be `"unknown"` when detection is inconclusive)
 */
export async function identifyDevice(
  manager: DeviceManager,
  deviceId: string,
): Promise<IdentifyDeviceResult> {
  const device = manager.getDevice(deviceId);
  const io = device?.connection.io;
  if (!device || !io) {
    throw new Error(
      "Cannot identify chip: device has no byte transport. Reconnect and retry.",
    );
  }

  if (io.state !== "closed") {
    throw new Error(
      formatDeviceBusyMessage(
        manager.getOperationOwner(deviceId) ?? "serial-monitor",
        "identify",
      ),
    );
  }

  const provider = manager.getProvider(WEB_SERIAL_PROVIDER_ID);
  if (!(provider instanceof WebSerialProvider)) {
    throw new Error(
      "Chip identification currently requires the Web Serial provider.",
    );
  }

  const nativePort = provider.getNativePort(deviceId);
  if (!nativePort) {
    throw new Error(
      "Cannot identify chip: native serial port is unavailable for this device.",
    );
  }

  const operationLock = manager.getOperationLock(deviceId);
  let lock;

  try {
    lock = operationLock.claim(CHIP_IDENTIFICATION_OWNER_ID);
  } catch (error) {
    if (error instanceof CommunicationOwnershipError) {
      throw new Error(
        formatDeviceBusyMessage(operationLock.ownerId, "identify"),
        { cause: error },
      );
    }
    throw error;
  }

  try {
    const identifier = new EspToolChipIdentifier();
    const result = await identifier.identify(nativePort);

    const metadata: Record<string, string> = {
      ...(device.info.metadata ?? {}),
    };
    if (result.rawName !== undefined) {
      metadata.espToolChipName = result.rawName;
    }

    manager.updateDeviceInfo(deviceId, {
      chipFamily: result.chipFamily,
      metadata,
    });

    return {
      chipFamily: result.chipFamily,
      ...(result.rawName !== undefined ? { rawName: result.rawName } : {}),
    };
  } finally {
    try {
      operationLock.release(lock);
    } catch {
      /* Ownership may already be cleared. */
    }
  }
}
