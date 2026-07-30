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
  /** Most recent error when `state` is `"error"`, if available. */
  readonly lastError?: Error;
  /**
   * Closes the underlying transport session.
   *
   * Idempotent: calling `close` on an already-closed connection resolves
   * without throwing.
   */
  close(): Promise<void>;
};
