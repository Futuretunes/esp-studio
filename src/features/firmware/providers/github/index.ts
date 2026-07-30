/**
 * GitHub Releases firmware provider (internal REST DTOs stay unexported).
 *
 * @packageDocumentation
 */

export {
  GitHubFirmwareProviderError,
  isGitHubFirmwareProviderError,
  type GitHubFirmwareProviderErrorCode,
} from "./errors";
export {
  GITHUB_FIRMWARE_PROVIDER_ID,
  GITHUB_MANIFEST_FILENAMES,
  GITHUB_REPOSITORY_STORAGE_KEY,
  GitHubFirmwareProvider,
  formatGitHubRepositorySlug,
  parseGitHubRepositorySlug,
  persistGitHubRepository,
  readPersistedGitHubRepository,
  type GitHubReleaseSummary,
  type GitHubRepositoryRef,
} from "./GitHubFirmwareProvider";
