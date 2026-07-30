/**
 * Recently used built-in firmware ids (localStorage), mirroring GitHub slug persistence.
 */

const RECENT_FIRMWARE_STORAGE_KEY = "esp-studio.firmware.library.recent";
const MAX_RECENT = 8;

/**
 * Reads recently used built-in catalog ids (newest first).
 */
export function readRecentFirmwareIds(): readonly string[] {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(RECENT_FIRMWARE_STORAGE_KEY);
    if (raw === null || raw.length === 0) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/**
 * Records a built-in catalog id as recently used.
 *
 * @param id - Built-in catalog entry id
 */
export function rememberRecentFirmwareId(id: string): void {
  if (typeof localStorage === "undefined" || id.trim().length === 0) {
    return;
  }

  const next = [id, ...readRecentFirmwareIds().filter((item) => item !== id)].slice(
    0,
    MAX_RECENT,
  );

  try {
    localStorage.setItem(RECENT_FIRMWARE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export { RECENT_FIRMWARE_STORAGE_KEY };
