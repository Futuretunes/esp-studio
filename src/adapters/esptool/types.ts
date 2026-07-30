/**
 * Result of a chip detection attempt.
 */

import type { ChipFamily } from "@/core/device";

/**
 * Normalized identification payload returned by the esptool adapter.
 */
export type ChipIdentificationResult = {
  /** Normalized ESP Studio chip family. */
  readonly chipFamily: ChipFamily;
  /** Raw chip name string reported by the detector, when available. */
  readonly rawName?: string;
};
