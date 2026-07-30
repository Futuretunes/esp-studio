import { useEffect } from "react";

import { useDeviceManager } from "@/app/device-context";
import { useDeviceStore } from "@/store";

const POLL_INTERVAL_MS = 750;

/**
 * Clears the UI device snapshot when the live connection is gone.
 *
 * Covers unexpected unplug, permission revocation, and manager eviction after
 * a failed close. Surfaces a friendly `"lost"` alert (not a disconnect-button
 * failure).
 */
export function useConnectionLossWatchdog(): void {
  const manager = useDeviceManager();
  const activeDevice = useDeviceStore((state) => state.activeDevice);
  const isConnecting = useDeviceStore((state) => state.isConnecting);
  const isDisconnecting = useDeviceStore((state) => state.isDisconnecting);
  const setActiveDevice = useDeviceStore((state) => state.setActiveDevice);
  const setError = useDeviceStore((state) => state.setError);

  const activeDeviceId = activeDevice?.id;

  useEffect(() => {
    if (!activeDeviceId || isConnecting || isDisconnecting) {
      return;
    }

    const reconcile = (): void => {
      const snapshot = useDeviceStore.getState().activeDevice;
      if (snapshot?.id !== activeDeviceId) {
        return;
      }

      if (
        useDeviceStore.getState().isConnecting ||
        useDeviceStore.getState().isDisconnecting
      ) {
        return;
      }

      const device = manager.getDevice(snapshot.id);
      const connectionState = device?.connection.state;
      const lost =
        !device ||
        connectionState === "disconnected" ||
        connectionState === "error";

      if (!lost) {
        return;
      }

      void (async () => {
        if (device) {
          try {
            await manager.disconnect(snapshot.id);
          } catch {
            // Best-effort cleanup when the port is already gone.
          }
        }

        const current = useDeviceStore.getState().activeDevice;
        if (current?.id !== snapshot.id) {
          return;
        }

        setActiveDevice(null);
        setError(
          "lost",
          "The serial device was disconnected unexpectedly. Reconnect from Devices to continue.",
        );
      })();
    };

    const intervalId = window.setInterval(reconcile, POLL_INTERVAL_MS);
    reconcile();

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    activeDeviceId,
    isConnecting,
    isDisconnecting,
    manager,
    setActiveDevice,
    setError,
  ]);
}
