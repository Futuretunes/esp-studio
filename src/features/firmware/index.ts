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
  FIRMWARE_MANIFEST_SUPPORTED_SCHEMA_VERSIONS,
  createLocalFirmwareManifestDocument,
  isFirmwareCompatibleChipFamily,
  parseFirmwareAddress,
  toCatalogManifest,
  type FirmwareCompatibleChipFamily,
  type FirmwareFilesystemSupport,
  type FirmwareManifestDocument,
  type FirmwareManifestImageRef,
  type FirmwareManifestIssueCode,
  type FirmwareManifestPackageKind,
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
export {
  classifyFirmwareImageRole,
  formatFirmwareImageRoleLabel,
  formatFirmwarePackageKind,
  firmwareImageRoleUsesEspImageMagic,
  requiredFirmwarePackageImages,
  summarizeFirmwareManifestDocument,
  summarizeFirmwarePackage,
  type FirmwareImageRole,
  type FirmwarePackageImageSummary,
  type FirmwarePackageKind,
  type FirmwarePackageSummary,
} from "./firmware-package-kind";
export type {
  FirmwareCatalogAction,
  FirmwareCatalogEntry,
  FirmwareCatalogOrigin,
  FirmwareProvider,
  FirmwareResolvedPackage,
} from "./FirmwareProvider";
export {
  LOCAL_FILE_PICK_MANIFEST_ID,
  LOCAL_FIRMWARE_PROVIDER_ID,
  LocalFirmwareProvider,
} from "./LocalFirmwareProvider";
export {
  GITHUB_FIRMWARE_PROVIDER_ID,
  GITHUB_MANIFEST_FILENAMES,
  GITHUB_REPOSITORY_STORAGE_KEY,
  GitHubFirmwareProvider,
  GitHubFirmwareProviderError,
  formatGitHubRepositorySlug,
  isGitHubFirmwareProviderError,
  parseGitHubRepositorySlug,
  persistGitHubRepository,
  readPersistedGitHubRepository,
  type GitHubFirmwareProviderErrorCode,
  type GitHubReleaseSummary,
  type GitHubRepositoryRef,
} from "./providers/github";
export {
  BUILT_IN_FIRMWARE_CATALOG,
  findBuiltInCatalogEntry,
  loadBuiltInCatalog,
  type BuiltInCatalogCategory,
  type BuiltInCatalogEntry,
} from "./catalog";
