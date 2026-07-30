/**
 * Classifies resolved firmware packages as complete vs application-only.
 *
 * Uses explicit manifest `packageKind` when present, otherwise image
 * labels / ids / paths. Does not invent chip-specific flash addresses.
 */

import type { FirmwareImage } from "@/features/firmware/FirmwareImage";
import type {
  FirmwareManifestDocument,
  FirmwareManifestImageRef,
} from "@/features/firmware/FirmwareManifestSchema";

/**
 * Declared or derived firmware package layout kind.
 */
export type FirmwarePackageKind = "complete" | "application-only";

/**
 * Known flash-image roles used for layout classification and UI labels.
 */
export type FirmwareImageRole =
  | "bootloader"
  | "partition-table"
  | "boot-app0"
  | "application"
  | "other";

/**
 * One classified image inside a package summary.
 */
export type FirmwarePackageImageSummary = {
  readonly id: string;
  readonly label: string;
  readonly address: number;
  readonly size?: number;
  readonly role: FirmwareImageRole;
  readonly required: boolean;
};

/**
 * Package classification result for Flash UI / install planning.
 */
export type FirmwarePackageSummary = {
  readonly kind: FirmwarePackageKind;
  /** How the kind was determined. */
  readonly kindSource: "manifest" | "images";
  readonly images: readonly FirmwarePackageImageSummary[];
  readonly hasBootloader: boolean;
  readonly hasPartitionTable: boolean;
  readonly hasBootApp0: boolean;
  readonly hasApplication: boolean;
};

/**
 * Human label for a package kind.
 *
 * @param kind - Package kind
 */
export function formatFirmwarePackageKind(kind: FirmwarePackageKind): string {
  switch (kind) {
    case "complete":
      return "Complete firmware package";
    case "application-only":
      return "Application only";
  }
}

/**
 * Human label for an image role checklist row.
 *
 * @param role - Image role
 * @param fallbackLabel - Manifest label when role is `other`
 */
export function formatFirmwareImageRoleLabel(
  role: FirmwareImageRole,
  fallbackLabel: string,
): string {
  switch (role) {
    case "bootloader":
      return "Bootloader";
    case "partition-table":
      return "Partition Table";
    case "boot-app0":
      return "boot_app0";
    case "application":
      return "Application";
    case "other":
      return fallbackLabel;
  }
}

/**
 * Maps image metadata to a known role without inventing addresses.
 *
 * Prefers label / id / filename tokens. Address alone is never used.
 *
 * @param image - Manifest ref or resolved image fields
 */
export function classifyFirmwareImageRole(image: {
  readonly id: string;
  readonly label: string;
  readonly path?: string;
}): FirmwareImageRole {
  const haystack = normalizeRoleHaystack(image.id, image.label, image.path);

  if (
    /\bboot_app0\b/.test(haystack) ||
    /\bboot-app0\b/.test(haystack) ||
    /\botadata\b/.test(haystack) ||
    /\bota_data\b/.test(haystack) ||
    /\bota-data\b/.test(haystack)
  ) {
    return "boot-app0";
  }

  if (/\bbootloader\b/.test(haystack) || /\bboot-loader\b/.test(haystack)) {
    return "bootloader";
  }

  if (/\bpartition[-_ ]?table\b/.test(haystack) || /\bpartitions?\b/.test(haystack)) {
    return "partition-table";
  }

  if (
    /\bapplication\b/.test(haystack) ||
    /\bfirmware\b/.test(haystack) ||
    /(^|[^a-z])app([^a-z]|$)/.test(haystack)
  ) {
    return "application";
  }

  return "other";
}

/**
 * Builds a {@link FirmwarePackageSummary} from a validated manifest document.
 *
 * @param document - Canonical manifest
 */
export function summarizeFirmwareManifestDocument(
  document: FirmwareManifestDocument,
): FirmwarePackageSummary {
  return summarizeFirmwarePackage({
    ...(document.packageKind !== undefined
      ? { packageKind: document.packageKind }
      : {}),
    images: document.images,
  });
}

/**
 * Builds a {@link FirmwarePackageSummary} from resolved flash images + optional kind.
 *
 * @param options - Images and optional explicit kind from the manifest
 */
export function summarizeFirmwarePackage(options: {
  readonly packageKind?: FirmwarePackageKind;
  readonly images: readonly (
    | FirmwareManifestImageRef
    | FirmwareImage
    | {
        readonly id: string;
        readonly label: string;
        readonly address: number;
        readonly size?: number;
        readonly path?: string;
        readonly required?: boolean;
      }
  )[];
}): FirmwarePackageSummary {
  const images: FirmwarePackageImageSummary[] = options.images.map((image) => {
    const role = classifyFirmwareImageRole(image);
    const required = image.required !== false;
    const size = "size" in image ? image.size : undefined;
    return {
      id: image.id,
      label: image.label,
      address: image.address,
      role,
      required,
      ...(size !== undefined ? { size } : {}),
    };
  });

  const hasBootloader = images.some((image) => image.role === "bootloader");
  const hasPartitionTable = images.some(
    (image) => image.role === "partition-table",
  );
  const hasBootApp0 = images.some((image) => image.role === "boot-app0");
  const hasApplication = images.some((image) => image.role === "application");

  if (options.packageKind !== undefined) {
    return {
      kind: options.packageKind,
      kindSource: "manifest",
      images,
      hasBootloader,
      hasPartitionTable,
      hasBootApp0,
      hasApplication,
    };
  }

  const kind = derivePackageKindFromImages(images);

  return {
    kind,
    kindSource: "images",
    images,
    hasBootloader,
    hasPartitionTable,
    hasBootApp0,
    hasApplication,
  };
}

/**
 * Images that must be written for this package (`required` defaults to true).
 *
 * @param summary - Package summary
 */
export function requiredFirmwarePackageImages(
  summary: FirmwarePackageSummary,
): readonly FirmwarePackageImageSummary[] {
  return summary.images.filter((image) => image.required);
}

/**
 * Roles whose on-flash payload starts with Espressif image magic `0xE9`.
 *
 * Partition tables and otadata use different formats.
 *
 * @param role - Image role
 */
export function firmwareImageRoleUsesEspImageMagic(
  role: FirmwareImageRole,
): boolean {
  return role === "bootloader" || role === "application";
}

function derivePackageKindFromImages(
  images: readonly FirmwarePackageImageSummary[],
): FirmwarePackageKind {
  const hasBootloader = images.some((image) => image.role === "bootloader");
  const hasApplication = images.some((image) => image.role === "application");

  // A package that includes a bootloader is a complete flash layout.
  if (hasBootloader && hasApplication) {
    return "complete";
  }

  if (hasBootloader && images.length > 1) {
    return "complete";
  }

  // Single / multi app segments without a bootloader image.
  if (!hasBootloader) {
    return "application-only";
  }

  // Bootloader present but no recognizable application label — still a
  // multi-part layout that should be flashed as a complete package.
  return "complete";
}

function normalizeRoleHaystack(
  id: string,
  label: string,
  path: string | undefined,
): string {
  const fileName =
    path === undefined
      ? ""
      : path
          .replace(/\\/gu, "/")
          .split("/")
          .pop()
          ?.replace(/\.[^.]+$/u, "") ?? "";

  return `${id} ${label} ${fileName}`
    .toLowerCase()
    .replace(/[_.]+/gu, "-")
    .replace(/\s+/gu, " ")
    .trim();
}
