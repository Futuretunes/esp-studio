/**
 * Public surface for the esptool adapter.
 *
 * Application and feature code may import from here; never import `esptool-js`
 * directly outside this package.
 *
 * @packageDocumentation
 */

export { DeviceOwnedTransport } from "./device-owned-transport";
export { EspToolAdapter } from "./esp-tool-adapter";
export {
  EspToolChipIdentifier,
  type EspToolSerialPort,
} from "./esp-tool-chip-identifier";
export { mapEspToolChipName } from "./map-chip-name";
export { md5Hex } from "./md5";
export type {
  ChipIdentificationResult,
  EspToolFlashFreq,
  EspToolFlashImage,
  EspToolFlashMode,
  EspToolFlashOptions,
  EspToolFlashSize,
  EspToolVerifyImageResult,
  EspToolVerifyOptions,
  EspToolVerifyResult,
  EspToolWriteProgress,
} from "./types";
