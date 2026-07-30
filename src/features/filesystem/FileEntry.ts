/**
 * Abstract filesystem entry models (SPIFFS / LittleFS agnostic).
 */

/**
 * POSIX-style absolute path (`/` or `/volume/…`).
 */
export type FilesystemPath = string;

/**
 * Discriminator for filesystem entries.
 */
export type FilesystemEntryKind = "file" | "directory";

/**
 * Shared fields for file and directory entries.
 */
export type FilesystemEntryBase = {
  /** Entry name within its parent (no `/`). */
  readonly name: string;
  /** Absolute path from filesystem root. */
  readonly path: FilesystemPath;
  /** Optional last-modified timestamp (ms since epoch) when known. */
  readonly modifiedAt?: number;
};

/**
 * A file node.
 */
export type FileEntry = FilesystemEntryBase & {
  readonly kind: "file";
  /** Byte size when known. */
  readonly size: number;
};

/**
 * A directory node.
 *
 * {@link DirectoryEntry.children} is omitted until the directory is listed
 * (lazy loading).
 */
export type DirectoryEntry = FilesystemEntryBase & {
  readonly kind: "directory";
  /** Optional byte size of the volume / directory when known. */
  readonly size?: number;
  /** Lazy-loaded children after {@link import("./FilesystemService").FilesystemService.listDirectory}. */
  readonly children?: readonly FilesystemEntry[];
};

/**
 * Union of browseable filesystem entries.
 */
export type FilesystemEntry = FileEntry | DirectoryEntry;

/**
 * Returns whether `entry` is a {@link DirectoryEntry}.
 *
 * @param entry - Candidate entry
 */
export function isDirectoryEntry(entry: FilesystemEntry): entry is DirectoryEntry {
  return entry.kind === "directory";
}

/**
 * Returns whether `entry` is a {@link FileEntry}.
 *
 * @param entry - Candidate entry
 */
export function isFileEntry(entry: FilesystemEntry): entry is FileEntry {
  return entry.kind === "file";
}
