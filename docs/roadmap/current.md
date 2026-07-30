# Current Focus

**Active milestone:** Flash UI (MVP)

## Why this next

`FlashService` is ready. Users need a first complete local `.bin` flashing workflow with live progress and friendly errors—before a firmware library or OTA exists.

## In scope

1. `docs/features/flash-ui.md`
2. Flash page: device info, chip, `.bin` picker, size, Flash button, progress, result
3. Wire to existing `FlashService` with live `FlashProgress`
4. Friendly error states (no device, unsupported, busy, flash/verify failed)

## Out of scope

Firmware library, GitHub Releases, OTA, multiple partitions, bootloader selection, partition table editing, settings

## Next up

**Firmware Library (MVP)** — catalog local/remote images for one-click install via `FlashService`.

## Related documents

- [Flash UI](../features/flash-ui.md)
- [Flash Service](../features/flash-service.md)
- [Backlog](./backlog.md)
