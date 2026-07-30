/**
 * ESP filesystem adapter — flash-backed SPIFFS / LittleFS directory listing.
 *
 * Uses {@link EspToolAdapter.readFlash} only (no direct `esptool-js` import).
 */

import {
  EspToolAdapter,
  type EspToolSerialPort,
} from "@/adapters/esptool";
import type {
  DirectoryEntry,
  FileEntry,
  FilesystemEntry,
  FilesystemPath,
} from "@/features/filesystem/FileEntry";
import { FilesystemError } from "@/features/filesystem/FilesystemError";

const PARTITION_TABLE_ADDRESS = 0x8000;
const PARTITION_TABLE_MAX_BYTES = 0xc00;
const PARTITION_ENTRY_SIZE = 32;
const PARTITION_MAGIC = 0x50aa;
const PARTITION_TYPE_DATA = 0x01;
const PARTITION_SUBTYPE_SPIFFS = 0x82;
const PARTITION_SUBTYPE_LITTLEFS = 0x83;

type FilesystemVolume = {
  readonly label: string;
  readonly address: number;
  readonly size: number;
  readonly format: "spiffs" | "littlefs" | "unknown";
};

/**
 * Adapter that lists ESP filesystem contents from flash images.
 */
export class EspFilesystemAdapter {
  readonly #esptool: EspToolAdapter;

  /**
   * @param esptool - Shared esptool adapter used for flash reads
   */
  constructor(esptool: EspToolAdapter = new EspToolAdapter()) {
    this.#esptool = esptool;
  }

  /**
   * Lists entries at `path`.
   *
   * - `"/"` → filesystem volumes (partition labels) as directories
   * - `"/<volume>"` → files / folders inside that volume
   * - nested paths under a volume when the on-disk format exposes them
   *
   * @param port - Native Web Serial port owned by Device Layer
   * @param path - Absolute filesystem path
   */
  async listDirectory(
    port: EspToolSerialPort,
    path: FilesystemPath,
  ): Promise<readonly FilesystemEntry[]> {
    const normalized = normalizePath(path);
    if (normalized === null) {
      throw new FilesystemError(
        "invalid-path",
        `Invalid filesystem path "${path}".`,
      );
    }

    const volumes = await this.#discoverVolumes(port);

    if (normalized === "/") {
      return volumes.map((volume) => volumeToDirectory(volume));
    }

    const segments = normalized.slice(1).split("/").filter(Boolean);
    const volumeLabel = segments[0];
    if (volumeLabel === undefined) {
      throw new FilesystemError("invalid-path", "Filesystem path is empty.");
    }

    const volume = volumes.find(
      (item) => item.label.toLowerCase() === volumeLabel.toLowerCase(),
    );
    if (volume === undefined) {
      throw new FilesystemError(
        "not-found",
        `Filesystem volume "${volumeLabel}" was not found.`,
      );
    }

    const relative =
      segments.length === 1 ? "/" : `/${segments.slice(1).join("/")}`;

    try {
      const image = await this.#esptool.readFlash(
        port,
        volume.address,
        Math.min(volume.size, 4 * 1024 * 1024),
      );
      const entries = listVolumeEntries(volume, image, relative);
      return entries;
    } catch (error) {
      if (error instanceof FilesystemError) {
        throw error;
      }
      throw new FilesystemError(
        "io-failure",
        error instanceof Error
          ? error.message
          : "Failed to read the device filesystem.",
        { cause: error },
      );
    }
  }

  async #discoverVolumes(
    port: EspToolSerialPort,
  ): Promise<readonly FilesystemVolume[]> {
    let table: Uint8Array;
    try {
      table = await this.#esptool.readFlash(
        port,
        PARTITION_TABLE_ADDRESS,
        PARTITION_TABLE_MAX_BYTES,
      );
    } catch (error) {
      throw new FilesystemError(
        "io-failure",
        "Could not read the ESP partition table from flash.",
        { cause: error },
      );
    }

    const volumes = parseFilesystemVolumes(table);
    if (volumes.length === 0) {
      throw new FilesystemError(
        "unsupported",
        "No SPIFFS or LittleFS data partitions were found on this device.",
      );
    }
    return volumes;
  }
}

function volumeToDirectory(volume: FilesystemVolume): DirectoryEntry {
  return {
    kind: "directory",
    name: volume.label,
    path: `/${volume.label}`,
    size: volume.size,
  };
}

function parseFilesystemVolumes(
  table: Uint8Array,
): readonly FilesystemVolume[] {
  const volumes: FilesystemVolume[] = [];
  const view = new DataView(table.buffer, table.byteOffset, table.byteLength);

  for (
    let offset = 0;
    offset + PARTITION_ENTRY_SIZE <= table.byteLength;
    offset += PARTITION_ENTRY_SIZE
  ) {
    const magic = view.getUint16(offset, true);
    if (magic !== PARTITION_MAGIC) {
      break;
    }

    const type = table[offset + 2] ?? 0;
    const subtype = table[offset + 3] ?? 0;
    const address = view.getUint32(offset + 4, true);
    const size = view.getUint32(offset + 8, true);
    const labelBytes = table.subarray(offset + 12, offset + 28);
    const label = decodeCString(labelBytes) || `partition-${String(offset)}`;

    if (type !== PARTITION_TYPE_DATA || size === 0) {
      continue;
    }

    if (subtype === PARTITION_SUBTYPE_SPIFFS) {
      volumes.push({ label, address, size, format: "spiffs" });
    } else if (subtype === PARTITION_SUBTYPE_LITTLEFS) {
      volumes.push({ label, address, size, format: "littlefs" });
    }
  }

  return volumes;
}

function listVolumeEntries(
  volume: FilesystemVolume,
  image: Uint8Array,
  relativePath: string,
): readonly FilesystemEntry[] {
  const detected = detectFilesystemFormat(image) ?? volume.format;

  if (detected === "spiffs") {
    return listSpiffsPath(image, volume.label, relativePath);
  }

  if (detected === "littlefs") {
    return listLittleFsPath(image, volume.label, relativePath);
  }

  throw new FilesystemError(
    "unsupported",
    `Filesystem volume "${volume.label}" could not be recognized as SPIFFS or LittleFS.`,
  );
}

function detectFilesystemFormat(
  image: Uint8Array,
): "spiffs" | "littlefs" | null {
  if (image.byteLength >= 8) {
    const magic = new TextDecoder("ascii").decode(image.subarray(0, 8));
    if (magic === "littlefs") {
      return "littlefs";
    }
  }

  // SPIFFS does not put a global magic at offset 0; treat unknown as SPIFFS-first
  // when page headers look plausible later.
  return null;
}

function listSpiffsPath(
  image: Uint8Array,
  volumeLabel: string,
  relativePath: string,
): readonly FilesystemEntry[] {
  const files = collectSpiffsFiles(image);
  if (relativePath !== "/" && files.length === 0) {
    throw new FilesystemError(
      "not-found",
      `Path "${relativePath}" was not found in volume "${volumeLabel}".`,
    );
  }
  return projectFlatEntries(files, volumeLabel, relativePath);
}

function collectSpiffsFiles(image: Uint8Array): readonly FileEntry[] {
  const pageSizes = [256, 128, 512, 1024] as const;
  const found = new Map<string, FileEntry>();

  for (const pageSize of pageSizes) {
    if (image.byteLength < pageSize * 2) {
      continue;
    }

    for (let page = 0; page * pageSize + 64 <= image.byteLength; page += 1) {
      const base = page * pageSize;
      const objId = (image[base] ?? 0) | ((image[base + 1] ?? 0) << 8);
      const span = (image[base + 2] ?? 0) | ((image[base + 3] ?? 0) << 8);
      const flags = image[base + 4] ?? 0;

      // Index header pages typically have span 0 and used flag bits.
      if (span !== 0 || objId === 0xffff || objId === 0) {
        continue;
      }
      if ((flags & 0x01) === 0) {
        // deleted / unused heuristics vary; keep permissive
      }

      const nameStart = base + 9;
      const nameEnd = Math.min(base + pageSize, nameStart + 32);
      const name = decodeCString(image.subarray(nameStart, nameEnd)).trim();
      if (!isPlausibleFilename(name)) {
        continue;
      }

      const normalizedName = name.startsWith("/") ? name.slice(1) : name;
      if (normalizedName.length === 0) {
        continue;
      }

      const sizeOffset = base + 5;
      const size =
        (image[sizeOffset] ?? 0) |
        ((image[sizeOffset + 1] ?? 0) << 8) |
        ((image[sizeOffset + 2] ?? 0) << 16) |
        ((image[sizeOffset + 3] ?? 0) << 24);

      const path = `/${normalizedName}`;
      if (!found.has(path)) {
        found.set(path, {
          kind: "file",
          name: normalizedName.includes("/")
            ? (normalizedName.split("/").at(-1) ?? normalizedName)
            : normalizedName,
          path,
          size: size > 0 && size < image.byteLength ? size : 0,
        });
      }
    }

    if (found.size > 0) {
      break;
    }
  }

  return [...found.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function listLittleFsPath(
  image: Uint8Array,
  volumeLabel: string,
  relativePath: string,
): readonly FilesystemEntry[] {
  const files = collectLittleFsNames(image);
  if (files.length === 0) {
    if (relativePath === "/") {
      return [];
    }
    throw new FilesystemError(
      "not-found",
      `Path "${relativePath}" was not found in volume "${volumeLabel}".`,
    );
  }

  return projectFlatEntries(files, volumeLabel, relativePath);
}

function collectLittleFsNames(image: Uint8Array): readonly FileEntry[] {
  const found = new Map<string, FileEntry>();
  // Best-effort scan for printable path-like C strings near LittleFS name tags.
  // Full CTZ directory walking is deferred; this establishes browse UX for common images.
  for (let i = 0; i + 4 < image.byteLength; i += 1) {
    const b0 = image[i] ?? 0;
    // LFS_TYPE_NAME = 0x1 in type nibble of some tag encodings; keep a loose scan.
    if (b0 !== 0x01 && b0 !== 0x21 && b0 !== 0x41) {
      continue;
    }
    const slice = image.subarray(i + 4, Math.min(i + 4 + 40, image.byteLength));
    const name = decodeCString(slice).trim();
    if (!isPlausibleFilename(name)) {
      continue;
    }
    const normalizedName = name.startsWith("/") ? name.slice(1) : name;
    if (normalizedName.length === 0 || normalizedName.includes("\0")) {
      continue;
    }
    const path = `/${normalizedName}`;
    if (!found.has(path)) {
      found.set(path, {
        kind: "file",
        name: normalizedName.includes("/")
          ? (normalizedName.split("/").at(-1) ?? normalizedName)
          : normalizedName,
        path,
        size: 0,
      });
    }
  }
  return [...found.values()].sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Projects flat volume-relative file paths into immediate children of `relativePath`.
 */
function projectFlatEntries(
  files: readonly FileEntry[],
  volumeLabel: string,
  relativePath: string,
): readonly FilesystemEntry[] {
  const prefix = relativePath === "/" ? "/" : `${relativePath.replace(/\/$/u, "")}/`;
  const dirs = new Map<string, DirectoryEntry>();
  const out: FilesystemEntry[] = [];

  for (const file of files) {
    const volumePath = joinVolumePath(volumeLabel, file.path);
    if (relativePath === "/") {
      const rest = file.path.replace(/^\//u, "");
      const slash = rest.indexOf("/");
      if (slash === -1) {
        out.push({
          ...file,
          path: volumePath,
        });
      } else {
        const dirName = rest.slice(0, slash);
        const dirPath = `/${volumeLabel}/${dirName}`;
        if (!dirs.has(dirName)) {
          dirs.set(dirName, {
            kind: "directory",
            name: dirName,
            path: dirPath,
          });
        }
      }
      continue;
    }

    const relativeFile = file.path;
    if (!relativeFile.startsWith(prefix) && relativeFile !== relativePath) {
      continue;
    }

    if (relativeFile === relativePath) {
      continue;
    }

    const rest = relativeFile.slice(prefix.length);
    const slash = rest.indexOf("/");
    if (slash === -1) {
      out.push({
        ...file,
        name: rest,
        path: joinVolumePath(volumeLabel, relativeFile),
      });
    } else {
      const dirName = rest.slice(0, slash);
      if (!dirs.has(dirName)) {
        dirs.set(dirName, {
          kind: "directory",
          name: dirName,
          path: joinVolumePath(volumeLabel, `${prefix}${dirName}`),
        });
      }
    }
  }

  return [...dirs.values(), ...out].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "directory" ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });
}

function joinVolumePath(volumeLabel: string, relativePath: string): string {
  const trimmed = relativePath.startsWith("/")
    ? relativePath.slice(1)
    : relativePath;
  return trimmed.length === 0
    ? `/${volumeLabel}`
    : `/${volumeLabel}/${trimmed}`;
}

function normalizePath(path: string): string | null {
  if (path.length === 0) {
    return null;
  }
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  const parts = withSlash.split("/").filter((part) => part.length > 0 && part !== ".");
  for (const part of parts) {
    if (part === "..") {
      return null;
    }
  }
  return parts.length === 0 ? "/" : `/${parts.join("/")}`;
}

function decodeCString(bytes: Uint8Array): string {
  let end = bytes.byteLength;
  for (let i = 0; i < bytes.byteLength; i += 1) {
    if (bytes[i] === 0) {
      end = i;
      break;
    }
  }
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(
      bytes.subarray(0, end),
    );
  } catch {
    return "";
  }
}

function isPlausibleFilename(name: string): boolean {
  if (name.length === 0 || name.length > 64) {
    return false;
  }
  if (name === "littlefs") {
    return false;
  }
  return /^[\w./+\-@]+$/u.test(name);
}
