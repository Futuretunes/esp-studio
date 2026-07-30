/**
 * Public surface for the esptool adapter.
 *
 * Application and feature code may import from here; never import `esptool-js`
 * directly outside this package.
 *
 * @packageDocumentation
 */

export { DeviceOwnedTransport } from "./device-owned-transport";
export {
  EspToolChipIdentifier,
  type EspToolSerialPort,
} from "./esp-tool-chip-identifier";
export { mapEspToolChipName } from "./map-chip-name";
export type { ChipIdentificationResult } from "./types";
