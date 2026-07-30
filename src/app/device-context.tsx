import {
  createContext,
  useContext,
  useMemo,
  type JSX,
  type ReactNode,
} from "react";

import type { DeviceManager } from "@/core/device";

import { createDeviceRuntime } from "./device-runtime";

const DeviceManagerContext = createContext<DeviceManager | null>(null);

type DeviceManagerProviderProps = {
  children: ReactNode;
  /** Optional manager override for tests. */
  manager?: DeviceManager;
};

/**
 * Provides the shared {@link DeviceManager} to the React tree.
 */
export function DeviceManagerProvider({
  children,
  manager: managerOverride,
}: DeviceManagerProviderProps): JSX.Element {
  const manager = useMemo(
    () => managerOverride ?? createDeviceRuntime(),
    [managerOverride],
  );

  return (
    <DeviceManagerContext.Provider value={manager}>
      {children}
    </DeviceManagerContext.Provider>
  );
}

/**
 * Accesses the app-wide {@link DeviceManager}.
 *
 * @throws When used outside {@link DeviceManagerProvider}.
 */
export function useDeviceManager(): DeviceManager {
  const manager = useContext(DeviceManagerContext);
  if (!manager) {
    throw new Error(
      "useDeviceManager must be used within DeviceManagerProvider",
    );
  }
  return manager;
}
