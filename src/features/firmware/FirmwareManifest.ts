/**
 * Catalog metadata for an installable firmware package.
 */

/**
 * Origin kind for a firmware package.
 *
 * Additional kinds (GitHub, ESP Web Tools) are reserved for future providers.
 */
export type FirmwareSourceKind = "local" | "github" | "esp-web-tools" | "remote";

/**
 * Descriptive metadata for a catalog entry (may resolve to one or more images).
 */
export type FirmwareManifest = {
  /** Stable id within the owning provider. */
  readonly id: string;
  /** Display title in catalog UIs. */
  readonly title: string;
  /** Optional longer description. */
  readonly description?: string;
  /** Optional semantic / release version string. */
  readonly version?: string;
  /** Owning {@link FirmwareProvider} id. */
  readonly providerId: string;
  /** Where this package comes from. */
  readonly sourceKind: FirmwareSourceKind;
  /**
   * Optional chip family hints (for example `"esp32-s3"`).
   *
   * Filtering is deferred; providers may still advertise compatibility.
   */
  readonly chipFamilies?: readonly string[];
  /**
   * Optional explicit package kind from the canonical document.
   *
   * When omitted, Flash derives the kind from image labels / ids / filenames.
   */
  readonly packageKind?: "complete" | "application-only";
};
