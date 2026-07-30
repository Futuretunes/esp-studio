/**
 * Transport-agnostic raw byte IO for ESP Studio.
 *
 * @packageDocumentation
 */

export type {
  TransportIo,
  TransportIoOpenOptions,
  TransportIoReadOptions,
  TransportIoState,
  TransportIoWriteOptions,
} from "./TransportIo";
export { TransportIoError, TransportIoNotOpenError } from "./TransportIoError";
