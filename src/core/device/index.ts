/**
 * ESP Studio Device Layer.
 *
 * Transport-agnostic contracts and orchestration for connecting to ESP
 * devices. Concrete transports (Web Serial, WebUSB, Bluetooth, Network)
 * implement {@link DeviceProvider} outside this package.
 *
 * @packageDocumentation
 */

export { createDevice, type Device } from "./Device";
export {
  EMPTY_DEVICE_CAPABILITIES,
  type DeviceCapabilities,
} from "./DeviceCapabilities";
export type { DeviceConnection } from "./DeviceConnection";
export type {
  ChipFamily,
  DeviceConnectionState,
  DeviceId,
  DeviceInfo,
  ProviderId,
} from "./DeviceInfo";
export {
  DeviceError,
  DeviceManager,
  ProviderUnavailableError,
  UnknownDeviceError,
  UnknownProviderError,
} from "./DeviceManager";
export type { DeviceConnectOptions, DeviceProvider } from "./DeviceProvider";
