/**
 * Local-file firmware provider for user-selected `.bin` images.
 */

import { DEFAULT_APP_FLASH_ADDRESS } from "@/features/flash/constants";
import type {
  FirmwareCatalogEntry,
  FirmwareProvider,
  FirmwareResolvedPackage,
} from "@/features/firmware/FirmwareProvider";
import {
  createLocalFirmwareManifestDocument,
  toCatalogManifest,
} from "@/features/firmware/FirmwareManifestSchema";
import { validateFirmwareManifestDocument } from "@/features/firmware/FirmwareManifestValidator";

/** Provider id for {@link LocalFirmwareProvider}. */
export const LOCAL_FIRMWARE_PROVIDER_ID = "local" as const;

/** Catalog row id that triggers the local file picker. */
export const LOCAL_FILE_PICK_MANIFEST_ID = "local:pick" as const;

/**
 * Exposes a “Local file…” catalog entry and optional imported `.bin` package.
 */
export class LocalFirmwareProvider implements FirmwareProvider {
  readonly id = LOCAL_FIRMWARE_PROVIDER_ID;
  readonly label = "Local files";

  #current: FirmwareResolvedPackage | null = null;
  #sequence = 0;

  /**
   * Lists the pick action and, when present, the last imported local package.
   */
  list(): Promise<readonly FirmwareCatalogEntry[]> {
    const entries: FirmwareCatalogEntry[] = [
      {
        manifest: {
          id: LOCAL_FILE_PICK_MANIFEST_ID,
          title: "Local file...",
          description: "Choose a .bin firmware image from your computer.",
          providerId: this.id,
          sourceKind: "local",
        },
        action: "pick-local-file",
      },
    ];

    if (this.#current !== null) {
      entries.push({
        manifest: this.#current.manifest,
      });
    }

    return Promise.resolve(entries);
  }

  /**
   * Returns the imported package for `manifestId`.
   *
   * @param manifestId - Id of a previously imported local package
   */
  resolve(manifestId: string): Promise<FirmwareResolvedPackage> {
    if (manifestId === LOCAL_FILE_PICK_MANIFEST_ID) {
      return Promise.reject(
        new Error(
          "Select a local .bin file before resolving the Local file… entry.",
        ),
      );
    }

    if (this.#current === null || this.#current.manifest.id !== manifestId) {
      return Promise.reject(
        new Error(
          `Local firmware package "${manifestId}" is not available. Choose a file again.`,
        ),
      );
    }

    return Promise.resolve(this.#current);
  }

  /**
   * Imports a user-selected `.bin` into the catalog as the current package.
   *
   * Builds a canonical firmware manifest document, validates it (including
   * image existence), then stores the resolved package.
   *
   * @param file - Browser `File` from the file picker
   * @param address - Flash offset (default application address `0x10000`)
   */
  async importBinFile(
    file: File,
    address: number = DEFAULT_APP_FLASH_ADDRESS,
  ): Promise<FirmwareResolvedPackage> {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".bin")) {
      throw new Error("Please choose a firmware file with a .bin extension.");
    }

    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    if (data.byteLength === 0) {
      throw new Error("The selected firmware file is empty.");
    }

    this.#sequence += 1;
    const manifestId = `local:file:${String(this.#sequence)}`;
    const imageId = `${manifestId}:app`;

    const document = createLocalFirmwareManifestDocument({
      id: manifestId,
      title: file.name,
      description: "Locally selected firmware image.",
      providerId: this.id,
      imageId,
      imageLabel: "application",
      address,
      size: data.byteLength,
      path: file.name,
    });

    const images = [
      {
        id: imageId,
        label: "application",
        address,
        size: data.byteLength,
        data,
      },
    ] as const;

    const validation = validateFirmwareManifestDocument(document, { images });
    if (!validation.ok) {
      const detail = validation.issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid local firmware manifest: ${detail}`);
    }

    const resolved: FirmwareResolvedPackage = {
      manifest: toCatalogManifest(validation.document, this.id),
      images,
    };

    this.#current = resolved;
    return resolved;
  }

  /**
   * Clears the imported local package.
   */
  clear(): void {
    this.#current = null;
  }

  /**
   * Returns the currently imported package, if any.
   */
  getCurrent(): FirmwareResolvedPackage | null {
    return this.#current;
  }
}
