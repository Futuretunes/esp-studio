/**
 * Internal GitHub release asset DTO (not exported from the firmware barrel).
 */

/**
 * Subset of a GitHub Releases asset used by the firmware provider.
 */
export type GitHubAsset = {
  readonly id: number;
  readonly name: string;
  readonly size: number;
  readonly browserDownloadUrl: string;
};

/**
 * Parses a single asset object from the GitHub REST API JSON.
 *
 * @param value - Unknown asset entry
 * @returns Normalized asset, or `undefined` when required fields are missing
 */
export function parseGitHubAsset(value: unknown): GitHubAsset | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const id = value.id;
  const name = value.name;
  const size = value.size;
  const browserDownloadUrl = value.browser_download_url;

  if (typeof id !== "number" || !Number.isInteger(id)) {
    return undefined;
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    return undefined;
  }

  if (typeof size !== "number" || !Number.isInteger(size) || size < 0) {
    return undefined;
  }

  if (
    typeof browserDownloadUrl !== "string" ||
    browserDownloadUrl.trim().length === 0
  ) {
    return undefined;
  }

  return {
    id,
    name,
    size,
    browserDownloadUrl,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
