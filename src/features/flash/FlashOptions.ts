/**
 * Caller options for {@link FlashService} operations.
 */

import type {
  EspToolFlashFreq,
  EspToolFlashImage,
  EspToolFlashMode,
  EspToolFlashSize,
} from "@/adapters/esptool";
import type { FlashProgressListener } from "@/features/flash/FlashProgress";

/**
 * Shared options for operations that only need a device id.
 */
export type FlashOperationOptions = {
  /** Optional progress listener. */
  readonly onProgress?: FlashProgressListener;
  /** Optional baud rate override for the adapter (default `115200`). */
  readonly baudRate?: number;
};

/**
 * Options for {@link FlashService.flash}.
 */
export type FlashOptions = FlashOperationOptions & {
  /** Connected device id from DeviceManager. */
  readonly deviceId: string;
  /** Firmware image segments to write. */
  readonly images: readonly EspToolFlashImage[];
  /** Erase entire flash before writing (default `false`). */
  readonly eraseAll?: boolean;
  /** Compress payloads before write (default `true`). */
  readonly compress?: boolean;
  /** Flash mode (default `"keep"`). */
  readonly flashMode?: EspToolFlashMode;
  /** Flash frequency (default `"keep"`). */
  readonly flashFreq?: EspToolFlashFreq;
  /** Flash size (default `"detect"`). */
  readonly flashSize?: EspToolFlashSize;
  /** Run MD5 verify after a successful write (default `false`). */
  readonly verifyAfterWrite?: boolean;
  /** Hard-reset the chip after a successful write (default `false`). */
  readonly resetAfter?: boolean;
  /**
   * After reset, re-sample ESP image magic at written bootloader/application
   * addresses and fail if the device does not look bootable (default `false`).
   */
  readonly verifyBootableAfterReset?: boolean;
  /**
   * Optional role tags aligned with {@link FlashOptions.images} indices.
   *
   * Used only for bootable verification (partition/otadata formats are skipped).
   */
  readonly imageRoles?: readonly (
    | "bootloader"
    | "partition-table"
    | "boot-app0"
    | "application"
    | "other"
  )[];
};

/**
 * Options for {@link FlashService.verify}.
 */
export type FlashVerifyOptions = FlashOperationOptions & {
  /** Connected device id. */
  readonly deviceId: string;
  /** Images whose on-device contents must match. */
  readonly images: readonly EspToolFlashImage[];
};

export type { EspToolFlashImage as FlashImage };
