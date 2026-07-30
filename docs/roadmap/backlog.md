# ESP Studio Roadmap — Backlog

Prioritized product roadmap. Status legend: ✅ done · 🟡 in progress · ⬜ planned.

| Priority | Item             | Status | Notes                                               |
| -------- | ---------------- | ------ | --------------------------------------------------- |
| 1        | Foundation       | ✅     | Vite/React/TS shell, routing, dark UI, tooling      |
| 2        | Core             | 🟡     | `src/core/*` domain packages; Device Layer landed   |
| 3        | Device Layer     | ✅     | Transport-agnostic device contracts + manager       |
| 4        | Web Serial       | ✅     | First real `DeviceProvider` implementation          |
| 5        | Device Discovery | ✅     | UX + APIs to list/request devices across providers  |
| 6        | Transport IO     | ✅     | Raw `Uint8Array` stream contract for all transports |
| 7        | Communication    | ✅     | Single-owner session over `TransportIo`             |
| 8        | ESP Identification | ✅     | Chip detect via esptool adapter; Device + UI update |
| 9        | Flash Service      | ✅     | Orchestration (`FlashService`) over esptool adapter |
| 9a       | Flash UI           | ✅     | Local `.bin` flash page + live progress             |
| 9b       | Firmware Catalog   | ✅     | Multi-provider catalog; LocalFirmwareProvider only  |
| 9c       | Firmware Manifest  | ✅     | Canonical JSON schema + parser/validator            |
| 9d       | GitHub Firmware    | ✅     | First remote FirmwareProvider (Releases + Flash UI) |
| 9e       | Built-in Catalog   | ✅     | Static popular projects → GitHubFirmwareProvider    |
| 9f       | One-click Install  | ✅     | Connect → pick project → Install Firmware           |
| 9g       | Pre-flash Inspect  | ✅     | Confirm before overwrite; blank skips confirm       |
| 10       | Firmware Plugins   | ⬜     | Installer contribution points + first plugins       |
| 11       | Firmware Library   | ✅     | Catalog browser + one-click install                 |
| 12       | Serial Monitor     | ✅     | Minimal UTF-8 console over `CommunicationSession`   |
| 13       | Filesystem         | ✅     | SPIFFS / LittleFS browse + upload/download          |
| 13a      | Public Beta Harden | ✅     | Reliability, UX consistency, smoke tests            |
| 13b      | FS Upload/Download | ✅     | Transfer files via FilesystemService + adapter        |
| 14       | OTA                | ⬜     | Network update flows                                |
| 15       | IDE                | ⬜     | Monaco-based editing shell                          |
| 16       | Release v1.0       | 🟡     | Tag v0.9.0-beta.1 after device op lock              |
| 16a      | Continuous Deploy  | ✅     | CI + FTP deploy of dist/ to shared hosting          |
| 16b      | Device Diagnostics | ✅     | Support report export for bug reports               |
| 16c      | Device Op Lock     | ✅     | Shared ownership across Flash/Identify/FS/Serial    |
| 16d      | v0.9.1             | ⬜     | Bug fixes · hardware compatibility · performance    |

## Detail by milestone

### Foundation ✅

- App shell, feature routes, shadcn/ui, Zustand, TanStack Query.
- No Web Serial / flashing.

### Core 🟡

- Establish `src/core` as the home for durable domain modules.
- Enforce layering: core has no browser API dependencies.

### Device Layer ✅

- Public contracts for info, capabilities, connection, provider, manager.
- Fake-provider testability; stable consumer API in `src/core/device`.

### Web Serial ✅

- `WebSerialProvider` implementing `DeviceProvider`.
- Browser permission flows isolated in `src/providers/web-serial`.
- Minimal connect/disconnect only (no streaming/flashing yet).

### Device Discovery ✅

- Unified connect UX for Web Serial on the Devices page.
- `DeviceManager` exposed via React context; Zustand holds UI snapshots.
- Persist recent devices where the transport allows (future).

### Transport IO ✅

- Core `TransportIo` contract (`open` / `close` / `read` / `write` / `flush`).
- Web Serial implementation via `WebSerialTransportIo` on `DeviceConnection.io`.
- Binary `Uint8Array` only; no Serial Monitor UI.

### Communication Session ✅

- `CommunicationSession` owns a `TransportIo` with exclusive `CommunicationLock`.
- Prevents concurrent readers/writers; forwards raw bytes only.

### ESP Identification ✅

- Detect chip family under `"chip-identification"` ownership.
- Isolate `esptool-js` in `src/adapters/esptool`; update Device + Devices UI.

### Flash Service ✅

- `FlashService` identify / erase / flash / verify / reset with `"flash-service"` ownership.
- Reusable `FlashProgress` stages for UI consumers.

### Flash UI ✅

- Local `.bin` flash page with live progress and friendly errors.
- Selects firmware via `FirmwareCatalog` (“Local file…” → picker).

### Firmware Catalog ✅

- Multi-provider `FirmwareCatalog`; MVP ships `LocalFirmwareProvider` only.
- Flash UI consumes catalog entries.

### Firmware Manifest ✅

- Canonical `schemaVersion: 1` JSON document, parser, and typed validator.
- Contract between providers and FlashService.

### GitHub Firmware Provider ✅

- `GitHubFirmwareProvider` loads latest release into `FirmwareCatalog`.
- Manifest discovery + `.bin` fallback; lazy download on `resolve()`.
- Flash UI: Local File vs GitHub Repository (persisted slug).

### Built-in Firmware Catalog ✅

- Static curated projects (WLED, ESPHome, Tasmota, OpenMQTTGateway).
- Flash UI cards configure `GitHubFirmwareProvider` by repository slug.
- Sources: Built-in Catalog | GitHub Repository | Local File.

### One-click Install ✅

- Auto-load latest release and resolve preferred firmware option.
- Primary **Install Firmware** action with device/firmware summary.
- Chip preference ordering + incompatibility warning (options stay visible).

### Firmware Plugins ⬜

- Plugin host MVP and firmware installer contributions.

### Firmware Library ✅

- Browse BuiltInCatalog with search/categories; Install deep-links to Flash one-click flow.
- Recently used (localStorage); install history placeholder.
- No remote search / ratings / OTA.

### Serial Monitor ✅

- Acquire `CommunicationSession` ownership (`"serial-monitor"`); UTF-8 decode/encode in the UI layer.
- Live output, auto-scroll, send text, connect/disconnect, clear (minimal).

### Filesystem ✅

- Browse-only SPIFFS / LittleFS tree via `FilesystemService` + `EspFilesystemAdapter`.
- Upload / download / mutate deferred to FS Transfer milestone.

### Public Beta Hardening ✅

- Unexpected disconnect / permission loss handling and UI sync.
- Consistent alerts, retries, empty/loading states; stale copy cleanup.
- Practical `pnpm test` smoke suite (no hardware required).

### FS Upload / Download ✅

- Upload + download over existing FilesystemService / EspFilesystemAdapter.
- Progress, overwrite confirmation; SPIFFS primary; LittleFS transfer deferred.
- No rename/delete/mkdir.

### OTA ⬜

- Network provider targets + update orchestration.

### IDE ⬜

- Monaco integration, project files, optional language tools.

### Continuous Deploy ✅

- GitHub Actions CI (lint/typecheck/test/build) and FTP deploy of `dist/`.
- `build.json` + Settings About display.
- Secrets: FTP_HOST / FTP_PORT / FTP_USER / FTP_PASSWORD / FTP_REMOTE_PATH.

### Device Diagnostics ✅

- Diagnostics page aggregating device/browser/build facts.
- Export `diagnostics.json` for support (no serial logs / FS contents).

### Device Operation Lock ✅

- Shared per-device ownership via `DeviceManager.getOperationLock`.
- Prevents concurrent Flash / Identify / Filesystem / Serial esptool contention.

### Release v1.0 🟡

- RC: `docs/releases/v0.9.0-beta.1.md`, honest beta copy, device op lock.
- Remaining: hardware QA matrix, GitHub Release tag, production deploy.
- Later: API freeze notes, example provider, sample firmware plugin.

## Related documents

- [Current focus](./current.md)
- [Architecture overview](../architecture/overview.md)
- [Device Layer feature](../features/device-layer.md)
