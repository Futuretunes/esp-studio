/**
 * Aggregates multiple {@link FirmwareProvider} instances into one catalog.
 */

import type {
  FirmwareCatalogEntry,
  FirmwareProvider,
  FirmwareResolvedPackage,
} from "@/features/firmware/FirmwareProvider";

/**
 * Multi-provider firmware catalog.
 *
 * Flash UI and future one-click installers should depend on this class instead
 * of individual sources.
 */
export class FirmwareCatalog {
  readonly #providers: ReadonlyMap<string, FirmwareProvider>;

  /**
   * @param providers - Providers to register (ids must be unique)
   */
  constructor(providers: readonly FirmwareProvider[]) {
    const map = new Map<string, FirmwareProvider>();
    for (const provider of providers) {
      if (map.has(provider.id)) {
        throw new Error(
          `Duplicate firmware provider id "${provider.id}" in FirmwareCatalog`,
        );
      }
      map.set(provider.id, provider);
    }
    this.#providers = map;
  }

  /**
   * Returns registered providers in registration order.
   */
  listProviders(): readonly FirmwareProvider[] {
    return [...this.#providers.values()];
  }

  /**
   * Looks up a provider by id.
   *
   * @param providerId - Provider id
   */
  getProvider(providerId: string): FirmwareProvider | undefined {
    return this.#providers.get(providerId);
  }

  /**
   * Lists catalog entries from every registered provider.
   */
  async listAll(): Promise<readonly FirmwareCatalogEntry[]> {
    const batches = await Promise.all(
      [...this.#providers.values()].map(async (provider) => provider.list()),
    );
    return batches.flat();
  }

  /**
   * Resolves a manifest through its owning provider.
   *
   * @param providerId - Provider that listed the manifest
   * @param manifestId - Manifest id within that provider
   */
  async resolve(
    providerId: string,
    manifestId: string,
  ): Promise<FirmwareResolvedPackage> {
    const provider = this.#providers.get(providerId);
    if (!provider) {
      throw new Error(`Unknown firmware provider "${providerId}"`);
    }
    return provider.resolve(manifestId);
  }
}
