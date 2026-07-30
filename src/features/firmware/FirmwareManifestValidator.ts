/**
 * Validates firmware manifest documents and optional image blobs.
 */

import type { FirmwareImage } from "@/features/firmware/FirmwareImage";
import type { FirmwareSourceKind } from "@/features/firmware/FirmwareManifest";
import {
  FIRMWARE_MANIFEST_SUPPORTED_SCHEMA_VERSIONS,
  isFirmwareCompatibleChipFamily,
  type FirmwareCompatibleChipFamily,
  type FirmwareFilesystemSupport,
  type FirmwareManifestDocument,
  type FirmwareManifestImageRef,
  type FirmwareManifestPackageKind,
  type FirmwareManifestValidationIssue,
  type FirmwareManifestValidationResult,
} from "@/features/firmware/FirmwareManifestSchema";

const SOURCE_KINDS: readonly FirmwareSourceKind[] = [
  "local",
  "github",
  "esp-web-tools",
  "remote",
];

const PACKAGE_KINDS: readonly FirmwareManifestPackageKind[] = [
  "complete",
  "application-only",
];

const FILESYSTEM_SUPPORT: readonly FirmwareFilesystemSupport[] = [
  "none",
  "spiffs",
  "littlefs",
  "both",
];

/**
 * Looser document shape accepted by the validator before narrowing.
 */
export type FirmwareManifestDocumentInput = {
  readonly schemaVersion: number;
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly version?: string;
  readonly sourceKind: string;
  readonly providerId?: string;
  readonly packageKind?: string;
  readonly filesystemSupport?: string;
  readonly chipFamilies: readonly string[];
  readonly images: readonly {
    readonly id: string;
    readonly label: string;
    readonly address: number;
    readonly path?: string;
    readonly size?: number;
    readonly sha256?: string;
    readonly required?: boolean;
  }[];
};

/**
 * Options for {@link validateFirmwareManifestDocument}.
 */
export type FirmwareManifestValidateOptions = {
  /**
   * Optional resolved image payloads keyed by image id, or a FirmwareImage list.
   *
   * When provided, every manifest image id must exist with non-empty bytes.
   */
  readonly images?:
    | ReadonlyMap<string, Uint8Array>
    | readonly FirmwareImage[];
};

/**
 * Validates a firmware manifest document.
 *
 * @param document - Candidate document
 * @param options - Optional image existence checks
 */
export function validateFirmwareManifestDocument(
  document: FirmwareManifestDocumentInput,
  options: FirmwareManifestValidateOptions = {},
): FirmwareManifestValidationResult {
  const issues: FirmwareManifestValidationIssue[] = [];

  if (
    !(FIRMWARE_MANIFEST_SUPPORTED_SCHEMA_VERSIONS as readonly number[]).includes(
      document.schemaVersion,
    )
  ) {
    issues.push({
      code: "unsupported-schema-version",
      path: "/schemaVersion",
      message: `Unsupported firmware manifest schemaVersion ${String(document.schemaVersion)}; expected one of ${FIRMWARE_MANIFEST_SUPPORTED_SCHEMA_VERSIONS.join(", ")}.`,
    });
  }

  if (document.id.trim().length === 0) {
    issues.push({
      code: "missing-field",
      path: "/id",
      message: "Manifest id must be a non-empty string.",
    });
  }

  if (document.title.trim().length === 0) {
    issues.push({
      code: "missing-field",
      path: "/title",
      message: "Manifest title must be a non-empty string.",
    });
  }

  if (!isSourceKind(document.sourceKind)) {
    issues.push({
      code: "invalid-type",
      path: "/sourceKind",
      message: `Invalid sourceKind "${document.sourceKind}".`,
    });
  }

  const chipFamilies: FirmwareCompatibleChipFamily[] = [];
  for (const [index, family] of document.chipFamilies.entries()) {
    if (!isFirmwareCompatibleChipFamily(family)) {
      issues.push({
        code: "unsupported-chip-family",
        path: `/chipFamilies/${String(index)}`,
        message: `Unsupported chip family "${family}".`,
      });
    } else {
      chipFamilies.push(family);
    }
  }

  if (document.images.length === 0) {
    issues.push({
      code: "empty-images",
      path: "/images",
      message: "Manifest must declare at least one image.",
    });
  }

  const seenIds = new Map<string, number>();
  const seenAddresses = new Map<number, number>();
  const images: FirmwareManifestImageRef[] = [];

  for (const [index, image] of document.images.entries()) {
    const normalized = validateImageRef(
      image,
      index,
      issues,
      seenIds,
      seenAddresses,
    );
    if (normalized !== undefined) {
      images.push(normalized);
    }
  }

  if (options.images !== undefined) {
    validateImageExistence(document.images, options.images, issues);
  }

  let packageKind: FirmwareManifestPackageKind | undefined;
  if (document.packageKind !== undefined) {
    if (!isPackageKind(document.packageKind)) {
      issues.push({
        code: "invalid-type",
        path: "/packageKind",
        message: `Invalid packageKind "${document.packageKind}". Expected "complete" or "application-only".`,
      });
    } else {
      packageKind = document.packageKind;
    }
  }

  let filesystemSupport: FirmwareFilesystemSupport | undefined;
  if (document.filesystemSupport !== undefined) {
    if (!isFilesystemSupport(document.filesystemSupport)) {
      issues.push({
        code: "invalid-type",
        path: "/filesystemSupport",
        message: `Invalid filesystemSupport "${document.filesystemSupport}".`,
      });
    } else {
      filesystemSupport = document.filesystemSupport;
    }
  }

  if (issues.length > 0 || !isSourceKind(document.sourceKind)) {
    return { ok: false, issues };
  }

  const schemaVersion = document.schemaVersion === 1 ? 1 : 2;

  const normalized: FirmwareManifestDocument = {
    schemaVersion,
    id: document.id,
    title: document.title,
    sourceKind: document.sourceKind,
    chipFamilies,
    images,
    ...(document.description !== undefined
      ? { description: document.description }
      : {}),
    ...(document.version !== undefined ? { version: document.version } : {}),
    ...(document.providerId !== undefined
      ? { providerId: document.providerId }
      : {}),
    ...(packageKind !== undefined ? { packageKind } : {}),
    ...(filesystemSupport !== undefined ? { filesystemSupport } : {}),
  };

  return { ok: true, document: normalized };
}

function validateImageRef(
  image: {
    readonly id: string;
    readonly label: string;
    readonly address: number;
    readonly path?: string;
    readonly size?: number;
    readonly sha256?: string;
    readonly required?: boolean;
  },
  index: number,
  issues: FirmwareManifestValidationIssue[],
  seenIds: Map<string, number>,
  seenAddresses: Map<number, number>,
): FirmwareManifestImageRef | undefined {
  const base = `/images/${String(index)}`;
  let valid = true;

  if (image.id.trim().length === 0) {
    issues.push({
      code: "missing-field",
      path: `${base}/id`,
      message: "Image id must be a non-empty string.",
    });
    valid = false;
  } else if (seenIds.has(image.id)) {
    issues.push({
      code: "duplicate-image-id",
      path: `${base}/id`,
      message: `Duplicate image id "${image.id}" (also at /images/${String(seenIds.get(image.id))}/id).`,
    });
    valid = false;
  } else {
    seenIds.set(image.id, index);
  }

  if (image.label.trim().length === 0) {
    issues.push({
      code: "missing-field",
      path: `${base}/label`,
      message: "Image label must be a non-empty string.",
    });
    valid = false;
  }

  if (
    !Number.isInteger(image.address) ||
    image.address < 0 ||
    !Number.isFinite(image.address)
  ) {
    issues.push({
      code: "invalid-address",
      path: `${base}/address`,
      message: `Image address must be a non-negative integer (received ${String(image.address)}).`,
    });
    valid = false;
  } else if (seenAddresses.has(image.address)) {
    issues.push({
      code: "duplicate-address",
      path: `${base}/address`,
      message: `Duplicate flash address 0x${image.address.toString(16)} (also at /images/${String(seenAddresses.get(image.address))}/address).`,
    });
    valid = false;
  } else {
    seenAddresses.set(image.address, index);
  }

  if (
    image.size !== undefined &&
    (!Number.isInteger(image.size) || image.size < 0)
  ) {
    issues.push({
      code: "invalid-type",
      path: `${base}/size`,
      message: "Image size must be a non-negative integer when provided.",
    });
    valid = false;
  }

  if (image.required !== undefined && typeof image.required !== "boolean") {
    issues.push({
      code: "invalid-type",
      path: `${base}/required`,
      message: "Image required must be a boolean when provided.",
    });
    valid = false;
  }

  if (!valid) {
    return undefined;
  }

  return {
    id: image.id,
    label: image.label,
    address: image.address,
    ...(image.path !== undefined ? { path: image.path } : {}),
    ...(image.size !== undefined ? { size: image.size } : {}),
    ...(image.sha256 !== undefined ? { sha256: image.sha256 } : {}),
    ...(image.required !== undefined ? { required: image.required } : {}),
  };
}

function validateImageExistence(
  refs: readonly { readonly id: string; readonly size?: number }[],
  images: ReadonlyMap<string, Uint8Array> | readonly FirmwareImage[],
  issues: FirmwareManifestValidationIssue[],
): void {
  const blobById = toBlobMap(images);

  for (const [index, ref] of refs.entries()) {
    const blob = blobById.get(ref.id);
    const path = `/images/${String(index)}`;

    if (blob === undefined || blob.byteLength === 0) {
      issues.push({
        code: "image-missing",
        path,
        message: `Image payload for id "${ref.id}" is missing or empty.`,
      });
      continue;
    }

    if (ref.size !== undefined && ref.size !== blob.byteLength) {
      issues.push({
        code: "image-size-mismatch",
        path: `${path}/size`,
        message: `Image "${ref.id}" declared size ${String(ref.size)} but payload length is ${String(blob.byteLength)}.`,
      });
    }
  }
}

function toBlobMap(
  images: ReadonlyMap<string, Uint8Array> | readonly FirmwareImage[],
): ReadonlyMap<string, Uint8Array> {
  if (isFirmwareImageArray(images)) {
    const map = new Map<string, Uint8Array>();
    for (const image of images) {
      map.set(image.id, image.data);
    }
    return map;
  }

  return new Map(images);
}

function isFirmwareImageArray(
  images: ReadonlyMap<string, Uint8Array> | readonly FirmwareImage[],
): images is readonly FirmwareImage[] {
  return Array.isArray(images);
}

function isSourceKind(value: string): value is FirmwareSourceKind {
  return (SOURCE_KINDS as readonly string[]).includes(value);
}

function isPackageKind(value: string): value is FirmwareManifestPackageKind {
  return (PACKAGE_KINDS as readonly string[]).includes(value);
}

function isFilesystemSupport(
  value: string,
): value is FirmwareFilesystemSupport {
  return (FILESYSTEM_SUPPORT as readonly string[]).includes(value);
}
