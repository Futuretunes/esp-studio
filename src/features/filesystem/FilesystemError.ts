/**
 * Typed errors for filesystem browse operations.
 */

/**
 * Machine-readable filesystem error codes.
 */
export type FilesystemErrorCode =
  | "no-device"
  | "busy"
  | "not-found"
  | "unsupported"
  | "io-failure"
  | "invalid-path";

/**
 * Filesystem feature error with a stable {@link FilesystemErrorCode}.
 */
export class FilesystemError extends Error {
  readonly code: FilesystemErrorCode;

  /**
   * @param code - Stable error code
   * @param message - Human-readable message
   * @param options - Optional cause
   */
  constructor(
    code: FilesystemErrorCode,
    message: string,
    options?: { readonly cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "FilesystemError";
    this.code = code;
  }
}

/**
 * Type guard for {@link FilesystemError}.
 *
 * @param error - Unknown thrown value
 */
export function isFilesystemError(error: unknown): error is FilesystemError {
  return error instanceof FilesystemError;
}
