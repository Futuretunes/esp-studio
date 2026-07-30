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
export { FlashFeature } from "./flash-page";
export { FlashPanel } from "./flash-panel";
export {
  catalogSelectionKey,
  parseCatalogSelectionKey,
  useFlashWorkflow,
  type FlashUiErrorKind,
} from "./use-flash-workflow";
