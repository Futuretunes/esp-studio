/**
 * Web Serial device provider for ESP Studio.
 *
 * @packageDocumentation
 */

export {
  WebSerialConnection,
  WEB_SERIAL_CAPABILITIES,
  type WebSerialConnectionOptions,
} from "./WebSerialConnection";
export { WebSerialTransportIo } from "./WebSerialTransportIo";
export {
  isWebSerialSupported,
  WebSerialProvider,
  WEB_SERIAL_PROVIDER_ID,
  type WebSerialProviderOptions,
} from "./WebSerialProvider";
export type {
  WebSerial,
  WebSerialOpenOptions,
  WebSerialPort,
  WebSerialPortInfo,
} from "./types";
