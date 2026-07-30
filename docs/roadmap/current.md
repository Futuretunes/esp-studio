# Current Focus

**Active milestone:** One-click Install (next)

## Why this next

GitHub Firmware Provider is in place. The next UX step is fewer manual clicks between selecting a catalog entry and flashing through `FlashService`.

## Just completed

**GitHub Firmware Provider (MVP)** — remote `FirmwareProvider` for GitHub Releases with manifest discovery / `.bin` fallback and Flash UI source switch.

## In scope (One-click Install)

1. Streamlined Flash / library flow over `FirmwareCatalog` + `FlashService`
2. Keep providers pluggable; no GitHub-specific UI beyond the existing source

## Out of scope

OTA, ESP Web Tools provider, GitHub auth, auto-update

## Related documents

- [GitHub Firmware Provider](../features/github-firmware-provider.md)
- [Firmware Catalog](../features/firmware-catalog.md)
- [Flash UI](../features/flash-ui.md)
- [Backlog](./backlog.md)
