import { DeviceManager } from "@/core/device";
import { WebSerialProvider } from "@/providers/web-serial";

/**
 * Creates the application DeviceManager and registers built-in providers.
 *
 * Composition root only — feature modules must not construct their own
 * managers.
 *
 * @returns A ready-to-use {@link DeviceManager}.
 */
export function createDeviceRuntime(): DeviceManager {
  const manager = new DeviceManager();
  manager.registerProvider(new WebSerialProvider());
  return manager;
}
