/**
 * Typed errors for {@link import("./GitHubFirmwareProvider").GitHubFirmwareProvider}.
 */

/**
 * Machine-readable GitHub firmware provider error codes.
 */
export type GitHubFirmwareProviderErrorCode =
  | "invalid-repository"
  | "repository-not-found"
  | "release-not-found"
  | "network-failure"
  | "proxy-unavailable"
  | "invalid-manifest"
  | "duplicate-manifests"
  | "unsupported-manifest-version"
  | "missing-firmware-assets";

/**
 * Provider error with a stable {@link GitHubFirmwareProviderErrorCode}.
 *
 * Flash UI should catch these instead of raw `fetch` failures.
 */
export class GitHubFirmwareProviderError extends Error {
  readonly code: GitHubFirmwareProviderErrorCode;

  /**
   * @param code - Stable error code
   * @param message - Human-readable message for alerts
   * @param options - Optional `Error` cause
   */
  constructor(
    code: GitHubFirmwareProviderErrorCode,
    message: string,
    options?: { readonly cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "GitHubFirmwareProviderError";
    this.code = code;
  }
}

/**
 * Returns whether `error` is a {@link GitHubFirmwareProviderError}.
 *
 * @param error - Unknown thrown value
 */
export function isGitHubFirmwareProviderError(
  error: unknown,
): error is GitHubFirmwareProviderError {
  return error instanceof GitHubFirmwareProviderError;
}
