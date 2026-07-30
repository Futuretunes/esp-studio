import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useDeviceManager } from "@/app/device-context";
import {
  isFirmwareChipCompatible,
  sortFirmwareEntriesByChipPreference,
} from "@/features/flash/chip-compatibility";
import { DEFAULT_APP_FLASH_ADDRESS } from "@/features/flash/constants";
import {
  FlashBusyError,
  FlashDeviceError,
  FlashError,
} from "@/features/flash/errors";
import type { FlashProgress } from "@/features/flash/FlashProgress";
import type { FlashResult } from "@/features/flash/FlashResult";
import { FlashService } from "@/features/flash/FlashService";
import {
  loadBuiltInCatalog,
  type BuiltInCatalogEntry,
} from "@/features/firmware/catalog";
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
import {
  GITHUB_FIRMWARE_PROVIDER_ID,
  GitHubFirmwareProvider,
  isGitHubFirmwareProviderError,
  readPersistedGitHubRepository,
  type GitHubReleaseSummary,
} from "@/features/firmware/providers/github";
import { formatChipLabel } from "@/features/identification/format-chip-label";
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

/**
 * Firmware source mode on the Flash page.
 */
export type FlashFirmwareSource = "builtin" | "github" | "local";

export type FlashUiErrorKind =
  | "unsupported"
  | "no-device"
  | "no-file"
  | "invalid-file"
  | "busy"
  | "failed"
  | "provider"
  | null;

/**
 * Flash UI workflow: one-click install over catalog + {@link FlashService.flash}.
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
  const githubProvider = useMemo(() => new GitHubFirmwareProvider(), []);
  const catalog = useMemo(
    () => new FirmwareCatalog([localProvider, githubProvider]),
    [githubProvider, localProvider],
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [firmwareSource, setFirmwareSource] =
    useState<FlashFirmwareSource>("builtin");
  const [builtInEntries, setBuiltInEntries] = useState<
    readonly BuiltInCatalogEntry[]
  >([]);
  const [builtInCatalogStatus, setBuiltInCatalogStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [builtInCatalogError, setBuiltInCatalogError] = useState<string | null>(
    null,
  );
  const [builtInCatalogRetryKey, setBuiltInCatalogRetryKey] = useState(0);
  const [selectedBuiltInId, setSelectedBuiltInId] = useState<string | null>(
    null,
  );
  const [repositorySlug, setRepositorySlug] = useState(
    () => readPersistedGitHubRepository() ?? "",
  );
  const [releaseSummary, setReleaseSummary] =
    useState<GitHubReleaseSummary | null>(null);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

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
    try {
      const next = await catalog.listAll();
      setEntries(next);
      return next;
    } catch (error) {
      setErrorKind("provider");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load firmware catalog entries.",
      );
      throw error;
    }
  }, [catalog]);

  useEffect(() => {
    void refreshCatalog().catch(() => {
      /* Error state set in refreshCatalog. */
    });
  }, [refreshCatalog]);

  useEffect(() => {
    let cancelled = false;
    setBuiltInCatalogStatus("loading");
    setBuiltInCatalogError(null);

    void loadBuiltInCatalog()
      .then((entries) => {
        if (cancelled) {
          return;
        }
        setBuiltInEntries(entries);
        setBuiltInCatalogStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setBuiltInEntries([]);
        setBuiltInCatalogStatus("error");
        setBuiltInCatalogError(
          error instanceof Error
            ? error.message
            : "Failed to load the built-in firmware catalog.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [builtInCatalogRetryKey]);

  const retryBuiltInCatalog = useCallback(() => {
    setBuiltInCatalogRetryKey((value) => value + 1);
  }, []);

  const selectedBuiltIn =
    builtInEntries.find((entry) => entry.id === selectedBuiltInId) ?? null;

  const visibleEntries = useMemo(() => {
    if (firmwareSource === "local") {
      return entries.filter(
        (entry) => entry.manifest.providerId === LOCAL_FIRMWARE_PROVIDER_ID,
      );
    }

    const githubEntries = entries.filter(
      (entry) => entry.manifest.providerId === GITHUB_FIRMWARE_PROVIDER_ID,
    );

    return sortFirmwareEntriesByChipPreference(
      githubEntries,
      activeDevice?.chipFamily,
      selectedBuiltIn?.chipFamilies,
    );
  }, [
    activeDevice?.chipFamily,
    entries,
    firmwareSource,
    selectedBuiltIn?.chipFamilies,
  ]);

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
    if (firmwareSource === "local") {
      localProvider.clear();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    setResolved(null);
    setSelectionKey("");
    void refreshCatalog();
  }, [firmwareSource, localProvider, refreshCatalog]);

  const resolveCatalogEntry = useCallback(
    async (entry: FirmwareCatalogEntry) => {
      if (entry.action === "pick-local-file") {
        const key = catalogSelectionKey(
          entry.manifest.providerId,
          entry.manifest.id,
        );
        setSelectionKey(key);
        fileInputRef.current?.click();
        return;
      }

      setIsResolving(true);
      try {
        const packageResolved = await catalog.resolve(
          entry.manifest.providerId,
          entry.manifest.id,
        );
        setSelectionKey(
          catalogSelectionKey(entry.manifest.providerId, entry.manifest.id),
        );
        setResolved(packageResolved);
      } catch (error) {
        setResolved(null);
        setErrorKind(
          isGitHubFirmwareProviderError(error) ? "provider" : "failed",
        );
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not resolve the selected firmware.",
        );
      } finally {
        setIsResolving(false);
      }
    },
    [catalog],
  );

  const changeFirmwareSource = useCallback(
    (source: FlashFirmwareSource) => {
      clearFeedback();
      setFirmwareSource(source);
      setResolved(null);
      setSelectionKey("");

      if (source === "local") {
        setSelectedBuiltInId(null);
        const current = localProvider.getCurrent();
        if (current) {
          setSelectionKey(
            catalogSelectionKey(
              current.manifest.providerId,
              current.manifest.id,
            ),
          );
          setResolved(current);
        }
        return;
      }

      if (source === "github") {
        setSelectedBuiltInId(null);
        setReleaseSummary(githubProvider.getReleaseSummary());
        return;
      }

      setReleaseSummary(githubProvider.getReleaseSummary());
    },
    [clearFeedback, githubProvider, localProvider],
  );

  const configureGitHubRepository = useCallback(
    async (slug: string, builtInId: string | null) => {
      clearFeedback();
      setIsLoadingGithub(true);
      setResolved(null);
      setSelectionKey("");
      setSelectedBuiltInId(builtInId);

      try {
        const summary = await githubProvider.configureRepository(slug);
        setReleaseSummary(summary);
        setRepositorySlug(slug);
        const nextEntries = await refreshCatalog();

        const project = builtInEntries.find((item) => item.id === builtInId);
        const githubEntries = nextEntries.filter(
          (entry) => entry.manifest.providerId === GITHUB_FIRMWARE_PROVIDER_ID,
        );
        const ranked = sortFirmwareEntriesByChipPreference(
          githubEntries,
          activeDevice?.chipFamily,
          project?.chipFamilies,
        );

        if (ranked.length === 0) {
          setErrorKind("no-file");
          setErrorMessage(
            "No firmware options were found in the latest release for this project.",
          );
          return;
        }

        const preferred = ranked[0];
        if (preferred === undefined) {
          setErrorKind("no-file");
          setErrorMessage(
            "No firmware options were found in the latest release for this project.",
          );
          return;
        }

        // Auto-select preferred (or only) option and resolve so Install is ready.
        await resolveCatalogEntry(preferred);
      } catch (error) {
        githubProvider.clear();
        setReleaseSummary(null);
        await refreshCatalog();
        setErrorKind("provider");
        setErrorMessage(
          isGitHubFirmwareProviderError(error)
            ? error.message
            : error instanceof Error
              ? error.message
              : "Could not load firmware from GitHub.",
        );
      } finally {
        setIsLoadingGithub(false);
      }
    },
    [
      activeDevice?.chipFamily,
      builtInEntries,
      clearFeedback,
      githubProvider,
      refreshCatalog,
      resolveCatalogEntry,
    ],
  );

  const loadGitHubRepository = useCallback(async () => {
    await configureGitHubRepository(repositorySlug, null);
  }, [configureGitHubRepository, repositorySlug]);

  const selectBuiltInEntry = useCallback(
    (entryId: string) => {
      const entry = builtInEntries.find((item) => item.id === entryId);
      if (!entry) {
        setErrorKind("failed");
        setErrorMessage("That built-in firmware entry is no longer available.");
        return;
      }

      void configureGitHubRepository(entry.repository, entry.id);
    },
    [builtInEntries, configureGitHubRepository],
  );

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

      void resolveCatalogEntry(entry);
    },
    [clearFeedback, entries, resolveCatalogEntry],
  );

  const selectFirmwareFile = useCallback(
    async (file: File | null) => {
      clearFeedback();

      if (!file) {
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
        "No device is connected. Open Devices, connect your board, then return here to install.",
      );
      return;
    }

    if (!resolved || resolved.images.length === 0) {
      setErrorKind("no-file");
      setErrorMessage(
        "Select a firmware project and wait for it to load before installing.",
      );
      return;
    }

    setIsFlashing(true);
    setProgress({
      stage: "preparing",
      message: "Preparing install…",
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
            "Install failed. Check the connection and try again.",
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
            : "Install failed unexpectedly.",
        );
      }
      setProgress((previous) =>
        previous
          ? {
              ...previous,
              stage: "failed",
              message:
                error instanceof Error ? error.message : "Install failed.",
            }
          : {
              stage: "failed",
              message:
                error instanceof Error ? error.message : "Install failed.",
              percent: 100,
            },
      );
    } finally {
      setIsFlashing(false);
    }
  }, [activeDevice, clearFeedback, ensureSupport, resolved, service]);

  const primaryImage = resolved?.images[0] ?? null;

  const chipCompatibilityWarning = useMemo(() => {
    if (!activeDevice || activeDevice.chipFamily === "unknown" || !resolved) {
      return null;
    }

    const families =
      resolved.manifest.chipFamilies ?? selectedBuiltIn?.chipFamilies;
    if (isFirmwareChipCompatible(families, activeDevice.chipFamily)) {
      return null;
    }

    const targets =
      families && families.length > 0
        ? families.map((family) => family.toUpperCase()).join(", ")
        : "a different chip family";

    return `This firmware targets ${targets}, but the connected chip is ${formatChipLabel(activeDevice.chipFamily)}. You can still install, but it may not boot.`;
  }, [activeDevice, resolved, selectedBuiltIn?.chipFamilies]);

  const firmwareProjectLabel =
    selectedBuiltIn?.name ??
    (releaseSummary
      ? `${releaseSummary.owner}/${releaseSummary.repository}`
      : (resolved?.manifest.title ?? null));

  const firmwareVersionLabel =
    resolved?.manifest.version ??
    releaseSummary?.tagName ??
    null;

  return {
    activeDevice,
    webSerialSupported,
    firmwareSource,
    builtInEntries,
    builtInCatalogStatus,
    builtInCatalogError,
    selectedBuiltInId,
    selectedBuiltIn,
    repositorySlug,
    releaseSummary,
    isLoadingGithub,
    isResolving,
    catalogEntries: visibleEntries,
    selectionKey,
    resolved,
    primaryImage,
    isFlashing,
    progress,
    result,
    errorKind,
    errorMessage,
    chipCompatibilityWarning,
    firmwareProjectLabel,
    firmwareVersionLabel,
    fileInputRef,
    flashAddress: primaryImage?.address ?? DEFAULT_APP_FLASH_ADDRESS,
    ensureSupport,
    setFirmwareSource: changeFirmwareSource,
    retryBuiltInCatalog,
    setRepositorySlug,
    loadGitHubRepository,
    selectBuiltInEntry,
    selectCatalogEntry,
    selectFirmwareFile,
    clearFirmware,
    startFlash,
  };
}
