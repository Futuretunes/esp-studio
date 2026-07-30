/**
 * Canonical firmware manifest schema (document format + shared constants).
 *
 * This is the serializable contract between Firmware Providers and FlashService.
 * The lighter {@link FirmwareManifest} type remains the catalog list projection.
 */

import type { ChipFamily } from "@/core/device";
import type { FirmwareSourceKind } from "@/features/firmware/FirmwareManifest";
import type { FirmwareManifest } from "@/features/firmware/FirmwareManifest";

/**
 * Current firmware manifest JSON schema version.
 */
export const FIRMWARE_MANIFEST_SCHEMA_VERSION = 1 as const;

/**
 * Chip families that may appear in `chipFamilies` (excludes `"unknown"`).
 */
export type FirmwareCompatibleChipFamily = Exclude<ChipFamily, "unknown">;

/**
 * Supported chip family ids for manifest compatibility lists.
 */
export const FIRMWARE_COMPATIBLE_CHIP_FAMILIES = [
  "esp8266",
  "esp32",
  "esp32-s2",
  "esp32-s3",
  "esp32-c2",
  "esp32-c3",
  "esp32-c6",
  "esp32-h2",
] as const satisfies readonly FirmwareCompatibleChipFamily[];

/**
 * One image layout entry inside a {@link FirmwareManifestDocument}.
 *
 * Payload bytes are not embedded; providers resolve `path` / id to
 * {@link import("./FirmwareImage").FirmwareImage} at flash time.
 */
export type FirmwareManifestImageRef = {
  /** Stable id within the document. */
  readonly id: string;
  /** Human-readable part label. */
  readonly label: string;
  /** Absolute flash address (normalized integer). */
  readonly address: number;
  /** Optional logical artifact path for bundles / remotes. */
  readonly path?: string;
  /** Optional expected byte length. */
  readonly size?: number;
  /** Optional lowercase hex SHA-256 (verification deferred). */
  readonly sha256?: string;
};

/**
 * Canonical firmware package document (`schemaVersion: 1`).
 */
export type FirmwareManifestDocument = {
  /** Schema version; must equal {@link FIRMWARE_MANIFEST_SCHEMA_VERSION}. */
  readonly schemaVersion: typeof FIRMWARE_MANIFEST_SCHEMA_VERSION;
  /** Stable package id. */
  readonly id: string;
  /** Display title. */
  readonly title: string;
  /** Optional description. */
  readonly description?: string;
  /** Optional package / release version string. */
  readonly version?: string;
  /** Origin kind. */
  readonly sourceKind: FirmwareSourceKind;
  /** Optional owning provider id. */
  readonly providerId?: string;
  /**
   * Compatible chip families.
   *
   * Empty array means any chip. Non-empty entries must be supported ids.
   */
  readonly chipFamilies: readonly FirmwareCompatibleChipFamily[];
  /** Flash image layout (at least one entry after validation). */
  readonly images: readonly FirmwareManifestImageRef[];
};

/**
 * Machine-readable validation / parse issue codes.
 */
export type FirmwareManifestIssueCode =
  | "missing-field"
  | "invalid-type"
  | "unsupported-schema-version"
  | "unsupported-chip-family"
  | "duplicate-address"
  | "duplicate-image-id"
  | "empty-images"
  | "invalid-address"
  | "image-missing"
  | "image-size-mismatch"
  | "invalid-json";

/**
 * A single typed validation or parse issue.
 */
export type FirmwareManifestValidationIssue = {
  readonly code: FirmwareManifestIssueCode;
  /** JSON-pointer-like path (for example `/images/0/address`). */
  readonly path: string;
  readonly message: string;
};

/**
 * Successful validation / parse outcome.
 */
export type FirmwareManifestValidationSuccess = {
  readonly ok: true;
  readonly document: FirmwareManifestDocument;
};

/**
 * Failed validation / parse outcome.
 */
export type FirmwareManifestValidationFailure = {
  readonly ok: false;
  readonly issues: readonly FirmwareManifestValidationIssue[];
};

/**
 * Discriminated validation result.
 */
export type FirmwareManifestValidationResult =
  | FirmwareManifestValidationSuccess
  | FirmwareManifestValidationFailure;

/**
 * Parse result alias (same shape as validation).
 */
export type FirmwareManifestParseResult = FirmwareManifestValidationResult;

/**
 * Returns whether `value` is a supported manifest chip family id.
 *
 * @param value - Candidate chip family string
 */
export function isFirmwareCompatibleChipFamily(
  value: string,
): value is FirmwareCompatibleChipFamily {
  return (FIRMWARE_COMPATIBLE_CHIP_FAMILIES as readonly string[]).includes(
    value,
  );
}

/**
 * Parses a flash address from a number or hex string.
 *
 * @param value - Address as number or `"0x…"` / decimal string
 * @returns Non-negative integer address, or `undefined` when invalid
 */
export function parseFirmwareAddress(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return undefined;
    }

    if (/^0x[0-9a-fA-F]+$/u.test(trimmed)) {
      const parsed = Number.parseInt(trimmed, 16);
      return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
    }

    if (/^[0-9]+$/u.test(trimmed)) {
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
    }
  }

  return undefined;
}

/**
 * Projects a validated document into a catalog list {@link FirmwareManifest}.
 *
 * @param document - Canonical document
 * @param providerId - Provider that owns / listed the package
 */
export function toCatalogManifest(
  document: FirmwareManifestDocument,
  providerId: string,
): FirmwareManifest {
  return {
    id: document.id,
    title: document.title,
    providerId,
    sourceKind: document.sourceKind,
    ...(document.description !== undefined
      ? { description: document.description }
      : {}),
    ...(document.version !== undefined ? { version: document.version } : {}),
    ...(document.chipFamilies.length > 0
      ? { chipFamilies: document.chipFamilies }
      : {}),
  };
}

/**
 * Builds a minimal local single-image document (used by LocalFirmwareProvider).
 *
 * @param options - Local package fields
 */
export function createLocalFirmwareManifestDocument(options: {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly providerId?: string;
  readonly imageId: string;
  readonly imageLabel: string;
  readonly address: number;
  readonly size: number;
  readonly path?: string;
  readonly chipFamilies?: readonly FirmwareCompatibleChipFamily[];
}): FirmwareManifestDocument {
  return {
    schemaVersion: FIRMWARE_MANIFEST_SCHEMA_VERSION,
    id: options.id,
    title: options.title,
    sourceKind: "local",
    chipFamilies: options.chipFamilies ?? [],
    images: [
      {
        id: options.imageId,
        label: options.imageLabel,
        address: options.address,
        size: options.size,
        ...(options.path !== undefined ? { path: options.path } : {}),
      },
    ],
    ...(options.description !== undefined
      ? { description: options.description }
      : {}),
    ...(options.providerId !== undefined
      ? { providerId: options.providerId }
      : {}),
  };
}
