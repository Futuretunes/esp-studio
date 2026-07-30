/**
 * Minimal unauthenticated GitHub REST helpers for releases + asset downloads.
 */

import { GitHubFirmwareProviderError } from "@/features/firmware/providers/github/errors";
import {
  parseGitHubRelease,
  type GitHubRelease,
} from "@/features/firmware/providers/github/GitHubRelease";

const GITHUB_API_BASE = "https://api.github.com";
const USER_AGENT = "ESP-Studio";

/**
 * Same-origin Vite proxy path for release asset bytes (avoids browser CORS).
 *
 * Must match `GITHUB_ASSET_PROXY_PATH` in `vite.github-asset-proxy.ts`.
 */
export const GITHUB_ASSET_PROXY_PATH = "/__esp-studio/github-asset" as const;

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
        "User-Agent": USER_AGENT,
        "X-GitHub-Api-Version": "2022-11-28",
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
      `GitHub returned HTTP ${String(response.status)} while loading the latest release.`,
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
        "User-Agent": USER_AGENT,
      },
      redirect: "follow",
    });
  } catch (error) {
    throw new GitHubFirmwareProviderError(
      "network-failure",
      `Could not download "${label}" from GitHub. If you are not running the Vite dev/preview server, host a same-origin proxy for release assets (GitHub CDNs block browser CORS).`,
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new GitHubFirmwareProviderError(
      "network-failure",
      `GitHub returned HTTP ${String(response.status)} while downloading "${label}".`,
    );
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
        "User-Agent": USER_AGENT,
        "X-GitHub-Api-Version": "2022-11-28",
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
      `GitHub returned HTTP ${String(response.status)} while looking up "${owner}/${repo}".`,
    );
  }

  throw new GitHubFirmwareProviderError(
    "release-not-found",
    `Repository "${owner}/${repo}" has no published latest release.`,
  );
}
