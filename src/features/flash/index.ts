/**
 * Flash Service feature — orchestration only (no Flash page UI).
 *
 * @packageDocumentation
 */

export { FLASH_SERVICE_OWNER_ID } from "./constants";
export {
  FlashBusyError,
  FlashDeviceError,
  FlashError,
  FlashOperationError,
} from "./errors";
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
