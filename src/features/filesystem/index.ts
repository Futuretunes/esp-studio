/**
 * Filesystem browser + transfer feature — SPIFFS / LittleFS.
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
export {
  FilesystemService,
  type FilesystemDownloadOptions,
  type FilesystemUploadOptions,
} from "./FilesystemService";
export {
  createFilesystemTransferProgress,
  type FilesystemTransferProgress,
  type FilesystemTransferProgressListener,
  type FilesystemTransferStage,
} from "./FilesystemTransferProgress";
export { FilesystemFeature } from "./filesystem-page";
