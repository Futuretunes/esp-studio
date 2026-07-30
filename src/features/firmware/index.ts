/**
 * Firmware catalog feature — multi-provider installable firmware source.
 *
 * @packageDocumentation
 */

export { FirmwareCatalog } from "./FirmwareCatalog";
export type { FirmwareImage } from "./FirmwareImage";
export type {
  FirmwareManifest,
  FirmwareSourceKind,
} from "./FirmwareManifest";
export type {
  FirmwareCatalogAction,
  FirmwareCatalogEntry,
  FirmwareProvider,
  FirmwareResolvedPackage,
} from "./FirmwareProvider";
export {
  LOCAL_FILE_PICK_MANIFEST_ID,
  LOCAL_FIRMWARE_PROVIDER_ID,
  LocalFirmwareProvider,
} from "./LocalFirmwareProvider";
export { FirmwareFeature } from "./firmware-page";
