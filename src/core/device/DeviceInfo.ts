/**
 * Opaque identifier for a device instance known to the Device Layer.
 */
export type DeviceId = string;

/**
 * Opaque identifier for a registered {@link DeviceProvider}.
 */
export type ProviderId = string;

/**
 * Lifecycle state of a device connection session.
 */
export type DeviceConnectionState =
  "disconnected" | "connecting" | "connected" | "disconnecting" | "error";

/**
 * Known ESP chip families supported by ESP Studio metadata.
 */
export type ChipFamily =
  | "esp8266"
  | "esp32"
  | "esp32-s2"
  | "esp32-s3"
  | "esp32-c2"
  | "esp32-c3"
  | "esp32-c6"
  | "esp32-h2"
  | "unknown";

/**
 * Immutable identity and descriptive metadata for a device.
 *
 * Providers produce `DeviceInfo` during discovery or request flows.
 * Consumers must treat instances as read-only snapshots.
 */
export type DeviceInfo = {
  /** Stable id within the owning provider's namespace. */
  readonly id: DeviceId;
  /** Human-readable display name. */
  readonly name: string;
  /** Provider that produced this info. */
  readonly providerId: ProviderId;
  /** Detected or declared chip family. */
  readonly chipFamily: ChipFamily;
  /** Optional transport-specific label (for example a port path). */
  readonly transportLabel?: string;
  /** Optional opaque string metadata supplied by the provider. */
  readonly metadata?: Readonly<Record<string, string>>;
};
