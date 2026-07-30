/**
 * Built-in firmware catalog entry model (metadata only).
 */

/**
 * Category ids stored on catalog entries.
 *
 * Category filter UI is deferred; values are still typed for future use.
 */
export type BuiltInCatalogCategory =
  | "lighting"
  | "home-automation"
  | "mqtt"
  | "firmware";

/**
 * Static catalog row describing a popular firmware project.
 *
 * Does not include binaries or release metadata — those come from
 * {@link import("@/features/firmware/providers/github").GitHubFirmwareProvider}
 * after configuring {@link BuiltInCatalogEntry.repository}.
 */
export type BuiltInCatalogEntry = {
  /** Stable catalog id (for example `"wled"`). */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /** Short description for cards. */
  readonly description: string;
  /** GitHub `owner/repository` slug. */
  readonly repository: string;
  /** Logical category. */
  readonly category: BuiltInCatalogCategory;
  /**
   * Optional chip family hints (for example `"esp32"`, `"esp8266"`).
   *
   * Filtering against the connected device is deferred.
   */
  readonly chipFamilies?: readonly string[];
  /** Icon identifier resolved by the Flash UI (for example `"wled"`). */
  readonly icon: string;
  /** Whether to emphasize the entry (ordering / badge). */
  readonly featured: boolean;
  /**
   * When `false`, this project does not publish installable `.bin` assets on
   * GitHub Releases (ESPHome compiles per-device YAML). Flash UI explains and
   * links to Releases instead of attempting one-click download.
   *
   * Defaults to `true` when omitted.
   */
  readonly supportsGithubBinInstall?: boolean;
};
