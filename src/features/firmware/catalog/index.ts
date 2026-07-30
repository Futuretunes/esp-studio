/**
 * Built-in firmware catalog — static project metadata for Flash UI.
 *
 * @packageDocumentation
 */

export {
  BUILT_IN_FIRMWARE_CATALOG,
} from "./BuiltInCatalog";
export type {
  BuiltInCatalogCategory,
  BuiltInCatalogEntry,
} from "./BuiltInCatalogEntry";
export {
  findBuiltInCatalogEntry,
  loadBuiltInCatalog,
} from "./BuiltInCatalogLoader";
