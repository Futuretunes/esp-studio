import type { TransportIo } from "../transport/TransportIo";
import type { DeviceCapabilities } from "./DeviceCapabilities";
import type { DeviceConnectionState } from "./DeviceInfo";

/**
 * Active transport session for a single device.
 *
 * Implementations belong to providers. The Device Layer never opens browser
 * ports itself; it only consumes this contract.
 */
export type DeviceConnection = {
  /** Current lifecycle state. */
  readonly state: DeviceConnectionState;
  /** Operations supported by this session. */
  readonly capabilities: DeviceCapabilities;
  /**
   * Most recent error when `state` is `"error"`, if available.
   *
   * Explicit `| undefined` keeps class getters compatible with
   * `exactOptionalPropertyTypes`.
   */
  readonly lastError?: Error | undefined;
  /**
   * Optional raw byte stream for this connection.
   *
   * Present when the transport can exchange `Uint8Array` payloads. Absent for
   * connections that only support connect/disconnect metadata.
   */
  readonly io?: TransportIo | undefined;
  /**
   * Closes the underlying transport session.
   *
   * Idempotent: calling `close` on an already-closed connection resolves
   * without throwing. Implementations that expose {@link io} should close IO
   * before tearing down the transport.
   */
  close(): Promise<void>;
};
