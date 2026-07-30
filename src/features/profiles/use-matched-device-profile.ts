/**
 * Resolves the matched Device Profile for the active device.
 */

import { useMemo } from "react";

import { useDeviceManager } from "@/app/device-context";
import { readRecentFirmwareIds } from "@/features/library/recent";
import { createProfileMatchContext } from "@/features/profiles/profile-metadata";
import { resolveDeviceProfile } from "@/features/profiles/registry";
import type { MatchedDeviceProfile } from "@/features/profiles/types";
import { useDeviceStore } from "@/store";

/**
 * Matches a compiled-in profile for the connected device (Generic ESP fallback).
 */
export function useMatchedDeviceProfile(): MatchedDeviceProfile | null {
  const manager = useDeviceManager();
  const activeDevice = useDeviceStore((state) => state.activeDevice);

  return useMemo(() => {
    if (!activeDevice) {
      return null;
    }

    const live = manager.getDevice(activeDevice.id);
    const metadata = live?.info.metadata ?? {};

    const context = createProfileMatchContext({
      deviceId: activeDevice.id,
      deviceName: activeDevice.name,
      chipFamily: activeDevice.chipFamily,
      metadata,
      recentFirmwareIds: readRecentFirmwareIds(),
    });

    return resolveDeviceProfile(context);
  }, [activeDevice, manager]);
}
