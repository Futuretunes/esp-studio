# Current Focus

**Active milestone:** Filesystem Upload & Download (MVP)

## Why this next

Public beta hardening stabilized disconnect/UX. Next is on-device file transfer on top of the existing browse architecture—no new abstraction layers.

## In scope

1. `docs/features/filesystem-transfer.md`
2. Extend `FilesystemService` + `EspFilesystemAdapter` for upload/download
3. Progress + overwrite confirmation + Filesystem page actions
4. SPIFFS primary; LittleFS best-effort

## Out of scope

Rename, delete, create folder, drag-and-drop, text editor, OTA, new service layers

## Related documents

- [Filesystem Transfer](../features/filesystem-transfer.md)
- [Filesystem Browser](../features/filesystem-browser.md)
- [Backlog](./backlog.md)
