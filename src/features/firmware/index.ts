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
export {
  parseFirmwareManifestJson,
  parseFirmwareManifestValue,
} from "./FirmwareManifestParser";
export {
  FIRMWARE_COMPATIBLE_CHIP_FAMILIES,
  FIRMWARE_MANIFEST_SCHEMA_VERSION,
  createLocalFirmwareManifestDocument,
  isFirmwareCompatibleChipFamily,
  parseFirmwareAddress,
  toCatalogManifest,
  type FirmwareCompatibleChipFamily,
  type FirmwareManifestDocument,
  type FirmwareManifestImageRef,
  type FirmwareManifestIssueCode,
  type FirmwareManifestParseResult,
  type FirmwareManifestValidationFailure,
  type FirmwareManifestValidationIssue,
  type FirmwareManifestValidationResult,
  type FirmwareManifestValidationSuccess,
} from "./FirmwareManifestSchema";
export {
  validateFirmwareManifestDocument,
  type FirmwareManifestDocumentInput,
  type FirmwareManifestValidateOptions,
} from "./FirmwareManifestValidator";
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
