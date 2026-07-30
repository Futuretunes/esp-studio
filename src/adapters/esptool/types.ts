/**
 * Flash-related option and result types for the esptool adapter.
 *
 * Kept free of React and feature-layer types so Flash Service and future
 * callers share one boundary.
 */

import type { ChipFamily } from "@/core/device";

/**
 * Result of a chip detection attempt.
 */
export type ChipIdentificationResult = {
  /** Normalized ESP Studio chip family. */
  readonly chipFamily: ChipFamily;
  /** Raw chip name string reported by the detector, when available. */
  readonly rawName?: string;
};

/**
 * One firmware image segment to write or verify.
 */
export type EspToolFlashImage = {
  /** Binary image bytes. */
  readonly data: Uint8Array;
  /** Absolute flash address. */
  readonly address: number;
};

/**
 * Flash mode values accepted by esptool write.
 */
export type EspToolFlashMode = "keep" | "dio" | "qio" | "dout" | "qout";

/**
 * Flash frequency values accepted by esptool write.
 */
export type EspToolFlashFreq =
  | "keep"
  | "80m"
  | "60m"
  | "48m"
  | "40m"
  | "30m"
  | "26m"
  | "24m"
  | "20m"
  | "16m"
  | "15m"
  | "12m";

/**
 * Flash size values accepted by esptool write.
 */
export type EspToolFlashSize =
  | "detect"
  | "keep"
  | "256KB"
  | "512KB"
  | "1MB"
  | "2MB"
  | "2MB-c1"
  | "4MB"
  | "4MB-c1"
  | "8MB"
  | "16MB"
  | "32MB"
  | "64MB"
  | "128MB";

/**
 * Progress callback for multi-file writes inside the adapter.
 *
 * @param fileIndex - Zero-based image index currently writing
 * @param written - Bytes written so far for this image
 * @param total - Total bytes for this image
 */
export type EspToolWriteProgress = (
  fileIndex: number,
  written: number,
  total: number,
) => void;

/**
 * Options for {@link EspToolAdapter.flash}.
 */
export type EspToolFlashOptions = {
  /** Images to write. */
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
  /** Optional write progress callback. */
  readonly onWriteProgress?: EspToolWriteProgress;
};

/**
 * Options for {@link EspToolAdapter.verify}.
 */
export type EspToolVerifyOptions = {
  /** Images whose on-device MD5 must match. */
  readonly images: readonly EspToolFlashImage[];
};

/**
 * Per-image verify outcome.
 */
export type EspToolVerifyImageResult = {
  readonly address: number;
  readonly size: number;
  readonly expectedMd5: string;
  readonly actualMd5: string;
  readonly matched: boolean;
};

/**
 * Aggregate verify outcome.
 */
export type EspToolVerifyResult = {
  readonly matched: boolean;
  readonly images: readonly EspToolVerifyImageResult[];
};
