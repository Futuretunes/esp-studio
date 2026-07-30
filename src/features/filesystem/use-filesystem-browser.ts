import { useCallback, useEffect, useMemo, useState } from "react";

import { useDeviceManager } from "@/app/device-context";
import type { FilesystemEntry } from "@/features/filesystem/FileEntry";
import {
  FilesystemError,
  isFilesystemError,
} from "@/features/filesystem/FilesystemError";
import { FilesystemService } from "@/features/filesystem/FilesystemService";
import { isWebSerialSupported } from "@/providers/web-serial";
import { useDeviceStore } from "@/store";

/**
 * Filesystem browser workflow over {@link FilesystemService}.
 */
export function useFilesystemBrowser() {
  const manager = useDeviceManager();
  const activeDevice = useDeviceStore((state) => state.activeDevice);
  const webSerialSupported = useDeviceStore((state) => state.webSerialSupported);
  const setWebSerialSupported = useDeviceStore(
    (state) => state.setWebSerialSupported,
  );

  const service = useMemo(() => new FilesystemService(manager), [manager]);

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const refreshRoot = useCallback(async () => {
    if (!ensureSupport()) {
      setErrorMessage(
        "Web Serial is not available in this browser. Use Chrome, Edge, or Opera over HTTPS or localhost.",
      );
      return;
    }

    if (!activeDevice) {
      setRootEntries([]);
      setChildrenByPath({});
      setExpandedPaths(new Set());
      setErrorMessage(null);
      return;
    }

    setIsRefreshing(true);
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
      setErrorMessage(
        isFilesystemError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : "Could not list the device filesystem.",
      );
    } finally {
      markLoading("/", false);
      setIsRefreshing(false);
    }
  }, [activeDevice, ensureSupport, markLoading, service]);

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

  const toggleDirectory = useCallback(
    async (path: string) => {
      if (!activeDevice) {
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
          setErrorMessage(
            isFilesystemError(error)
              ? error.message
              : error instanceof Error
                ? error.message
                : "Could not open that directory.",
          );
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
    [activeDevice, childrenByPath, expandedPaths, markLoading, service],
  );

  return {
    activeDevice,
    webSerialSupported,
    rootEntries,
    childrenByPath,
    expandedPaths,
    loadingPaths,
    isRefreshing,
    errorMessage,
    refreshRoot,
    toggleDirectory,
  };
}

export type { FilesystemError };
