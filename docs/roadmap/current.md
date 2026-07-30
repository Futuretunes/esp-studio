# Current Focus

**Active milestone:** Built-in Firmware Catalog (MVP)

## Why this next

GitHub Firmware Provider is stable. Users still need a curated list of popular projects so they can install WLED / ESPHome / etc. without knowing GitHub slugs. The catalog describes sources; GitHub remains the loader.

## In scope

1. `docs/features/built-in-firmware-catalog.md`
2. Static `BuiltInCatalog` under `src/features/firmware/catalog/`
3. Flash UI: Built-in Catalog | GitHub Repository | Local File
4. Card select → `GitHubFirmwareProvider.configureRepository`

## Out of scope

Search, favorites, remote catalog, category UI, version filtering, OTA, one-click auto-install

## Next up

**One-click Install** — fewer steps from catalog selection to `FlashService.flash`.

## Related documents

- [Built-in Firmware Catalog](../features/built-in-firmware-catalog.md)
- [GitHub Firmware Provider](../features/github-firmware-provider.md)
- [Firmware Catalog](../features/firmware-catalog.md)
- [Backlog](./backlog.md)
