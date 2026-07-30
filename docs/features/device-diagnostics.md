# Feature: Device Diagnostics & System Report

## Goal

Provide a diagnostics page that inspects the connected device and exports a support-friendly JSON report. No new product behavior — only surfaces information already available through existing services and browser APIs.

## Purpose

- Help users and maintainers file bug reports with consistent context.
- Show connection, device, app build, and browser/environment facts in one place.
- Export `diagnostics.json` without serial logs, filesystem contents, or personal data.

## Background

ESP Studio already exposes device snapshots (`useDeviceStore`), live `DeviceManager` metadata, Web Serial capability flags, Firmware Library “recently used” ids, and `/build.json` app metadata. Identify currently returns chip family + optional raw chip name only — not revision, flash size, or manufacturer.

See also:

- [Device Discovery](./device-discovery.md)
- [ESP Identification](./esp-identification.md)
- [Continuous Deployment](./deployment.md) (`build.json`)
- [Public Beta Hardening](./public-beta-hardening.md)
- [Current roadmap](../roadmap/current.md)

## Architecture

```text
Diagnostics UI
     │
     ▼
collectDiagnosticsReport()
     │  reads (no new services)
     ├── useDeviceStore / DeviceManager
     ├── navigator + Web Serial probe
     ├── loadBuildInfo()
     └── readRecentFirmwareIds() + BuiltInCatalog (labels only)
     ▼
diagnostics.json export (download / copy)
```

No new Device Layer types. Missing hardware fields are explicit `null` with UI “Not available”.

## Report format

`schemaVersion: 1`

| Section | Contents |
| ------- | -------- |
| `generatedAt` | ISO timestamp |
| `application` | `version`, `commit`, `builtAt` from `build.json` |
| `browser` | `userAgent`, `platform`, `language`, `webSerialAvailable` |
| `device` | Snapshot fields + optional `chipRawName` from device metadata; `chipRevision` / `flashSize` / `flashManufacturer` / `filesystemType` are `null` when unknown |
| `capabilities` | Device capability flags when connected |
| `firmware` | Recent library project id/name (not proven on-chip); version `null` unless known |
| `connection` | Store connection flags + current `errorKind` / `errorMessage` |
| `recentErrors` | At most the current device UI error (no history ring buffer yet) |

## Export flow

1. User opens **Diagnostics**.
2. Page collects a report (Refresh re-reads stores / build info).
3. **Export** downloads `diagnostics.json`.
4. **Copy** places JSON on the clipboard.

## Privacy considerations

Included:

- Device ids/names assigned by ESP Studio for this session
- Chip family / provider labels
- Browser UA / platform
- App version + git commit
- Current error message from the device UI store (if any)

Excluded:

- Serial Monitor output
- Filesystem file contents or paths listing
- GitHub tokens / FTP secrets
- Local absolute paths or account emails

## Acceptance Criteria

- [x] Feature doc complete.
- [x] `src/features/diagnostics/` page, report model, export helpers, cards.
- [x] Displays device/chip/connection/browser/build fields (unavailable → clear empty state).
- [x] Export `diagnostics.json` without serial logs or FS contents.
- [x] Reuses existing services; no new abstraction layers.
- [x] `pnpm lint` / `typecheck` / `test` / `build` pass.

## Backwards-compatible notes

- Report schema reserves `chipRevision`, `flashSize`, `flashManufacturer`, `filesystemType` as nullable for future identify enrichment without breaking exporters.
- Does not change Identify / Flash / DeviceManager contracts.

## Remaining blockers before v1.0 beta

- Hardware QA matrix still incomplete
- Identify does not yet expose revision / flash geometry
- No persisted install-on-device history

## Suggested next feature

**v0.9.1** (bug fixes, hardware compatibility, performance), then **OTA (v0.10)**. See [Version roadmap](../roadmap/versions.md).

## TODO Checklist

- [x] Documentation reviewed
- [x] Implementation complete
- [x] Quality gates pass
- [x] Roadmap updated
