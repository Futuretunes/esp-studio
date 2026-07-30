/**
 * Progress events for filesystem upload / download.
 */

/**
 * Transfer lifecycle stages.
 */
export type FilesystemTransferStage =
  | "preparing"
  | "reading"
  | "writing"
  | "completed"
  | "failed";

/**
 * Structured progress for filesystem transfers.
 */
export type FilesystemTransferProgress = {
  readonly stage: FilesystemTransferStage;
  readonly message: string;
  readonly percent?: number;
  readonly bytesTransferred?: number;
  readonly totalBytes?: number;
};

/**
 * Listener invoked when transfer progress changes.
 */
export type FilesystemTransferProgressListener = (
  progress: FilesystemTransferProgress,
) => void;

/**
 * Builds a progress event with only defined optional fields.
 */
export function createFilesystemTransferProgress(
  stage: FilesystemTransferStage,
  message: string,
  extras: {
    readonly percent?: number;
    readonly bytesTransferred?: number;
    readonly totalBytes?: number;
  } = {},
): FilesystemTransferProgress {
  return {
    stage,
    message,
    ...(extras.percent !== undefined ? { percent: extras.percent } : {}),
    ...(extras.bytesTransferred !== undefined
      ? { bytesTransferred: extras.bytesTransferred }
      : {}),
    ...(extras.totalBytes !== undefined
      ? { totalBytes: extras.totalBytes }
      : {}),
  };
}
