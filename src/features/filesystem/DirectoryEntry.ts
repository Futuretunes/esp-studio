/**
 * Directory entry re-export for the requested public module path.
 *
 * Canonical definitions live in {@link ./FileEntry}.
 */

export type {
  DirectoryEntry,
  FileEntry,
  FilesystemEntry,
  FilesystemEntryBase,
  FilesystemEntryKind,
  FilesystemPath,
} from "./FileEntry";
export { isDirectoryEntry, isFileEntry } from "./FileEntry";
