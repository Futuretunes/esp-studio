import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type JSX,
  type ReactNode,
} from "react";

import type { DeviceManager } from "@/core/device";
import { useDeviceStore } from "@/store";

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
  const setOperationOwner = useDeviceStore((state) => state.setOperationOwner);
  const activeDeviceId = useDeviceStore((state) => state.activeDevice?.id);

  useEffect(() => {
    return manager.subscribeOperationOwner((deviceId, ownerId) => {
      const activeId = useDeviceStore.getState().activeDevice?.id;
      if (activeId === undefined || activeId === deviceId) {
        setOperationOwner(ownerId);
      }
    });
  }, [manager, setOperationOwner]);

  useEffect(() => {
    if (!activeDeviceId) {
      setOperationOwner(null);
      return;
    }
    setOperationOwner(manager.getOperationOwner(activeDeviceId));
  }, [activeDeviceId, manager, setOperationOwner]);

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
