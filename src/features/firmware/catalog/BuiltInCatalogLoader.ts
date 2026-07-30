/**
 * Loads the built-in firmware catalog (static today; remote-ready later).
 */

import { BUILT_IN_FIRMWARE_CATALOG } from "@/features/firmware/catalog/BuiltInCatalog";
import type { BuiltInCatalogEntry } from "@/features/firmware/catalog/BuiltInCatalogEntry";

/**
 * Returns built-in catalog entries.
 *
 * MVP reads the static TypeScript module only — no network and no JSON
 * downloads. Featured entries are sorted first, then by name.
 *
 * The Promise signature leaves room for a future remote catalog without
 * changing Flash UI call sites.
 */
export function loadBuiltInCatalog(): Promise<readonly BuiltInCatalogEntry[]> {
  const entries = [...BUILT_IN_FIRMWARE_CATALOG];
  entries.sort((left, right) => {
    if (left.featured !== right.featured) {
      return left.featured ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });
  return Promise.resolve(entries);
}

/**
 * Looks up a built-in entry by id.
 *
 * @param id - Catalog entry id
 */
export function findBuiltInCatalogEntry(
  id: string,
): Promise<BuiltInCatalogEntry | undefined> {
  return loadBuiltInCatalog().then((entries) =>
    entries.find((entry) => entry.id === id),
  );
}
