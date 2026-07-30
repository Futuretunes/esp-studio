/**
 * Feature flags describing what a live connection can support.
 *
 * Capabilities are declared by providers when opening a
 * {@link import("./DeviceConnection").DeviceConnection}. Higher-level
 * modules (flash, serial, filesystem, OTA) must check these flags before
 * invoking transport-specific operations.
 */
export type DeviceCapabilities = {
  /** Connection can stream serial IO. */
  readonly serial: boolean;
  /** Connection can perform firmware flashing. */
  readonly flash: boolean;
  /** Connection can access on-device filesystems. */
  readonly filesystem: boolean;
  /** Connection can participate in OTA workflows. */
  readonly ota: boolean;
  /** Baud rate can be configured for this connection. */
  readonly baudRateControl: boolean;
};

/**
 * Capabilities object with every flag set to `false`.
 */
export const EMPTY_DEVICE_CAPABILITIES: DeviceCapabilities = {
  serial: false,
  flash: false,
  filesystem: false,
  ota: false,
  baudRateControl: false,
};
