import type { DeviceCapabilities } from "./DeviceCapabilities";
import type { DeviceConnection } from "./DeviceConnection";
import type { DeviceId, DeviceInfo } from "./DeviceInfo";

/**
 * Stable handle for a connected device.
 *
 * Consumers interact with devices through this interface rather than through
 * provider-specific types. Disconnecting closes the underlying
 * {@link DeviceConnection}.
 */
export type Device = {
  /** Unique id for this device handle (matches `info.id`). */
  readonly id: DeviceId;
  /** Snapshot of device metadata at connect time. */
  readonly info: DeviceInfo;
  /** Live connection session. */
  readonly connection: DeviceConnection;
  /** Convenience alias of `connection.capabilities`. */
  readonly capabilities: DeviceCapabilities;
  /**
   * Disconnects this device by closing its connection.
   *
   * Idempotent when the connection is already closed.
   */
  disconnect(): Promise<void>;
};

/**
 * Creates a {@link Device} handle around provider-supplied info and connection.
 *
 * @param info - Immutable device metadata from the provider.
 * @param connection - Live session created by the provider.
 * @returns A Device Layer handle safe for consumers to retain.
 */
export function createDevice(
  info: DeviceInfo,
  connection: DeviceConnection,
): Device {
  return {
    id: info.id,
    info,
    connection,
    capabilities: connection.capabilities,
    disconnect: async (): Promise<void> => {
      await connection.close();
    },
  };
}
