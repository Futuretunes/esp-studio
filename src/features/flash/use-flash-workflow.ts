import { useCallback, useMemo, useRef, useState } from "react";

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
import { isWebSerialSupported } from "@/providers/web-serial";
import { useDeviceStore } from "@/store";

export type SelectedFirmware = {
  readonly name: string;
  readonly size: number;
  readonly data: Uint8Array;
};

export type FlashUiErrorKind =
  | "unsupported"
  | "no-device"
  | "no-file"
  | "invalid-file"
  | "busy"
  | "failed"
  | null;

/**
 * Flash UI workflow: local `.bin` selection + {@link FlashService.flash}.
 */
export function useFlashWorkflow() {
  const manager = useDeviceManager();
  const activeDevice = useDeviceStore((state) => state.activeDevice);
  const webSerialSupported = useDeviceStore((state) => state.webSerialSupported);
  const setWebSerialSupported = useDeviceStore(
    (state) => state.setWebSerialSupported,
  );

  const service = useMemo(() => new FlashService(manager), [manager]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [firmware, setFirmware] = useState<SelectedFirmware | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [progress, setProgress] = useState<FlashProgress | null>(null);
  const [result, setResult] = useState<FlashResult | null>(null);
  const [errorKind, setErrorKind] = useState<FlashUiErrorKind>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setFirmware(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const selectFirmwareFile = useCallback(
    async (file: File | null) => {
      clearFeedback();

      if (!file) {
        clearFirmware();
        return;
      }

      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".bin")) {
        clearFirmware();
        setErrorKind("invalid-file");
        setErrorMessage(
          "Please choose a firmware file with a .bin extension.",
        );
        return;
      }

      try {
        const buffer = await file.arrayBuffer();
        setFirmware({
          name: file.name,
          size: file.size,
          data: new Uint8Array(buffer),
        });
      } catch (error) {
        clearFirmware();
        setErrorKind("failed");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not read the selected firmware file.",
        );
      }
    },
    [clearFeedback, clearFirmware],
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

    if (!firmware) {
      setErrorKind("no-file");
      setErrorMessage("Select a local .bin firmware file before flashing.");
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
        images: [
          {
            data: firmware.data,
            address: DEFAULT_APP_FLASH_ADDRESS,
          },
        ],
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
    firmware,
    service,
  ]);

  return {
    activeDevice,
    webSerialSupported,
    firmware,
    isFlashing,
    progress,
    result,
    errorKind,
    errorMessage,
    fileInputRef,
    flashAddress: DEFAULT_APP_FLASH_ADDRESS,
    ensureSupport,
    selectFirmwareFile,
    clearFirmware,
    startFlash,
  };
}
