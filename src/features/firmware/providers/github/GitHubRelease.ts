/**
 * Internal GitHub release DTO (not exported from the firmware barrel).
 */

import {
  parseGitHubAsset,
  type GitHubAsset,
} from "@/features/firmware/providers/github/GitHubAsset";

/**
 * Subset of a GitHub Release used by the firmware provider.
 */
export type GitHubRelease = {
  readonly id: number;
  readonly tagName: string;
  readonly name: string | null;
  readonly publishedAt: string | null;
  readonly assets: readonly GitHubAsset[];
};

/**
 * Parses a release payload from `GET /repos/{owner}/{repo}/releases/latest`.
 *
 * @param value - Decoded JSON body
 * @returns Normalized release, or `undefined` when required fields are missing
 */
export function parseGitHubRelease(value: unknown): GitHubRelease | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const id = value.id;
  const tagName = value.tag_name;
  const name = value.name;
  const publishedAt = value.published_at;
  const rawAssets = value.assets;

  if (typeof id !== "number" || !Number.isInteger(id)) {
    return undefined;
  }

  if (typeof tagName !== "string" || tagName.trim().length === 0) {
    return undefined;
  }

  if (name !== null && name !== undefined && typeof name !== "string") {
    return undefined;
  }

  if (
    publishedAt !== null &&
    publishedAt !== undefined &&
    typeof publishedAt !== "string"
  ) {
    return undefined;
  }

  if (!Array.isArray(rawAssets)) {
    return undefined;
  }

  const assets: GitHubAsset[] = [];
  for (const entry of rawAssets) {
    const asset = parseGitHubAsset(entry);
    if (asset !== undefined) {
      assets.push(asset);
    }
  }

  return {
    id,
    tagName,
    name: typeof name === "string" ? name : null,
    publishedAt: typeof publishedAt === "string" ? publishedAt : null,
    assets,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
