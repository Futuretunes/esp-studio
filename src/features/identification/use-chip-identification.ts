import { useCallback, useState } from "react";

import { useDeviceManager } from "@/app/device-context";
import { toDeviceSnapshot } from "@/features/devices/to-device-snapshot";
import { identifyDevice } from "@/features/identification/identify-device";
import { WEB_SERIAL_PROVIDER_ID } from "@/providers/web-serial";
import { useDeviceStore } from "@/store";

/**
 * Hook that runs chip identification and refreshes the Devices snapshot.
 */
export function useChipIdentification() {
  const manager = useDeviceManager();
  const activeDevice = useDeviceStore((s) => s.activeDevice);
  const setActiveDevice = useDeviceStore((s) => s.setActiveDevice);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);

  const runIdentification = useCallback(
    async (deviceId: string) => {
      setIsIdentifying(true);
      setIdentifyError(null);

      try {
        await identifyDevice(manager, deviceId);
        const updated = manager.getDevice(deviceId);
        if (updated) {
          const provider = manager.getProvider(WEB_SERIAL_PROVIDER_ID);
          setActiveDevice(
            toDeviceSnapshot(updated, provider?.label ?? "Web Serial"),
          );
        }
      } catch (error) {
        setIdentifyError(
          error instanceof Error ? error.message : "Chip identification failed.",
        );
      } finally {
        setIsIdentifying(false);
      }
    },
    [manager, setActiveDevice],
  );

  return {
    activeDevice,
    isIdentifying,
    identifyError,
    runIdentification,
  };
}
