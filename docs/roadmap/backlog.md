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
| 9        | Flash Service      | 🟡     | Orchestration (`FlashService`) over esptool adapter |
| 9a       | Flash UI           | ⬜     | Thin page consuming `FlashService` + progress       |
| 10       | Firmware Plugins   | ⬜     | Installer contribution points + first plugins       |
| 11       | Firmware Library   | ⬜     | Catalog, versions, local/remote artifacts           |
| 12       | Serial Monitor     | ✅     | Minimal UTF-8 console over `CommunicationSession`   |
| 13       | Filesystem         | ⬜     | SPIFFS / LittleFS browser                           |
| 14       | OTA                | ⬜     | Network update flows                                |
| 15       | IDE                | ⬜     | Monaco-based editing shell                          |
| 16       | Release v1.0       | ⬜     | Documented APIs, tests, at least one transport      |

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

### Flash Service 🟡

- `FlashService` identify / erase / flash / verify / reset with `"flash-service"` ownership.
- Reusable `FlashProgress` stages; no Flash page UI yet.

### Flash UI ⬜

- Thin page consuming `FlashService` and rendering progress.
- Firmware file picker only (library remains separate).

### Firmware Plugins ⬜

- Plugin host MVP and firmware installer contributions.

### Firmware Library ⬜

- Metadata model, import/export, versioning.

### Serial Monitor ✅

- Acquire `CommunicationSession` ownership (`"serial-monitor"`); UTF-8 decode/encode in the UI layer.
- Live output, auto-scroll, send text, connect/disconnect, clear (minimal).

### Filesystem ⬜

- Tree browser, upload/download, safe path handling.

### OTA ⬜

- Network provider targets + update orchestration.

### IDE ⬜

- Monaco integration, project files, optional language tools.

### Release v1.0 ⬜

- API freeze for Device Layer + Flash Engine.
- Docs, CI, example provider, sample firmware plugin.

## Related documents

- [Current focus](./current.md)
- [Architecture overview](../architecture/overview.md)
- [Device Layer feature](../features/device-layer.md)
