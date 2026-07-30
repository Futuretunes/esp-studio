/**
 * Concrete device transport providers.
 *
 * Providers implement `@/core/device` contracts and may use browser APIs.
 * The core Device Layer must not import this package.
 *
 * @packageDocumentation
 */

export {
  isWebSerialSupported,
  WebSerialConnection,
  WebSerialProvider,
  WebSerialTransportIo,
  WEB_SERIAL_CAPABILITIES,
  WEB_SERIAL_PROVIDER_ID,
  type WebSerialProviderOptions,
} from "./web-serial";
