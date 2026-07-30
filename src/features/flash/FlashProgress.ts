/**
 * Reusable flash progress model for Flash Service and future React UI.
 */

/**
 * High-level flash lifecycle stages.
 */
export type FlashStage =
  | "preparing"
  | "connecting"
  | "erasing"
  | "writing"
  | "verifying"
  | "resetting"
  | "completed"
  | "failed";

/**
 * Structured progress event emitted during flash operations.
 *
 * Designed for future React components: sync, serializable field values only
 * (no DOM / SerialPort objects).
 */
export type FlashProgress = {
  /** Current lifecycle stage. */
  readonly stage: FlashStage;
  /** Short human-readable status line. */
  readonly message: string;
  /** Optional overall percent complete in the range `0`–`100`. */
  readonly percent?: number;
  /** Zero-based image index when writing / verifying multiple files. */
  readonly fileIndex?: number;
  /** Bytes written for the current image (writing stage). */
  readonly bytesWritten?: number;
  /** Total bytes for the current image (writing stage). */
  readonly bytesTotal?: number;
};

/**
 * Listener invoked synchronously whenever progress changes.
 */
export type FlashProgressListener = (progress: FlashProgress) => void;

/**
 * Builds a progress event with only defined optional fields.
 *
 * @param stage - Lifecycle stage
 * @param message - Status message
 * @param extras - Optional numeric fields
 */
export function createFlashProgress(
  stage: FlashStage,
  message: string,
  extras: {
    readonly percent?: number;
    readonly fileIndex?: number;
    readonly bytesWritten?: number;
    readonly bytesTotal?: number;
  } = {},
): FlashProgress {
  return {
    stage,
    message,
    ...(extras.percent !== undefined ? { percent: extras.percent } : {}),
    ...(extras.fileIndex !== undefined ? { fileIndex: extras.fileIndex } : {}),
    ...(extras.bytesWritten !== undefined
      ? { bytesWritten: extras.bytesWritten }
      : {}),
    ...(extras.bytesTotal !== undefined
      ? { bytesTotal: extras.bytesTotal }
      : {}),
  };
}
