import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useDeviceManager } from "@/app/device-context";
import { DEFAULT_APP_FLASH_ADDRESS } from "@/features/flash/constants";
import {
  FlashBusyError,
  FlashDeviceError,
  FlashError,
} from "@/features/flash/errors";
import type { FlashProgress } from "@/features/flash/FlashProgress";
import type { FlashResult } from "@/features/flash/FlashResult";
import { FlashService } from "@/features/flash/FlashService";
import { FirmwareCatalog } from "@/features/firmware/FirmwareCatalog";
import type {
  FirmwareCatalogEntry,
  FirmwareResolvedPackage,
} from "@/features/firmware/FirmwareProvider";
import {
  LOCAL_FILE_PICK_MANIFEST_ID,
  LOCAL_FIRMWARE_PROVIDER_ID,
  LocalFirmwareProvider,
} from "@/features/firmware/LocalFirmwareProvider";
import { isWebSerialSupported } from "@/providers/web-serial";
import { useDeviceStore } from "@/store";

/**
 * Builds a stable select value for a catalog row.
 *
 * @param providerId - Provider id
 * @param manifestId - Manifest id
 */
export function catalogSelectionKey(
  providerId: string,
  manifestId: string,
): string {
  return `${providerId}::${manifestId}`;
}

/**
 * Parses {@link catalogSelectionKey} output.
 *
 * @param key - Encoded selection key
 */
export function parseCatalogSelectionKey(
  key: string,
): { providerId: string; manifestId: string } | null {
  const separator = key.indexOf("::");
  if (separator <= 0 || separator === key.length - 2) {
    return null;
  }
  return {
    providerId: key.slice(0, separator),
    manifestId: key.slice(separator + 2),
  };
}

export type FlashUiErrorKind =
  | "unsupported"
  | "no-device"
  | "no-file"
  | "invalid-file"
  | "busy"
  | "failed"
  | null;

/**
 * Flash UI workflow: catalog selection + {@link FlashService.flash}.
 */
export function useFlashWorkflow() {
  const manager = useDeviceManager();
  const activeDevice = useDeviceStore((state) => state.activeDevice);
  const webSerialSupported = useDeviceStore((state) => state.webSerialSupported);
  const setWebSerialSupported = useDeviceStore(
    (state) => state.setWebSerialSupported,
  );

  const service = useMemo(() => new FlashService(manager), [manager]);
  const localProvider = useMemo(() => new LocalFirmwareProvider(), []);
  const catalog = useMemo(
    () => new FirmwareCatalog([localProvider]),
    [localProvider],
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [entries, setEntries] = useState<readonly FirmwareCatalogEntry[]>([]);
  const [selectionKey, setSelectionKey] = useState("");
  const [resolved, setResolved] = useState<FirmwareResolvedPackage | null>(
    null,
  );
  const [isFlashing, setIsFlashing] = useState(false);
  const [progress, setProgress] = useState<FlashProgress | null>(null);
  const [result, setResult] = useState<FlashResult | null>(null);
  const [errorKind, setErrorKind] = useState<FlashUiErrorKind>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshCatalog = useCallback(async () => {
    const next = await catalog.listAll();
    setEntries(next);
  }, [catalog]);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  const clearFeedback = useCallback(() => {
    setErrorKind(null);
    setErrorMessage(null);
    setResult(null);
    setProgress(null);
  }, []);

  const ensureSupport = useCallback(() => {
    const supported = isWebSerialSupported();
    setWebSerialSupported(supported);
    if (!supported) {
      setErrorKind("unsupported");
      setErrorMessage(
        "Web Serial is not available in this browser. Use Chrome, Edge, or Opera over HTTPS or localhost.",
      );
      return false;
    }
    return true;
  }, [setWebSerialSupported]);

  const clearFirmware = useCallback(() => {
    localProvider.clear();
    setResolved(null);
    setSelectionKey("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    void refreshCatalog();
  }, [localProvider, refreshCatalog]);

  const selectCatalogEntry = useCallback(
    (key: string) => {
      clearFeedback();

      if (key.length === 0) {
        setSelectionKey("");
        setResolved(null);
        return;
      }

      const parsed = parseCatalogSelectionKey(key);
      if (!parsed) {
        setErrorKind("failed");
        setErrorMessage("Invalid firmware catalog selection.");
        return;
      }

      const entry = entries.find(
        (item) =>
          item.manifest.providerId === parsed.providerId &&
          item.manifest.id === parsed.manifestId,
      );

      if (!entry) {
        setErrorKind("failed");
        setErrorMessage("That firmware is no longer in the catalog.");
        return;
      }

      if (entry.action === "pick-local-file") {
        setSelectionKey(key);
        fileInputRef.current?.click();
        return;
      }

      void catalog
        .resolve(parsed.providerId, parsed.manifestId)
        .then((packageResolved) => {
          setSelectionKey(key);
          setResolved(packageResolved);
        })
        .catch((error: unknown) => {
          setResolved(null);
          setErrorKind("failed");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not resolve the selected firmware.",
          );
        });
    },
    [catalog, clearFeedback, entries],
  );

  const selectFirmwareFile = useCallback(
    async (file: File | null) => {
      clearFeedback();

      if (!file) {
        // User cancelled the picker — restore selection to imported package if any.
        const current = localProvider.getCurrent();
        if (current) {
          setSelectionKey(
            catalogSelectionKey(
              current.manifest.providerId,
              current.manifest.id,
            ),
          );
          setResolved(current);
        } else {
          setSelectionKey("");
          setResolved(null);
        }
        return;
      }

      try {
        const imported = await localProvider.importBinFile(
          file,
          DEFAULT_APP_FLASH_ADDRESS,
        );
        await refreshCatalog();
        const key = catalogSelectionKey(
          imported.manifest.providerId,
          imported.manifest.id,
        );
        setSelectionKey(key);
        setResolved(imported);
      } catch (error) {
        clearFirmware();
        setSelectionKey(
          catalogSelectionKey(
            LOCAL_FIRMWARE_PROVIDER_ID,
            LOCAL_FILE_PICK_MANIFEST_ID,
          ),
        );
        setErrorKind(
          error instanceof Error &&
            error.message.toLowerCase().includes(".bin")
            ? "invalid-file"
            : "failed",
        );
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not import the selected firmware file.",
        );
      }
    },
    [clearFeedback, clearFirmware, localProvider, refreshCatalog],
  );

  const startFlash = useCallback(async () => {
    clearFeedback();

    if (!ensureSupport()) {
      return;
    }

    if (!activeDevice) {
      setErrorKind("no-device");
      setErrorMessage(
        "No device is connected. Open Devices, connect your board, then return here to flash.",
      );
      return;
    }

    if (!resolved || resolved.images.length === 0) {
      setErrorKind("no-file");
      setErrorMessage(
        "Select firmware from the catalog (Local file…) before flashing.",
      );
      return;
    }

    setIsFlashing(true);
    setProgress({
      stage: "preparing",
      message: "Preparing flash operation…",
      percent: 0,
    });

    try {
      const flashResult = await service.flash({
        deviceId: activeDevice.id,
        images: resolved.images.map((image) => ({
          data: image.data,
          address: image.address,
        })),
        verifyAfterWrite: true,
        resetAfter: true,
        onProgress: (next) => {
          setProgress(next);
        },
      });

      setResult(flashResult);

      if (!flashResult.success) {
        const err = flashResult.error;
        if (err instanceof FlashBusyError) {
          setErrorKind("busy");
        } else if (err instanceof FlashDeviceError) {
          setErrorKind("no-device");
        } else {
          setErrorKind("failed");
        }
        setErrorMessage(
          flashResult.message ??
            err?.message ??
            "Flashing failed. Check the connection and try again.",
        );
      }
    } catch (error) {
      if (error instanceof FlashBusyError) {
        setErrorKind("busy");
        setErrorMessage(error.message);
      } else if (error instanceof FlashDeviceError) {
        setErrorKind("no-device");
        setErrorMessage(error.message);
      } else if (error instanceof FlashError) {
        setErrorKind("failed");
        setErrorMessage(error.message);
      } else {
        setErrorKind("failed");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Flashing failed unexpectedly.",
        );
      }
      setProgress((previous) =>
        previous
          ? {
              ...previous,
              stage: "failed",
              message:
                error instanceof Error ? error.message : "Flashing failed.",
            }
          : {
              stage: "failed",
              message:
                error instanceof Error ? error.message : "Flashing failed.",
              percent: 100,
            },
      );
    } finally {
      setIsFlashing(false);
    }
  }, [
    activeDevice,
    clearFeedback,
    ensureSupport,
    resolved,
    service,
  ]);

  const primaryImage = resolved?.images[0] ?? null;

  return {
    activeDevice,
    webSerialSupported,
    catalogEntries: entries,
    selectionKey,
    resolved,
    primaryImage,
    isFlashing,
    progress,
    result,
    errorKind,
    errorMessage,
    fileInputRef,
    flashAddress: primaryImage?.address ?? DEFAULT_APP_FLASH_ADDRESS,
    ensureSupport,
    selectCatalogEntry,
    selectFirmwareFile,
    clearFirmware,
    startFlash,
  };
}
