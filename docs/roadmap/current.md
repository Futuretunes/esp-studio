# Current Focus

**Active milestone:** Firmware Catalog (MVP)

## Why this next

Flash UI picks a local `.bin` directly. A provider-based catalog is required before GitHub / ESP Web Tools / one-click install can share one firmware source.

## In scope

1. `docs/features/firmware-catalog.md`
2. `FirmwareCatalog` + `FirmwareProvider` + manifest/image types
3. `LocalFirmwareProvider` only
4. Flash page selects firmware via catalog (“Local file…” → picker)
5. Continue flashing through existing `FlashService`

## Out of scope

One-click install, GitHub Releases, downloads, ESP Web Tools manifests, OTA, multi-partition editing

## Next up

**GitHub Firmware Provider** — list release `.bin` assets; download on resolve (still no full one-click product polish).

## Related documents

- [Firmware Catalog](../features/firmware-catalog.md)
- [Flash UI](../features/flash-ui.md)
- [Flash Service](../features/flash-service.md)
- [Backlog](./backlog.md)
