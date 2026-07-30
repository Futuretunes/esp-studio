import type { DeviceConnection } from "./DeviceConnection";
import type { DeviceInfo, ProviderId } from "./DeviceInfo";

/**
 * Optional knobs for discovery and connect flows.
 */
export type DeviceConnectOptions = {
  /** Optional abort signal to cancel an in-flight request or connect. */
  readonly signal?: AbortSignal;
};

/**
 * Transport plugin contract.
 *
 * Concrete providers (Web Serial, WebUSB, Bluetooth, Network) implement this
 * interface outside `src/core/device`. The Device Layer never imports those
 * implementations.
 */
export type DeviceProvider = {
  /** Unique provider id used for registration and connect routing. */
  readonly id: ProviderId;
  /** Human-readable provider label for UI and logs. */
  readonly label: string;
  /**
   * Reports whether this provider can be used in the current runtime.
   *
   * May be synchronous or asynchronous. Must not throw for "unsupported";
   * return `false` instead.
   */
  isAvailable(): boolean | Promise<boolean>;
  /**
   * Lists devices already known/authorized for this provider.
   *
   * Providers that cannot enumerate without a user gesture return `[]`.
   */
  listDevices(): Promise<readonly DeviceInfo[]>;
  /**
   * Requests a device selection from the user or transport.
   *
   * @param options - Optional connect options (for example abort signal).
   * @returns Metadata for the selected device (not yet connected).
   */
  requestDevice(options?: DeviceConnectOptions): Promise<DeviceInfo>;
  /**
   * Opens a live connection for the given device info.
   *
   * @param info - Device metadata previously returned by this provider.
   * @param options - Optional connect options.
   * @returns An active {@link DeviceConnection}.
   */
  connect(
    info: DeviceInfo,
    options?: DeviceConnectOptions,
  ): Promise<DeviceConnection>;
};
