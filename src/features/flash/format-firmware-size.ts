/**
 * Formats a firmware byte length for Flash UI labels.
 *
 * @param bytes - File size in bytes
 * @returns Human-readable size such as `512 B`, `128.0 KB`, or `1.25 MB`
 */
export function formatFirmwareSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
