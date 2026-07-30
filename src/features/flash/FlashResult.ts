/**
 * Outcome payload returned by {@link FlashService} methods.
 */

import type { ChipFamily } from "@/core/device";
import type { EspToolVerifyImageResult } from "@/adapters/esptool";
import type { FlashError } from "@/features/flash/errors";
import type { FlashStage } from "@/features/flash/FlashProgress";

/**
 * Successful or failed flash-service result.
 */
export type FlashResult = {
  /** Whether the requested operation completed successfully. */
  readonly success: boolean;
  /** Final stage (`completed` or `failed`). */
  readonly stage: Extract<FlashStage, "completed" | "failed">;
  /** Optional chip family when known. */
  readonly chipFamily?: ChipFamily;
  /** Optional raw esptool chip name. */
  readonly rawName?: string;
  /** Optional status message. */
  readonly message?: string;
  /** Present when `success` is `false`. */
  readonly error?: FlashError;
  /** Present after verify operations. */
  readonly verify?: {
    readonly matched: boolean;
    readonly images: readonly EspToolVerifyImageResult[];
  };
};
