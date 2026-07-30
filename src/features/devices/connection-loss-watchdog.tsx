import type { JSX } from "react";

import { useConnectionLossWatchdog } from "@/features/devices/use-connection-loss-watchdog";

/**
 * Mounts the connection-loss watchdog inside {@link DeviceManagerProvider}.
 */
export function ConnectionLossWatchdog(): JSX.Element | null {
  useConnectionLossWatchdog();
  return null;
}
