import type { Device } from "@/core/device";
import type { DeviceSnapshot } from "@/store";

/**
 * Maps a live {@link Device} into a serializable UI snapshot.
 *
 * @param device - Connected device handle from DeviceManager.
 * @param providerLabel - Human-readable provider label.
 */
export function toDeviceSnapshot(
  device: Device,
  providerLabel: string,
): DeviceSnapshot {
  const snapshot: DeviceSnapshot = {
    id: device.id,
    name: device.info.name,
    providerId: device.info.providerId,
    providerLabel,
    chipFamily: device.info.chipFamily,
    status: device.connection.state,
    capabilities: device.capabilities,
  };

  if (device.info.transportLabel !== undefined) {
    return { ...snapshot, transportLabel: device.info.transportLabel };
  }

  return snapshot;
}
