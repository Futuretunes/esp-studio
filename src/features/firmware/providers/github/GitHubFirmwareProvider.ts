/**
 * FirmwareProvider that loads packages from a GitHub repository’s latest release.
 */

import { DEFAULT_APP_FLASH_ADDRESS } from "@/features/flash/constants";
import type { FirmwareImage } from "@/features/firmware/FirmwareImage";
import type { FirmwareManifest } from "@/features/firmware/FirmwareManifest";
import { parseFirmwareManifestJson } from "@/features/firmware/FirmwareManifestParser";
import {
  toCatalogManifest,
  type FirmwareManifestDocument,
} from "@/features/firmware/FirmwareManifestSchema";
import { validateFirmwareManifestDocument } from "@/features/firmware/FirmwareManifestValidator";
import type {
  FirmwareCatalogEntry,
  FirmwareProvider,
  FirmwareResolvedPackage,
} from "@/features/firmware/FirmwareProvider";
import {
  downloadAssetBytes,
  downloadAssetText,
  fetchLatestRelease,
} from "@/features/firmware/providers/github/GitHubApi";
import type { GitHubAsset } from "@/features/firmware/providers/github/GitHubAsset";
import type { GitHubRelease } from "@/features/firmware/providers/github/GitHubRelease";
import { GitHubFirmwareProviderError } from "@/features/firmware/providers/github/errors";

/** Provider id for {@link GitHubFirmwareProvider}. */
export const GITHUB_FIRMWARE_PROVIDER_ID = "github" as const;

/** Manifest asset filenames searched on each release (exactly one required when any match). */
export const GITHUB_MANIFEST_FILENAMES = [
  "esp-studio.json",
  "firmware.json",
  "manifest.json",
] as const;

/** localStorage key for the last configured `owner/repo` slug. */
export const GITHUB_REPOSITORY_STORAGE_KEY =
  "esp-studio.firmware.github.repository" as const;

/**
 * Parsed `owner/repository` slug.
 */
export type GitHubRepositoryRef = {
  readonly owner: string;
  readonly repository: string;
};

/**
 * UI-safe summary of the loaded latest release (no REST DTOs).
 */
export type GitHubReleaseSummary = {
  readonly owner: string;
  readonly repository: string;
  readonly tagName: string;
  readonly name: string | null;
  readonly publishedAt: string | null;
};

type CachedPackage =
  | {
      readonly kind: "manifest";
      readonly entry: FirmwareCatalogEntry;
      readonly document: FirmwareManifestDocument;
      readonly release: GitHubRelease;
    }
  | {
      readonly kind: "generated";
      readonly entry: FirmwareCatalogEntry;
      readonly asset: GitHubAsset;
      readonly release: GitHubRelease;
    };

/**
 * Parses an `owner/repository` slug.
 *
 * @param slug - User input such as `Aircoookie/WLED`
 */
export function parseGitHubRepositorySlug(
  slug: string,
): GitHubRepositoryRef | null {
  const trimmed = slug.trim().replace(/^https?:\/\/github\.com\//iu, "");
  const withoutGit = trimmed.replace(/\.git$/iu, "");
  const parts = withoutGit.split("/").filter((part) => part.length > 0);

  if (parts.length !== 2) {
    return null;
  }

  const [owner, repository] = parts;
  if (
    owner === undefined ||
    repository === undefined ||
    owner.includes(" ") ||
    repository.includes(" ")
  ) {
    return null;
  }

  return { owner, repository };
}

/**
 * Formats a repository ref as `owner/repository`.
 *
 * @param ref - Parsed repository
 */
export function formatGitHubRepositorySlug(ref: GitHubRepositoryRef): string {
  return `${ref.owner}/${ref.repository}`;
}

/**
 * Reads the persisted repository slug from `localStorage`, if available.
 */
export function readPersistedGitHubRepository(): string | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    const value = localStorage.getItem(GITHUB_REPOSITORY_STORAGE_KEY);
    return value !== null && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Persists a repository slug to `localStorage`.
 *
 * @param slug - `owner/repository` string
 */
export function persistGitHubRepository(slug: string): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(GITHUB_REPOSITORY_STORAGE_KEY, slug.trim());
  } catch {
    // Ignore quota / privacy-mode failures.
  }
}

/**
 * Remote firmware source backed by GitHub Releases (latest only).
 *
 * Call {@link configureRepository} before expecting catalog entries. Firmware
 * blobs download only in {@link resolve}.
 */
export class GitHubFirmwareProvider implements FirmwareProvider {
  readonly id = GITHUB_FIRMWARE_PROVIDER_ID;
  readonly label = "GitHub Releases";

  #ref: GitHubRepositoryRef | null = null;
  #summary: GitHubReleaseSummary | null = null;
  #packages: readonly CachedPackage[] = [];

  /**
   * Lists cached catalog entries for the configured repository (empty until configured).
   */
  list(): Promise<readonly FirmwareCatalogEntry[]> {
    return Promise.resolve(this.#packages.map((item) => item.entry));
  }

  /**
   * Downloads assets required for the selected catalog entry.
   *
   * @param manifestId - Id previously returned by {@link list}
   */
  async resolve(manifestId: string): Promise<FirmwareResolvedPackage> {
    const cached = this.#packages.find(
      (item) => item.entry.manifest.id === manifestId,
    );

    if (cached === undefined) {
      throw new GitHubFirmwareProviderError(
        "missing-firmware-assets",
        `Firmware "${manifestId}" is not available. Load a GitHub repository again.`,
      );
    }

    if (cached.kind === "generated") {
      return this.#resolveGenerated(cached);
    }

    return this.#resolveManifest(cached);
  }

  /**
   * Returns the last loaded release summary, if any.
   */
  getReleaseSummary(): GitHubReleaseSummary | null {
    return this.#summary;
  }

  /**
   * Returns the configured repository ref, if any.
   */
  getRepository(): GitHubRepositoryRef | null {
    return this.#ref;
  }

  /**
   * Clears cached release metadata and catalog entries.
   */
  clear(): void {
    this.#ref = null;
    this.#summary = null;
    this.#packages = [];
  }

  /**
   * Loads the latest release for `owner/repository` and rebuilds catalog entries.
   *
   * Downloads at most one manifest JSON asset during discovery. Firmware `.bin`
   * payloads are not downloaded until {@link resolve}.
   *
   * @param slug - `owner/repository` (example `Aircoookie/WLED`)
   */
  async configureRepository(slug: string): Promise<GitHubReleaseSummary> {
    const ref = parseGitHubRepositorySlug(slug);
    if (ref === null) {
      throw new GitHubFirmwareProviderError(
        "invalid-repository",
        'Enter a repository as owner/name (for example "Aircoookie/WLED").',
      );
    }

    const release = await fetchLatestRelease(ref.owner, ref.repository);
    const packages = await this.#buildPackages(ref, release);

    this.#ref = ref;
    this.#summary = {
      owner: ref.owner,
      repository: ref.repository,
      tagName: release.tagName,
      name: release.name,
      publishedAt: release.publishedAt,
    };
    this.#packages = packages;

    persistGitHubRepository(formatGitHubRepositorySlug(ref));
    return this.#summary;
  }

  async #buildPackages(
    ref: GitHubRepositoryRef,
    release: GitHubRelease,
  ): Promise<readonly CachedPackage[]> {
    const manifestAssets = findManifestAssets(release.assets);

    if (manifestAssets.length > 1) {
      const names = manifestAssets.map((asset) => asset.name).join(", ");
      throw new GitHubFirmwareProviderError(
        "duplicate-manifests",
        `Release ${release.tagName} has multiple firmware manifests (${names}). Keep exactly one of: ${GITHUB_MANIFEST_FILENAMES.join(", ")}.`,
      );
    }

    if (manifestAssets.length === 1) {
      const asset = manifestAssets[0];
      if (asset === undefined) {
        throw new GitHubFirmwareProviderError(
          "invalid-manifest",
          "Manifest asset lookup failed unexpectedly.",
        );
      }

      const text = await downloadAssetText(asset.browserDownloadUrl, asset.name);
      const parsed = parseFirmwareManifestJson(text);

      if (!parsed.ok) {
        const unsupported = parsed.issues.find(
          (issue) => issue.code === "unsupported-schema-version",
        );
        if (unsupported !== undefined) {
          throw new GitHubFirmwareProviderError(
            "unsupported-manifest-version",
            unsupported.message,
          );
        }

        const detail = parsed.issues
          .map((issue) => `${issue.path || "/"}: ${issue.message}`)
          .join("; ");
        throw new GitHubFirmwareProviderError(
          "invalid-manifest",
          `Invalid firmware manifest in ${asset.name}: ${detail}`,
        );
      }

      const document: FirmwareManifestDocument = {
        ...parsed.document,
        sourceKind: "github",
        providerId: this.id,
        version: parsed.document.version ?? release.tagName,
      };

      const validation = validateFirmwareManifestDocument(document);
      if (!validation.ok) {
        const unsupported = validation.issues.find(
          (issue) => issue.code === "unsupported-schema-version",
        );
        if (unsupported !== undefined) {
          throw new GitHubFirmwareProviderError(
            "unsupported-manifest-version",
            unsupported.message,
          );
        }

        const detail = validation.issues
          .map((issue) => `${issue.path}: ${issue.message}`)
          .join("; ");
        throw new GitHubFirmwareProviderError(
          "invalid-manifest",
          `Invalid firmware manifest in ${asset.name}: ${detail}`,
        );
      }

      const catalogManifest = toCatalogManifest(validation.document, this.id);
      const entry: FirmwareCatalogEntry = {
        manifest: catalogManifest,
        origin: "manifest",
      };

      return [
        {
          kind: "manifest",
          entry,
          document: validation.document,
          release,
        },
      ];
    }

    return buildGeneratedPackages(ref, release, this.id);
  }

  async #resolveGenerated(
    cached: Extract<CachedPackage, { kind: "generated" }>,
  ): Promise<FirmwareResolvedPackage> {
    const data = await downloadAssetBytes(
      cached.asset.browserDownloadUrl,
      cached.asset.name,
    );

    if (data.byteLength === 0) {
      throw new GitHubFirmwareProviderError(
        "missing-firmware-assets",
        `Downloaded asset "${cached.asset.name}" is empty.`,
      );
    }

    const imageId = `${cached.entry.manifest.id}:app`;
    const images: readonly FirmwareImage[] = [
      {
        id: imageId,
        label: "application",
        address: DEFAULT_APP_FLASH_ADDRESS,
        size: data.byteLength,
        data,
      },
    ];

    return {
      manifest: cached.entry.manifest,
      images,
    };
  }

  async #resolveManifest(
    cached: Extract<CachedPackage, { kind: "manifest" }>,
  ): Promise<FirmwareResolvedPackage> {
    const images: FirmwareImage[] = [];

    for (const ref of cached.document.images) {
      const pathName = basename(ref.path ?? "");
      if (pathName.length === 0) {
        throw new GitHubFirmwareProviderError(
          "missing-firmware-assets",
          `Manifest image "${ref.id}" has no asset path to download.`,
        );
      }

      const asset = findAssetByName(cached.release.assets, pathName);
      if (asset === undefined) {
        throw new GitHubFirmwareProviderError(
          "missing-firmware-assets",
          `Release ${cached.release.tagName} is missing firmware asset "${pathName}" required by the manifest.`,
        );
      }

      const data = await downloadAssetBytes(
        asset.browserDownloadUrl,
        asset.name,
      );

      if (data.byteLength === 0) {
        throw new GitHubFirmwareProviderError(
          "missing-firmware-assets",
          `Downloaded asset "${asset.name}" is empty.`,
        );
      }

      if (ref.size !== undefined && ref.size !== data.byteLength) {
        throw new GitHubFirmwareProviderError(
          "invalid-manifest",
          `Asset "${asset.name}" size ${String(data.byteLength)} does not match manifest size ${String(ref.size)}.`,
        );
      }

      images.push({
        id: ref.id,
        label: ref.label,
        address: ref.address,
        size: data.byteLength,
        data,
      });
    }

    const validation = validateFirmwareManifestDocument(cached.document, {
      images,
    });
    if (!validation.ok) {
      const detail = validation.issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("; ");
      throw new GitHubFirmwareProviderError(
        "missing-firmware-assets",
        `Resolved GitHub firmware failed validation: ${detail}`,
      );
    }

    return {
      manifest: toCatalogManifest(validation.document, this.id),
      images,
    };
  }
}

function buildGeneratedPackages(
  ref: GitHubRepositoryRef,
  release: GitHubRelease,
  providerId: string,
): readonly CachedPackage[] {
  const binAssets = release.assets.filter((asset) =>
    asset.name.toLowerCase().endsWith(".bin"),
  );

  return binAssets.map((asset) => {
    const manifestId = `github:${ref.owner}/${ref.repository}:${release.tagName}:bin:${asset.name}`;
    const manifest: FirmwareManifest = {
      id: manifestId,
      title: asset.name,
      description: `Generated from release asset (default address 0x${DEFAULT_APP_FLASH_ADDRESS.toString(16)}).`,
      version: release.tagName,
      providerId,
      sourceKind: "github",
    };

    const entry: FirmwareCatalogEntry = {
      manifest,
      origin: "generated",
    };

    return {
      kind: "generated" as const,
      entry,
      asset,
      release,
    };
  });
}

function findManifestAssets(
  assets: readonly GitHubAsset[],
): readonly GitHubAsset[] {
  const allowed = new Set(
    GITHUB_MANIFEST_FILENAMES.map((name) => name.toLowerCase()),
  );
  return assets.filter((asset) => allowed.has(asset.name.toLowerCase()));
}

function findAssetByName(
  assets: readonly GitHubAsset[],
  name: string,
): GitHubAsset | undefined {
  const lower = name.toLowerCase();
  return assets.find((asset) => asset.name.toLowerCase() === lower);
}

function basename(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  const segments = normalized.split("/").filter((part) => part.length > 0);
  return segments.at(-1) ?? "";
}
