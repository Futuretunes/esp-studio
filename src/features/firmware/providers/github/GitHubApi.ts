/**
 * Minimal unauthenticated GitHub REST helpers for releases + asset downloads.
 */

import { GitHubFirmwareProviderError } from "@/features/firmware/providers/github/errors";
import {
  parseGitHubRelease,
  type GitHubRelease,
} from "@/features/firmware/providers/github/GitHubRelease";

const GITHUB_API_BASE = "https://api.github.com";

/**
 * Same-origin Vite proxy path for release asset bytes (avoids browser CORS).
 *
 * Must match `GITHUB_ASSET_PROXY_PATH` in `vite.github-asset-proxy.ts`.
 */
export const GITHUB_ASSET_PROXY_PATH = "/__esp-studio/github-asset" as const;

/**
 * User-facing copy when this deployment cannot download GitHub release assets.
 */
export const STATIC_HOST_GITHUB_DOWNLOAD_MESSAGE =
  "This deployment cannot download firmware directly from GitHub.\n\nDownload the firmware from the project's GitHub Releases page and use 'Flash Local File' instead." as const;

/** Alias of {@link STATIC_HOST_GITHUB_DOWNLOAD_MESSAGE}. */
export const GITHUB_ASSET_PROXY_UNAVAILABLE_MESSAGE =
  STATIC_HOST_GITHUB_DOWNLOAD_MESSAGE;

let proxyAvailabilityCache: boolean | null = null;
let proxyAvailabilityInflight: Promise<boolean> | null = null;

/**
 * Rewrites a GitHub asset URL through the same-origin download proxy when
 * running in a browser. Node / non-browser callers keep the absolute URL.
 *
 * @param url - Asset `browser_download_url`
 */
export function resolveGitHubAssetDownloadUrl(url: string): string {
  if (typeof window === "undefined") {
    return url;
  }

  return `${GITHUB_ASSET_PROXY_PATH}?url=${encodeURIComponent(url)}`;
}

/**
 * Clears the cached proxy probe result (tests only).
 */
export function resetGitHubAssetProxyAvailabilityCache(): void {
  proxyAvailabilityCache = null;
  proxyAvailabilityInflight = null;
}

/**
 * Probes whether the same-origin GitHub asset proxy is reachable.
 *
 * The Vite middleware answers `400` for an invalid probe URL. Static FTP hosts
 * typically return `404` or an HTML SPA shell instead.
 *
 * @returns `true` when downloads through the proxy can proceed
 */
export async function isGitHubAssetProxyAvailable(): Promise<boolean> {
  if (typeof window === "undefined") {
    return true;
  }

  if (proxyAvailabilityCache !== null) {
    return proxyAvailabilityCache;
  }

  if (proxyAvailabilityInflight !== null) {
    return proxyAvailabilityInflight;
  }

  proxyAvailabilityInflight = (async () => {
    try {
      const response = await fetch(`${GITHUB_ASSET_PROXY_PATH}?url=probe`, {
        method: "GET",
        cache: "no-store",
      });
      const contentType = response.headers.get("content-type") ?? "";

      // Middleware reject for disallowed/invalid URL → proxy is present.
      if (response.status === 400) {
        proxyAvailabilityCache = true;
        return true;
      }

      // Proxy exists but upstream failed on the probe → still treat as present.
      if (response.status === 502) {
        proxyAvailabilityCache = true;
        return true;
      }

      if (
        response.status === 404 ||
        response.status === 405 ||
        response.status === 501 ||
        contentType.toLowerCase().includes("text/html")
      ) {
        proxyAvailabilityCache = false;
        return false;
      }

      proxyAvailabilityCache = false;
      return false;
    } catch {
      proxyAvailabilityCache = false;
      return false;
    } finally {
      proxyAvailabilityInflight = null;
    }
  })();

  return proxyAvailabilityInflight;
}

/**
 * Builds a public GitHub Releases URL for a repository.
 *
 * @param owner - Repository owner
 * @param repository - Repository name
 */
export function githubReleasesUrl(owner: string, repository: string): string {
  return `https://github.com/${owner}/${repository}/releases`;
}

/**
 * Fetches the latest published release for a public repository.
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 */
export async function fetchLatestRelease(
  owner: string,
  repo: string,
): Promise<GitHubRelease> {
  const releaseUrl = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`;

  let response: Response;
  try {
    response = await fetch(releaseUrl, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });
  } catch (error) {
    throw new GitHubFirmwareProviderError(
      "network-failure",
      "Could not reach GitHub. Check your network connection and try again.",
      { cause: error },
    );
  }

  if (response.status === 404) {
    await distinguishRepoOrReleaseMissing(owner, repo);
  }

  if (!response.ok) {
    throw new GitHubFirmwareProviderError(
      "network-failure",
      `GitHub is temporarily unavailable (HTTP ${String(response.status)}). Try again in a moment.`,
    );
  }

  let body: unknown;
  try {
    body = (await response.json()) as unknown;
  } catch (error) {
    throw new GitHubFirmwareProviderError(
      "network-failure",
      "GitHub returned an unreadable release response.",
      { cause: error },
    );
  }

  const release = parseGitHubRelease(body);
  if (release === undefined) {
    throw new GitHubFirmwareProviderError(
      "network-failure",
      "GitHub returned an unexpected release payload.",
    );
  }

  return release;
}

/**
 * Downloads binary bytes from a release asset URL.
 *
 * In the browser, requests go through {@link GITHUB_ASSET_PROXY_PATH} because
 * GitHub release CDNs do not allow cross-origin reads.
 *
 * @param url - Asset `browser_download_url`
 * @param label - Filename used in error messages
 */
export async function downloadAssetBytes(
  url: string,
  label: string,
): Promise<Uint8Array> {
  const downloadUrl = resolveGitHubAssetDownloadUrl(url);

  let response: Response;
  try {
    response = await fetch(downloadUrl, {
      headers: {
        Accept: "application/octet-stream",
      },
      redirect: "follow",
    });
  } catch (error) {
    throw new GitHubFirmwareProviderError(
      "proxy-unavailable",
      STATIC_HOST_GITHUB_DOWNLOAD_MESSAGE,
      { cause: error },
    );
  }

  if (!response.ok) {
    throwProxyUnavailableIfNeeded(downloadUrl, response.status);
    throw new GitHubFirmwareProviderError(
      "network-failure",
      `Could not download "${label}" from GitHub (HTTP ${String(response.status)}). The release file may have been removed or renamed.`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (
    downloadUrl.startsWith(GITHUB_ASSET_PROXY_PATH) &&
    contentType.toLowerCase().includes("text/html")
  ) {
    throwProxyUnavailableError();
  }

  try {
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (error) {
    throw new GitHubFirmwareProviderError(
      "network-failure",
      `Could not read downloaded bytes for "${label}".`,
      { cause: error },
    );
  }
}

function throwProxyUnavailableIfNeeded(
  downloadUrl: string,
  status: number,
): void {
  if (
    downloadUrl.startsWith(GITHUB_ASSET_PROXY_PATH) &&
    (status === 404 || status === 405 || status === 501)
  ) {
    throwProxyUnavailableError();
  }
}

function throwProxyUnavailableError(): never {
  throw new GitHubFirmwareProviderError(
    "proxy-unavailable",
    STATIC_HOST_GITHUB_DOWNLOAD_MESSAGE,
  );
}

/**
 * Downloads a text body (used for manifest JSON assets).
 *
 * @param url - Asset download URL
 * @param label - Filename used in error messages
 */
export async function downloadAssetText(
  url: string,
  label: string,
): Promise<string> {
  const bytes = await downloadAssetBytes(url, label);
  return new TextDecoder("utf-8").decode(bytes);
}

async function distinguishRepoOrReleaseMissing(
  owner: string,
  repo: string,
): Promise<never> {
  const repoUrl = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  let response: Response;
  try {
    response = await fetch(repoUrl, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });
  } catch (error) {
    throw new GitHubFirmwareProviderError(
      "network-failure",
      "Could not reach GitHub. Check your network connection and try again.",
      { cause: error },
    );
  }

  if (response.status === 404) {
    throw new GitHubFirmwareProviderError(
      "repository-not-found",
      `GitHub repository "${owner}/${repo}" was not found.`,
    );
  }

  if (!response.ok) {
    throw new GitHubFirmwareProviderError(
      "network-failure",
      `GitHub is temporarily unavailable (HTTP ${String(response.status)}). Try again in a moment.`,
    );
  }

  throw new GitHubFirmwareProviderError(
    "release-not-found",
    `Repository "${owner}/${repo}" has no published latest release.`,
  );
}
