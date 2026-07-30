# Current Focus

**Active milestone:** Firmware Library

## Why this next

Firmware Platform and Filesystem Platform are complete. Next is the product browse experience: discover firmware and launch the existing one-click install flow—no new abstractions.

## In scope

1. `docs/features/firmware-library.md`
2. `src/features/library/` browse UI (search, categories, cards)
3. Deep-link Install → `/flash?project=<id>` + `selectBuiltInEntry`
4. Recently used + install-history placeholder

## Out of scope

Remote search, auth, ratings, reviews, downloads telemetry, OTA, new providers

## Related documents

- [Firmware Library](../features/firmware-library.md)
- [One-click Install](../features/one-click-install.md)
- [Built-in Firmware Catalog](../features/built-in-firmware-catalog.md)
- [Backlog](./backlog.md)
