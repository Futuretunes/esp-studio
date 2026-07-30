/**
 * Client-side Firmware Library search / filter helpers.
 */

import type {
  BuiltInCatalogCategory,
  BuiltInCatalogEntry,
} from "@/features/firmware/catalog";

/**
 * Category filter including “all”.
 */
export type FirmwareLibraryCategoryFilter =
  | "all"
  | BuiltInCatalogCategory;

/**
 * Filters catalog entries by free-text query and optional category.
 *
 * @param entries - Built-in catalog rows
 * @param query - Case-insensitive search string
 * @param category - Category filter (`all` disables category filtering)
 */
export function filterFirmwareLibraryEntries(
  entries: readonly BuiltInCatalogEntry[],
  query: string,
  category: FirmwareLibraryCategoryFilter = "all",
): readonly BuiltInCatalogEntry[] {
  const normalizedQuery = query.trim().toLowerCase();

  return entries.filter((entry) => {
    if (category !== "all" && entry.category !== category) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    const haystack = [
      entry.name,
      entry.description,
      entry.repository,
      entry.category,
      entry.id,
      ...(entry.chipFamilies ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

/**
 * Returns featured (popular) entries from a filtered list, preserving order.
 */
export function selectPopularFirmwareEntries(
  entries: readonly BuiltInCatalogEntry[],
): readonly BuiltInCatalogEntry[] {
  return entries.filter((entry) => entry.featured);
}

/**
 * Maps recent ids onto catalog entries (skips unknown ids).
 *
 * @param entries - Full catalog
 * @param recentIds - Newest-first ids from localStorage
 */
export function resolveRecentFirmwareEntries(
  entries: readonly BuiltInCatalogEntry[],
  recentIds: readonly string[],
): readonly BuiltInCatalogEntry[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const resolved: BuiltInCatalogEntry[] = [];
  for (const id of recentIds) {
    const entry = byId.get(id);
    if (entry) {
      resolved.push(entry);
    }
  }
  return resolved;
}
