/**
 * Provider contract for firmware catalog sources.
 */

import type { FirmwareImage } from "@/features/firmware/FirmwareImage";
import type { FirmwareManifest } from "@/features/firmware/FirmwareManifest";

/**
 * Optional UI action associated with a catalog row.
 *
 * `pick-local-file` means the Flash UI should open the file picker instead of
 * resolving bytes immediately.
 */
export type FirmwareCatalogAction = "pick-local-file";

/**
 * Whether a catalog row came from a parsed manifest document or was synthesized.
 */
export type FirmwareCatalogOrigin = "manifest" | "generated";

/**
 * A selectable row returned by {@link FirmwareProvider.list}.
 */
export type FirmwareCatalogEntry = {
  readonly manifest: FirmwareManifest;
  /** Optional UI action for interactive providers. */
  readonly action?: FirmwareCatalogAction;
  /**
   * Optional origin marker (for example GitHub `.bin` fallback entries).
   *
   * Omitted for providers that do not distinguish origins.
   */
  readonly origin?: FirmwareCatalogOrigin;
};

/**
 * Manifest plus resolved image payloads ready for flashing.
 */
export type FirmwareResolvedPackage = {
  readonly manifest: FirmwareManifest;
  readonly images: readonly FirmwareImage[];
};

/**
 * Pluggable source of installable firmware.
 *
 * Implementations must not import `esptool-js`. Downloads (when added) stay
 * inside the provider, not the Flash UI.
 */
export type FirmwareProvider = {
  /** Stable provider id (for example `"local"`). */
  readonly id: string;
  /** Human-readable provider label. */
  readonly label: string;
  /**
   * Lists catalog entries currently available from this provider.
   */
  list(): Promise<readonly FirmwareCatalogEntry[]>;
  /**
   * Resolves a listed manifest into flashable images.
   *
   * @param manifestId - Manifest id previously returned by {@link list}
   */
  resolve(manifestId: string): Promise<FirmwareResolvedPackage>;
};
