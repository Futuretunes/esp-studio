# ESP Studio Roadmap — Backlog

Prioritized product roadmap. Status legend: ✅ done · 🟡 in progress · ⬜ planned.

| Priority | Item             | Status | Notes                                              |
| -------- | ---------------- | ------ | -------------------------------------------------- |
| 1        | Foundation       | ✅     | Vite/React/TS shell, routing, dark UI, tooling     |
| 2        | Core             | 🟡     | `src/core/*` domain packages; Device Layer landed  |
| 3        | Device Layer     | ✅     | Transport-agnostic device contracts + manager      |
| 4        | Web Serial       | ✅     | First real `DeviceProvider` implementation         |
| 5        | Device Discovery | ✅     | UX + APIs to list/request devices across providers |
| 6        | Flash Engine     | ⬜     | Flash orchestration + esptool-js adapter           |
| 7        | Firmware Plugins | ⬜     | Installer contribution points + first plugins      |
| 8        | Firmware Library | ⬜     | Catalog, versions, local/remote artifacts          |
| 9        | Serial Monitor   | ⬜     | Streaming console over `DeviceConnection`          |
| 10       | Filesystem       | ⬜     | SPIFFS / LittleFS browser                          |
| 11       | OTA              | ⬜     | Network update flows                               |
| 12       | IDE              | ⬜     | Monaco-based editing shell                         |
| 13       | Release v1.0     | ⬜     | Documented APIs, tests, at least one transport     |

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

### Flash Engine ⬜

- Progress events, abort, verification hooks.
- Adapter boundary for esptool-js and optional ESP Web Tools.

### Firmware Plugins ⬜

- Plugin host MVP and firmware installer contributions.

### Firmware Library ⬜

- Metadata model, import/export, versioning.

### Serial Monitor ⬜

- Baud configuration via capabilities, log buffer, export.

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
