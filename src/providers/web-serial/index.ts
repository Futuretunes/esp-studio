/**
 * Web Serial device provider for ESP Studio.
 *
 * @packageDocumentation
 */

export {
  WebSerialConnection,
  WEB_SERIAL_CAPABILITIES,
} from "./WebSerialConnection";
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
