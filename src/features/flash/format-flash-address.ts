/**
 * Formats a flash address for display.
 *
 * @param address - Absolute flash offset
 * @returns Uppercase hex string such as `0x10000`
 */
export function formatFlashAddress(address: number): string {
  return `0x${address.toString(16).toUpperCase()}`;
}
