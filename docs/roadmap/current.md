# Current Focus

**Active milestone:** Filesystem Browser (MVP)

## Why this next

One-click Install completed the flash UX. Next is on-device storage visibility: list directories/files via a dedicated filesystem service + adapter, establishing the model for upload/download later.

## In scope

1. `docs/features/filesystem-browser.md`
2. `FilesystemService` + abstract entries + typed errors
3. `EspFilesystemAdapter` (flash read + SPIFFS/LittleFS parse)
4. Filesystem page: browse, expand/collapse, refresh

## Out of scope

Upload, download, delete, rename, create folder, OTA, editor integration

## Next up

Editable filesystem (upload/download) or public beta polish.

## Related documents

- [Filesystem Browser](../features/filesystem-browser.md)
- [Communication Session](../features/communication-session.md)
- [Flash Service](../features/flash-service.md)
- [Backlog](./backlog.md)
