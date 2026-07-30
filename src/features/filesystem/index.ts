/**
 * Filesystem browser feature — list-only SPIFFS / LittleFS browsing.
 *
 * @packageDocumentation
 */

export { FILESYSTEM_BROWSER_OWNER_ID } from "./constants";
export type {
  DirectoryEntry,
  FileEntry,
  FilesystemEntry,
  FilesystemEntryBase,
  FilesystemEntryKind,
  FilesystemPath,
} from "./DirectoryEntry";
export { isDirectoryEntry, isFileEntry } from "./DirectoryEntry";
export {
  FilesystemError,
  isFilesystemError,
  type FilesystemErrorCode,
} from "./FilesystemError";
export { FilesystemService } from "./FilesystemService";
export { FilesystemFeature } from "./filesystem-page";
