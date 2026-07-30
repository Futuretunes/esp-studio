/**
 * Identifies the chip on a connected device and updates Device metadata.
 */

import { EspToolChipIdentifier } from "@/adapters/esptool";
import {
  CommunicationOwnershipError,
  CommunicationSession,
} from "@/core/communication";
import type { ChipFamily, DeviceManager } from "@/core/device";
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
 * Acquires CommunicationSession ownership (`chip-identification`), runs the
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
      "Cannot identify chip while another tool owns the connection. Stop the Serial Monitor and retry.",
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

  const session = new CommunicationSession(io);
  let lock;

  try {
    lock = session.acquire(CHIP_IDENTIFICATION_OWNER_ID);
  } catch (error) {
    if (error instanceof CommunicationOwnershipError) {
      throw new Error(
        `Cannot identify chip while another tool owns the connection (${session.ownerId ?? "unknown"}). Stop the Serial Monitor and retry.`,
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
      session.release(lock);
    } catch {
      /* Ownership may already be cleared. */
    }
  }
}
