/**
 * A single flashable binary segment from the firmware catalog.
 */

/**
 * Installable image bytes plus target flash address.
 *
 * Ready to map into FlashService `images` entries.
 */
export type FirmwareImage = {
  /** Stable id within its parent manifest. */
  readonly id: string;
  /** Human-readable part label (for example `application`). */
  readonly label: string;
  /** Absolute flash address. */
  readonly address: number;
  /** Byte length of {@link FirmwareImage.data}. */
  readonly size: number;
  /** Firmware payload. */
  readonly data: Uint8Array;
};
