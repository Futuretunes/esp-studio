# Current Focus

**Active milestone:** Flash Service (MVP)

## Why this next

Identification established the esptool adapter and ownership pattern. Flash UI needs a reusable orchestration service (`identify` / `erase` / `flash` / `verify` / `reset`) before any page, firmware library, or progress dialog exists.

## In scope

1. `docs/features/flash-service.md`
2. `EspToolAdapter` erase / write / verify / reset (plus identify) behind `src/adapters/esptool`
3. `src/features/flash` service types: progress, options, result, errors
4. Ownership owner id `"flash-service"` with guaranteed release
5. Structured `FlashProgress` stages for future React consumers

## Out of scope

Flash page UI, firmware library, downloads, OTA, filesystem, plugin system, progress dialogs, terminal output

## Next up

**Flash UI** — thin page that calls `FlashService` and renders `FlashProgress`.

## Related documents

- [Flash Service](../features/flash-service.md)
- [ESP Identification](../features/esp-identification.md)
- [Communication Session](../features/communication-session.md)
- [Backlog](./backlog.md)
