import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

import { useDeviceManager } from "@/app/device-context";
import type { FilesystemVolumeStats } from "@/adapters/filesystem";
import type { FilesystemEntry } from "@/features/filesystem/FileEntry";
import {
  FilesystemError,
  isFilesystemError,
} from "@/features/filesystem/FilesystemError";
import { FilesystemService } from "@/features/filesystem/FilesystemService";
import type { FilesystemTransferProgress } from "@/features/filesystem/FilesystemTransferProgress";
import { isWebSerialSupported } from "@/providers/web-serial";
import { useDeviceStore } from "@/store";

const TEXT_PREVIEW_MAX_BYTES = 64 * 1024;

/**
 * In-browser text preview for a small downloaded file.
 */
export type FilesystemTextPreview = {
  readonly path: string;
  readonly name: string;
  readonly text: string;
};

/**
 * Filesystem browser + transfer workflow over {@link FilesystemService}.
 */
export function useFilesystemBrowser() {
  const manager = useDeviceManager();
  const activeDevice = useDeviceStore((state) => state.activeDevice);
  const webSerialSupported = useDeviceStore((state) => state.webSerialSupported);
  const operationOwner = useDeviceStore((state) => state.operationOwner);
  const setWebSerialSupported = useDeviceStore(
    (state) => state.setWebSerialSupported,
  );

  const service = useMemo(() => new FilesystemService(manager), [manager]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  /** Single-flight guard: concurrent Refresh / auto-load must not stack reads. */
  const refreshInFlightRef = useRef(false);

  const [rootEntries, setRootEntries] = useState<readonly FilesystemEntry[]>(
    [],
  );
  const [childrenByPath, setChildrenByPath] = useState<
    Readonly<Record<string, readonly FilesystemEntry[]>>
  >({});
  const [expandedPaths, setExpandedPaths] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [loadingPaths, setLoadingPaths] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<
    "file" | "directory" | null
  >(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferProgress, setTransferProgress] =
    useState<FilesystemTransferProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<
    FilesystemError["code"] | "generic" | null
  >(null);
  const [pendingUpload, setPendingUpload] = useState<{
    readonly path: string;
    readonly data: Uint8Array;
    readonly name: string;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    readonly path: string;
    readonly kind: "file" | "directory";
  } | null>(null);
  const [volumeStats, setVolumeStats] = useState<FilesystemVolumeStats | null>(
    null,
  );
  const [textPreview, setTextPreview] = useState<FilesystemTextPreview | null>(
    null,
  );
  const [isDragOver, setIsDragOver] = useState(false);

  const ensureSupport = useCallback(() => {
    const supported = isWebSerialSupported();
    setWebSerialSupported(supported);
    return supported;
  }, [setWebSerialSupported]);

  const markLoading = useCallback((path: string, loading: boolean) => {
    setLoadingPaths((previous) => {
      const next = new Set(previous);
      if (loading) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return next;
    });
  }, []);

  const applyError = useCallback((error: unknown, fallback: string) => {
    if (isFilesystemError(error)) {
      setErrorCode(error.code);
      setErrorMessage(
        error.code === "unsupported" &&
          /littlefs/iu.test(error.message)
          ? error.message
          : error.message,
      );
      return;
    }
    setErrorCode("generic");
    setErrorMessage(error instanceof Error ? error.message : fallback);
  }, []);

  const refreshDirectory = useCallback(
    async (path: string) => {
      if (!activeDevice) {
        return;
      }
      const entries = await service.listDirectory(activeDevice.id, path);
      if (path === "/") {
        setRootEntries(entries);
      } else {
        setChildrenByPath((previous) => ({
          ...previous,
          [path]: entries,
        }));
      }
    },
    [activeDevice, service],
  );

  const refreshRoot = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return;
    }

    if (!ensureSupport()) {
      setErrorCode("unsupported");
      setErrorMessage(
        "Web Serial is not available in this browser. Use Chrome, Edge, or Opera over HTTPS or localhost.",
      );
      return;
    }

    if (!activeDevice) {
      setRootEntries([]);
      setChildrenByPath({});
      setExpandedPaths(new Set());
      setSelectedPath(null);
      setSelectedKind(null);
      setVolumeStats(null);
      setTextPreview(null);
      setErrorCode(null);
      setErrorMessage(null);
      return;
    }

    refreshInFlightRef.current = true;
    setIsRefreshing(true);
    setErrorCode(null);
    setErrorMessage(null);
    markLoading("/", true);

    try {
      const entries = await service.listRoot(activeDevice.id);
      setRootEntries(entries);
      setChildrenByPath({});
      setExpandedPaths(new Set());
    } catch (error) {
      setRootEntries([]);
      setChildrenByPath({});
      setExpandedPaths(new Set());
      applyError(error, "Could not list the device filesystem.");
    } finally {
      markLoading("/", false);
      setIsRefreshing(false);
      refreshInFlightRef.current = false;
    }
  }, [activeDevice, applyError, ensureSupport, markLoading, service]);

  useEffect(() => {
    ensureSupport();
  }, [ensureSupport]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void refreshRoot();
    }, 0);
    return () => {
      window.clearTimeout(handle);
    };
  }, [refreshRoot]);

  const loadVolumeStats = useCallback(
    async (path: string) => {
      if (!activeDevice || !isVolumeRootPath(path)) {
        setVolumeStats(null);
        return;
      }
      try {
        const stats = await service.getVolumeStats(activeDevice.id, path);
        setVolumeStats(stats);
      } catch (error) {
        setVolumeStats(null);
        applyError(error, "Could not read volume statistics.");
      }
    },
    [activeDevice, applyError, service],
  );

  const selectEntry = useCallback(
    (entry: FilesystemEntry) => {
      if (refreshInFlightRef.current) {
        return;
      }
      setSelectedPath(entry.path);
      setSelectedKind(entry.kind);
      setPendingUpload(null);
      setPendingDelete(null);
      setTextPreview(null);
      setErrorCode(null);
      setErrorMessage(null);
      if (entry.kind === "directory" && isVolumeRootPath(entry.path)) {
        void loadVolumeStats(entry.path);
      } else {
        setVolumeStats(null);
      }
    },
    [loadVolumeStats],
  );

  const toggleDirectory = useCallback(
    async (path: string) => {
      if (refreshInFlightRef.current) {
        return;
      }

      if (!activeDevice) {
        setErrorCode("no-device");
        setErrorMessage(
          "Connect a device on the Devices page before browsing the filesystem.",
        );
        return;
      }

      if (expandedPaths.has(path)) {
        setExpandedPaths((previous) => {
          const next = new Set(previous);
          next.delete(path);
          return next;
        });
        return;
      }

      setErrorCode(null);
      setErrorMessage(null);

      if (childrenByPath[path] === undefined) {
        markLoading(path, true);
        try {
          const entries = await service.listDirectory(activeDevice.id, path);
          setChildrenByPath((previous) => ({
            ...previous,
            [path]: entries,
          }));
        } catch (error) {
          applyError(error, "Could not open that directory.");
          return;
        } finally {
          markLoading(path, false);
        }
      }

      setExpandedPaths((previous) => {
        const next = new Set(previous);
        next.add(path);
        return next;
      });
    },
    [
      activeDevice,
      applyError,
      childrenByPath,
      expandedPaths,
      markLoading,
      service,
    ],
  );

  const runUpload = useCallback(
    async (path: string, data: Uint8Array, overwrite: boolean) => {
      if (!activeDevice) {
        setErrorCode("no-device");
        setErrorMessage("Connect a device before uploading.");
        return;
      }

      if (refreshInFlightRef.current) {
        setErrorCode("busy");
        setErrorMessage(
          "Filesystem is still reading. Wait for the listing to finish before uploading.",
        );
        return;
      }

      setIsTransferring(true);
      setTransferProgress(null);
      setErrorCode(null);
      setErrorMessage(null);

      try {
        await service.uploadFile(activeDevice.id, path, data, {
          overwrite,
          onProgress: setTransferProgress,
        });
        setPendingUpload(null);
        const parent = parentDirectory(path);
        await refreshDirectory(parent);
        if (parent !== "/") {
          setExpandedPaths((previous) => new Set(previous).add(parent));
        }
        setSelectedPath(path);
        setSelectedKind("file");
        if (isVolumeRootPath(parent) || parent === "/") {
          const volume =
            parent === "/" ? volumeRootFromPath(path) : parent;
          if (volume) {
            void loadVolumeStats(volume);
          }
        }
      } catch (error) {
        if (isFilesystemError(error) && error.code === "exists" && !overwrite) {
          setPendingUpload({
            path,
            data,
            name: path.split("/").at(-1) ?? "file",
          });
          setErrorCode("exists");
          setErrorMessage(error.message);
        } else {
          applyError(error, "Upload failed.");
        }
      } finally {
        setIsTransferring(false);
      }
    },
    [activeDevice, applyError, loadVolumeStats, refreshDirectory, service],
  );

  const requestUpload = useCallback(() => {
    if (refreshInFlightRef.current || isRefreshing) {
      return;
    }
    if (!selectedPath || selectedKind !== "directory") {
      setErrorCode("invalid-path");
      setErrorMessage(
        "Select a volume or folder, then click Upload to choose a file.",
      );
      return;
    }
    fileInputRef.current?.click();
  }, [isRefreshing, selectedKind, selectedPath]);

  const handleUploadFileChosen = useCallback(
    async (file: File | null) => {
      if (!file || !selectedPath || selectedKind !== "directory") {
        return;
      }
      if (file.name.toLowerCase().endsWith(".zip")) {
        setErrorCode("unsupported");
        setErrorMessage(
          "ZIP upload is not supported yet. Unpack the archive and upload individual files.",
        );
        return;
      }
      const buffer = new Uint8Array(await file.arrayBuffer());
      const targetPath = joinPath(selectedPath, file.name);
      await runUpload(targetPath, buffer, false);
    },
    [runUpload, selectedKind, selectedPath],
  );

  const handleDropFiles = useCallback(
    async (files: FileList | readonly File[]) => {
      if (!selectedPath || selectedKind !== "directory") {
        setErrorCode("invalid-path");
        setErrorMessage(
          "Select a volume or folder before dropping files to upload.",
        );
        return;
      }
      const list = Array.from(files);
      for (const file of list) {
        if (file.name.toLowerCase().endsWith(".zip")) {
          setErrorCode("unsupported");
          setErrorMessage(
            "ZIP upload is not supported yet. Unpack the archive and upload individual files.",
          );
          continue;
        }
        const buffer = new Uint8Array(await file.arrayBuffer());
        const targetPath = joinPath(selectedPath, file.name);
        await runUpload(targetPath, buffer, false);
      }
    },
    [runUpload, selectedKind, selectedPath],
  );

  const confirmOverwrite = useCallback(async () => {
    if (!pendingUpload) {
      return;
    }
    await runUpload(pendingUpload.path, pendingUpload.data, true);
  }, [pendingUpload, runUpload]);

  const cancelOverwrite = useCallback(() => {
    setPendingUpload(null);
    setErrorCode(null);
    setErrorMessage(null);
  }, []);

  const requestDelete = useCallback(() => {
    if (!selectedPath || selectedKind === null) {
      setErrorCode("invalid-path");
      setErrorMessage("Select a file or folder to delete.");
      return;
    }
    if (isVolumeRootPath(selectedPath)) {
      setErrorCode("invalid-path");
      setErrorMessage("Volume roots cannot be deleted from the browser.");
      return;
    }
    setPendingDelete({ path: selectedPath, kind: selectedKind });
    setErrorCode(null);
    setErrorMessage(null);
  }, [selectedKind, selectedPath]);

  const cancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || !activeDevice) {
      return;
    }
    setIsTransferring(true);
    setTransferProgress(null);
    setErrorCode(null);
    setErrorMessage(null);
    try {
      await service.deletePath(activeDevice.id, pendingDelete.path, {
        onProgress: setTransferProgress,
      });
      const parent = parentDirectory(pendingDelete.path);
      setPendingDelete(null);
      setSelectedPath(parent === "/" ? null : parent);
      setSelectedKind(parent === "/" ? null : "directory");
      setTextPreview(null);
      await refreshDirectory(parent);
      const volume = volumeRootFromPath(pendingDelete.path);
      if (volume) {
        void loadVolumeStats(volume);
      }
    } catch (error) {
      applyError(error, "Delete failed.");
    } finally {
      setIsTransferring(false);
    }
  }, [
    activeDevice,
    applyError,
    loadVolumeStats,
    pendingDelete,
    refreshDirectory,
    service,
  ]);

  const renameSelected = useCallback(async () => {
    if (!activeDevice) {
      setErrorCode("no-device");
      setErrorMessage("Connect a device before renaming.");
      return;
    }
    if (!selectedPath || selectedKind !== "file") {
      setErrorCode("invalid-path");
      setErrorMessage("Select a file to rename.");
      return;
    }
    const currentName = selectedPath.split("/").at(-1) ?? "";
    const nextName = window.prompt("Rename file to:", currentName);
    if (nextName === null) {
      return;
    }
    const trimmed = nextName.trim();
    if (trimmed.length === 0 || trimmed.includes("/")) {
      setErrorCode("invalid-path");
      setErrorMessage("Enter a file name without path separators.");
      return;
    }
    if (trimmed === currentName) {
      return;
    }
    const toPath = joinPath(parentDirectory(selectedPath), trimmed);
    setIsTransferring(true);
    setTransferProgress(null);
    setErrorCode(null);
    setErrorMessage(null);
    try {
      await service.renamePath(activeDevice.id, selectedPath, toPath, {
        onProgress: setTransferProgress,
      });
      const parent = parentDirectory(selectedPath);
      await refreshDirectory(parent);
      setSelectedPath(toPath);
      setSelectedKind("file");
      setTextPreview(null);
    } catch (error) {
      applyError(error, "Rename failed.");
    } finally {
      setIsTransferring(false);
    }
  }, [
    activeDevice,
    applyError,
    refreshDirectory,
    selectedKind,
    selectedPath,
    service,
  ]);

  const createFolder = useCallback(async () => {
    if (!activeDevice) {
      setErrorCode("no-device");
      setErrorMessage("Connect a device before creating a folder.");
      return;
    }
    if (!selectedPath || selectedKind !== "directory") {
      setErrorCode("invalid-path");
      setErrorMessage("Select a volume or folder to create a subfolder in.");
      return;
    }
    const name = window.prompt("New folder name:");
    if (name === null) {
      return;
    }
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.includes("/")) {
      setErrorCode("invalid-path");
      setErrorMessage("Enter a folder name without path separators.");
      return;
    }
    const folderPath = joinPath(selectedPath, trimmed);
    setIsTransferring(true);
    setTransferProgress(null);
    setErrorCode(null);
    setErrorMessage(null);
    try {
      await service.createDirectory(activeDevice.id, folderPath, {
        onProgress: setTransferProgress,
      });
      await refreshDirectory(selectedPath);
      setExpandedPaths((previous) => new Set(previous).add(selectedPath));
      setSelectedPath(folderPath);
      setSelectedKind("directory");
    } catch (error) {
      applyError(error, "Create folder failed.");
    } finally {
      setIsTransferring(false);
    }
  }, [
    activeDevice,
    applyError,
    refreshDirectory,
    selectedKind,
    selectedPath,
    service,
  ]);

  const downloadSelected = useCallback(async () => {
    if (!activeDevice) {
      setErrorCode("no-device");
      setErrorMessage("Connect a device before downloading.");
      return;
    }
    if (refreshInFlightRef.current || isRefreshing) {
      return;
    }
    if (!selectedPath || selectedKind !== "file") {
      setErrorCode("invalid-path");
      setErrorMessage("Select a file to download.");
      return;
    }

    setIsTransferring(true);
    setTransferProgress(null);
    setErrorCode(null);
    setErrorMessage(null);

    try {
      const bytes = await service.downloadFile(activeDevice.id, selectedPath, {
        onProgress: setTransferProgress,
      });
      const name = selectedPath.split("/").at(-1) ?? "download.bin";
      triggerBrowserDownload(name, bytes);
      if (
        bytes.byteLength > 0 &&
        bytes.byteLength <= TEXT_PREVIEW_MAX_BYTES &&
        looksLikeText(bytes)
      ) {
        setTextPreview({
          path: selectedPath,
          name,
          text: new TextDecoder("utf-8", { fatal: false }).decode(bytes),
        });
      } else {
        setTextPreview(null);
      }
    } catch (error) {
      applyError(error, "Download failed.");
    } finally {
      setIsTransferring(false);
    }
  }, [
    activeDevice,
    applyError,
    isRefreshing,
    selectedKind,
    selectedPath,
    service,
  ]);

  const onDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      const files = event.dataTransfer.files;
      if (files.length === 0) {
        return;
      }
      void handleDropFiles(files);
    },
    [handleDropFiles],
  );

  return {
    activeDevice,
    webSerialSupported,
    operationOwner,
    rootEntries,
    childrenByPath,
    expandedPaths,
    loadingPaths,
    selectedPath,
    selectedKind,
    isRefreshing,
    isTransferring,
    transferProgress,
    errorCode,
    errorMessage,
    pendingUpload,
    pendingDelete,
    volumeStats,
    textPreview,
    isDragOver,
    fileInputRef,
    refreshRoot,
    toggleDirectory,
    selectEntry,
    requestUpload,
    handleUploadFileChosen,
    confirmOverwrite,
    cancelOverwrite,
    requestDelete,
    confirmDelete,
    cancelDelete,
    renameSelected,
    createFolder,
    downloadSelected,
    clearTextPreview: () => {
      setTextPreview(null);
    },
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };
}

function isVolumeRootPath(path: string): boolean {
  const parts = path.split("/").filter(Boolean);
  return parts.length === 1;
}

function volumeRootFromPath(path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) {
    return null;
  }
  return `/${parts[0]}`;
}

function parentDirectory(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) {
    return "/";
  }
  return `/${parts.slice(0, -1).join("/")}`;
}

function joinPath(directory: string, fileName: string): string {
  if (directory === "/") {
    return `/${fileName}`;
  }
  return `${directory.replace(/\/$/u, "")}/${fileName}`;
}

function triggerBrowserDownload(fileName: string, data: Uint8Array): void {
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function looksLikeText(bytes: Uint8Array): boolean {
  let printable = 0;
  const sample = Math.min(bytes.byteLength, 512);
  for (let index = 0; index < sample; index += 1) {
    const value = bytes[index] ?? 0;
    if (value === 9 || value === 10 || value === 13) {
      printable += 1;
      continue;
    }
    if (value >= 32 && value <= 126) {
      printable += 1;
      continue;
    }
    if (value >= 128) {
      printable += 1;
    }
  }
  return sample > 0 && printable / sample >= 0.85;
}

export type { FilesystemError };
