/**
 * Parses unknown JSON into a {@link FirmwareManifestDocument}.
 */

import type { FirmwareSourceKind } from "@/features/firmware/FirmwareManifest";
import {
  FIRMWARE_MANIFEST_SCHEMA_VERSION,
  isFirmwareCompatibleChipFamily,
  parseFirmwareAddress,
  type FirmwareCompatibleChipFamily,
  type FirmwareManifestDocument,
  type FirmwareManifestImageRef,
  type FirmwareManifestParseResult,
  type FirmwareManifestValidationIssue,
} from "@/features/firmware/FirmwareManifestSchema";
import { validateFirmwareManifestDocument } from "@/features/firmware/FirmwareManifestValidator";

const SOURCE_KINDS: readonly FirmwareSourceKind[] = [
  "local",
  "github",
  "esp-web-tools",
  "remote",
];

/**
 * Parses a JSON text payload into a validated firmware manifest document.
 *
 * @param text - Raw JSON string
 */
export function parseFirmwareManifestJson(
  text: string,
): FirmwareManifestParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid JSON payload.";
    return {
      ok: false,
      issues: [
        {
          code: "invalid-json",
          path: "",
          message: `Firmware manifest JSON could not be parsed: ${message}`,
        },
      ],
    };
  }

  return parseFirmwareManifestValue(value);
}

/**
 * Parses an unknown value (already-decoded JSON) into a validated document.
 *
 * @param value - Unknown input (typically `JSON.parse` output)
 */
export function parseFirmwareManifestValue(
  value: unknown,
): FirmwareManifestParseResult {
  const issues: FirmwareManifestValidationIssue[] = [];
  const document = coerceDocument(value, issues);

  if (document === undefined) {
    return { ok: false, issues };
  }

  return validateFirmwareManifestDocument(document);
}

function coerceDocument(
  value: unknown,
  issues: FirmwareManifestValidationIssue[],
): FirmwareManifestDocument | undefined {
  if (!isPlainObject(value)) {
    issues.push({
      code: "invalid-type",
      path: "",
      message: "Firmware manifest root must be a JSON object.",
    });
    return undefined;
  }

  const schemaVersion = value.schemaVersion;
  if (schemaVersion !== FIRMWARE_MANIFEST_SCHEMA_VERSION) {
    const rendered =
      typeof schemaVersion === "number" || typeof schemaVersion === "string"
        ? String(schemaVersion)
        : typeof schemaVersion;
    issues.push({
      code: "unsupported-schema-version",
      path: "/schemaVersion",
      message:
        schemaVersion === undefined
          ? "Missing required field schemaVersion."
          : `Unsupported firmware manifest schemaVersion ${rendered}; expected ${String(FIRMWARE_MANIFEST_SCHEMA_VERSION)}.`,
    });
  }

  const id = readRequiredString(value, "id", "/id", issues);
  const title = readRequiredString(value, "title", "/title", issues);
  const sourceKind = readSourceKind(value.sourceKind, issues);
  const images = readImages(value.images, issues);
  const chipFamilies = readChipFamilies(value.chipFamilies, issues);

  const description = readOptionalString(value, "description", "/description", issues);
  const version = readOptionalString(value, "version", "/version", issues);
  const providerId = readOptionalString(value, "providerId", "/providerId", issues);

  if (
    id === undefined ||
    title === undefined ||
    sourceKind === undefined ||
    images === undefined ||
    chipFamilies === undefined
  ) {
    return undefined;
  }

  if (issues.length > 0) {
    return undefined;
  }

  return {
    schemaVersion: FIRMWARE_MANIFEST_SCHEMA_VERSION,
    id,
    title,
    sourceKind,
    chipFamilies,
    images,
    ...(description !== undefined ? { description } : {}),
    ...(version !== undefined ? { version } : {}),
    ...(providerId !== undefined ? { providerId } : {}),
  };
}

function readImages(
  value: unknown,
  issues: FirmwareManifestValidationIssue[],
): readonly FirmwareManifestImageRef[] | undefined {
  if (value === undefined) {
    issues.push({
      code: "missing-field",
      path: "/images",
      message: "Missing required field images.",
    });
    return undefined;
  }

  if (!Array.isArray(value)) {
    issues.push({
      code: "invalid-type",
      path: "/images",
      message: "Field images must be an array.",
    });
    return undefined;
  }

  if (value.length === 0) {
    issues.push({
      code: "empty-images",
      path: "/images",
      message: "Manifest must declare at least one image.",
    });
    return undefined;
  }

  const images: FirmwareManifestImageRef[] = [];
  let failed = false;

  for (const [index, entry] of value.entries()) {
    const image = readImageRef(entry, index, issues);
    if (image === undefined) {
      failed = true;
      continue;
    }
    images.push(image);
  }

  return failed ? undefined : images;
}

function readImageRef(
  value: unknown,
  index: number,
  issues: FirmwareManifestValidationIssue[],
): FirmwareManifestImageRef | undefined {
  const base = `/images/${String(index)}`;

  if (!isPlainObject(value)) {
    issues.push({
      code: "invalid-type",
      path: base,
      message: "Each images[] entry must be an object.",
    });
    return undefined;
  }

  const id = readRequiredString(value, "id", `${base}/id`, issues);
  const label = readRequiredString(value, "label", `${base}/label`, issues);
  const address = parseFirmwareAddress(value.address);

  if (value.address === undefined) {
    issues.push({
      code: "missing-field",
      path: `${base}/address`,
      message: "Missing required field address.",
    });
  } else if (address === undefined) {
    issues.push({
      code: "invalid-address",
      path: `${base}/address`,
      message: "Image address must be a non-negative integer or hex string.",
    });
  }

  const path = readOptionalString(value, "path", `${base}/path`, issues);
  const sha256 = readOptionalString(value, "sha256", `${base}/sha256`, issues);

  let size: number | undefined;
  if (value.size !== undefined) {
    if (typeof value.size !== "number" || !Number.isInteger(value.size) || value.size < 0) {
      issues.push({
        code: "invalid-type",
        path: `${base}/size`,
        message: "Image size must be a non-negative integer when provided.",
      });
    } else {
      size = value.size;
    }
  }

  if (id === undefined || label === undefined || address === undefined) {
    return undefined;
  }

  return {
    id,
    label,
    address,
    ...(path !== undefined ? { path } : {}),
    ...(size !== undefined ? { size } : {}),
    ...(sha256 !== undefined ? { sha256 } : {}),
  };
}

function readChipFamilies(
  value: unknown,
  issues: FirmwareManifestValidationIssue[],
): readonly FirmwareCompatibleChipFamily[] | undefined {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    issues.push({
      code: "invalid-type",
      path: "/chipFamilies",
      message: "Field chipFamilies must be an array of strings when provided.",
    });
    return undefined;
  }

  const families: FirmwareCompatibleChipFamily[] = [];
  let failed = false;

  for (const [index, entry] of value.entries()) {
    if (typeof entry !== "string") {
      issues.push({
        code: "invalid-type",
        path: `/chipFamilies/${String(index)}`,
        message: "Each chipFamilies entry must be a string.",
      });
      failed = true;
      continue;
    }

    if (!isFirmwareCompatibleChipFamily(entry)) {
      issues.push({
        code: "unsupported-chip-family",
        path: `/chipFamilies/${String(index)}`,
        message: `Unsupported chip family "${entry}".`,
      });
      failed = true;
      continue;
    }

    families.push(entry);
  }

  return failed ? undefined : families;
}

function readSourceKind(
  value: unknown,
  issues: FirmwareManifestValidationIssue[],
): FirmwareSourceKind | undefined {
  if (value === undefined) {
    issues.push({
      code: "missing-field",
      path: "/sourceKind",
      message: "Missing required field sourceKind.",
    });
    return undefined;
  }

  if (typeof value !== "string" || !isSourceKind(value)) {
    issues.push({
      code: "invalid-type",
      path: "/sourceKind",
      message: "Field sourceKind must be one of local, github, esp-web-tools, remote.",
    });
    return undefined;
  }

  return value;
}

function isSourceKind(value: string): value is FirmwareSourceKind {
  return (SOURCE_KINDS as readonly string[]).includes(value);
}

function readRequiredString(
  object: Readonly<Record<string, unknown>>,
  key: string,
  path: string,
  issues: FirmwareManifestValidationIssue[],
): string | undefined {
  const value = object[key];
  if (value === undefined) {
    issues.push({
      code: "missing-field",
      path,
      message: `Missing required field ${key}.`,
    });
    return undefined;
  }

  if (typeof value !== "string") {
    issues.push({
      code: "invalid-type",
      path,
      message: `Field ${key} must be a string.`,
    });
    return undefined;
  }

  if (value.trim().length === 0) {
    issues.push({
      code: "missing-field",
      path,
      message: `Field ${key} must be a non-empty string.`,
    });
    return undefined;
  }

  return value;
}

function readOptionalString(
  object: Readonly<Record<string, unknown>>,
  key: string,
  path: string,
  issues: FirmwareManifestValidationIssue[],
): string | undefined {
  const value = object[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    issues.push({
      code: "invalid-type",
      path,
      message: `Field ${key} must be a string when provided.`,
    });
    return undefined;
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
