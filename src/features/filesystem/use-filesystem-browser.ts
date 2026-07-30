import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useDeviceManager } from "@/app/device-context";
import type { FilesystemEntry } from "@/features/filesystem/FileEntry";
import {
  FilesystemError,
  isFilesystemError,
} from "@/features/filesystem/FilesystemError";
import { FilesystemService } from "@/features/filesystem/FilesystemService";
import type { FilesystemTransferProgress } from "@/features/filesystem/FilesystemTransferProgress";
import { isWebSerialSupported } from "@/providers/web-serial";
import { useDeviceStore } from "@/store";

/**
 * Filesystem browser + transfer workflow over {@link FilesystemService}.
 */
export function useFilesystemBrowser() {
  const manager = useDeviceManager();
  const activeDevice = useDeviceStore((state) => state.activeDevice);
  const webSerialSupported = useDeviceStore((state) => state.webSerialSupported);
  const setWebSerialSupported = useDeviceStore(
    (state) => state.setWebSerialSupported,
  );

  const service = useMemo(() => new FilesystemService(manager), [manager]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setErrorMessage(error.message);
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
      setErrorCode(null);
      setErrorMessage(null);
      return;
    }

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

  const selectEntry = useCallback(
    (entry: FilesystemEntry) => {
      setSelectedPath(entry.path);
      setSelectedKind(entry.kind);
      setPendingUpload(null);
      setErrorCode(null);
      setErrorMessage(null);
    },
    [],
  );

  const toggleDirectory = useCallback(
    async (path: string) => {
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
    [activeDevice, applyError, refreshDirectory, service],
  );

  const requestUpload = useCallback(() => {
    if (!selectedPath || selectedKind !== "directory") {
      setErrorCode("invalid-path");
      setErrorMessage(
        "Select a volume or folder, then click Upload to choose a file.",
      );
      return;
    }
    fileInputRef.current?.click();
  }, [selectedKind, selectedPath]);

  const handleUploadFileChosen = useCallback(
    async (file: File | null) => {
      if (!file || !selectedPath || selectedKind !== "directory") {
        return;
      }
      const buffer = new Uint8Array(await file.arrayBuffer());
      const targetPath = joinPath(selectedPath, file.name);
      await runUpload(targetPath, buffer, false);
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

  const downloadSelected = useCallback(async () => {
    if (!activeDevice) {
      setErrorCode("no-device");
      setErrorMessage("Connect a device before downloading.");
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
    } catch (error) {
      applyError(error, "Download failed.");
    } finally {
      setIsTransferring(false);
    }
  }, [activeDevice, applyError, selectedKind, selectedPath, service]);

  return {
    activeDevice,
    webSerialSupported,
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
    fileInputRef,
    refreshRoot,
    toggleDirectory,
    selectEntry,
    requestUpload,
    handleUploadFileChosen,
    confirmOverwrite,
    cancelOverwrite,
    downloadSelected,
  };
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

export type { FilesystemError };
