/**
 * Flash feature — FlashService orchestration + Flash UI.
 *
 * @packageDocumentation
 */

export {
  DEFAULT_APP_FLASH_ADDRESS,
  FLASH_SERVICE_OWNER_ID,
} from "./constants";
export {
  FlashBusyError,
  FlashDeviceError,
  FlashError,
  FlashOperationError,
} from "./errors";
export { formatFirmwareSize } from "./format-firmware-size";
export { formatFlashAddress } from "./format-flash-address";
export type {
  FlashImage,
  FlashOperationOptions,
  FlashOptions,
  FlashVerifyOptions,
} from "./FlashOptions";
export {
  createFlashProgress,
  type FlashProgress,
  type FlashProgressListener,
  type FlashStage,
} from "./FlashProgress";
export type { FlashResult } from "./FlashResult";
export { FlashService } from "./FlashService";
export {
  ESP_IMAGE_MAGIC,
  FLASH_INSPECTION_SAMPLE_ADDRESSES,
  FLASH_INSPECTION_SAMPLE_LENGTH,
  aggregateFlashInspectionOutcome,
  classifyFlashRegionBytes,
  createFailedFlashInspectionReport,
  createFlashInspectionReport,
  flashInspectionRequiresConfirmation,
  formatFlashInspectionMessage,
  type FlashInspectionOutcome,
  type FlashInspectionRegion,
  type FlashInspectionReport,
  type FlashRegionStatus,
} from "./flash-inspection";
export {
  APP_ONLY_PRESERVE_MESSAGE,
  BLANK_APP_ONLY_STOP_MESSAGE,
  POST_FLASH_NOT_BOOTABLE_MESSAGE,
  planFlashInstall,
  type FlashInstallPlan,
} from "./flash-strategy";
export {
  buildProvisioningSummary,
  formatProvisioningMode,
  planProvisioningInstall,
  resolveProvisioningFilesystem,
  type ProvisioningFilesystemChoice,
  type ProvisioningMode,
  type ProvisioningPlan,
  type ProvisioningSummary,
} from "./provisioning-mode";
export { FlashFeature } from "./flash-page";
export { FlashPanel } from "./flash-panel";
export {
  isFirmwareChipCompatible,
  sortFirmwareEntriesByChipPreference,
} from "./chip-compatibility";
export {
  catalogSelectionKey,
  parseCatalogSelectionKey,
  useFlashWorkflow,
  type FlashFirmwareSource,
  type FlashUiErrorKind,
  type PendingProvisioningConfirm,
} from "./use-flash-workflow";
