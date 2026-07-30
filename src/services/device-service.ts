import type { ConnectedDevice } from "@/types";

/**
 * Legacy device-facing service stub.
 *
 * Live device workflows use {@link import("@/core/device").DeviceManager}
 * via `useDeviceManager()` — not this stub.
 */
export type DeviceService = {
  listDevices: () => Promise<ConnectedDevice[]>;
  disconnect: (deviceId: string) => Promise<void>;
};

export const deviceService: DeviceService = {
  listDevices(): Promise<ConnectedDevice[]> {
    return Promise.resolve([]);
  },
  disconnect(_deviceId: string): Promise<void> {
    return Promise.resolve();
  },
};
