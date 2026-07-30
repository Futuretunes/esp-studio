import type { ConnectedDevice } from "@/types";

/**
 * Device-facing service stubs.
 * Web Serial / flashing implementations intentionally deferred.
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
