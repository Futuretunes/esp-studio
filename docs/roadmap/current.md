# Current Focus

**Active milestone:** Firmware Manifest

## Why this next

The catalog needs a versioned, validatable JSON contract between providers and FlashService before GitHub / ESP Web Tools adapters can share one format.

## In scope

1. `docs/features/firmware-manifest.md`
2. Canonical `schemaVersion: 1` document types
3. Parser + validator with typed issues (required fields, duplicate addresses, chip families, image existence)
4. Catalog summary projection helper

## Out of scope

GitHub integration, downloads, remote manifest fetching, one-click install, SHA verify UI

## Next up

**GitHub Firmware Provider** — emit/consume `FirmwareManifestDocument`; download assets on resolve.

## Related documents

- [Firmware Manifest](../features/firmware-manifest.md)
- [Firmware Catalog](../features/firmware-catalog.md)
- [Flash Service](../features/flash-service.md)
- [Backlog](./backlog.md)
