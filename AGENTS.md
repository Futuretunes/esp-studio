# ESP Studio — Agent Notes

## Cursor Cloud specific instructions

### Product scope

ESP Studio is a browser-only SPA (React + Vite + TypeScript). There is **no backend**, database, or Docker dependency. Device connect, chip identification, Serial Monitor, local `.bin` flashing (via `FlashService`), Firmware Library, filesystem browse/transfer, and Diagnostics are in scope; **OTA** remains a later milestone.

### Required service

| Service         | Command    | Notes                                                            |
| --------------- | ---------- | ---------------------------------------------------------------- |
| Vite dev server | `pnpm dev` | Serves the app at http://localhost:5173 (host `true`, port 5173) |

### Standard commands

See `README.md` / `package.json` scripts for `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format`, and `pnpm preview`. Deployment: `docs/features/deployment.md` (GitHub Actions CI + FTP deploy of `dist/`). `pnpm build` / `pnpm dev` run `scripts/generate-build-info.mjs` to write `public/build.json`.

### Gotchas

- Use **pnpm** only (`packageManager` is pinned in `package.json`). Do not introduce npm/yarn lockfiles.
- Path alias `@/*` maps to `src/*` (configured in `vite.config.ts` and `tsconfig.app.json`).
- Dark theme is the default via `<html class="dark">`. Settings can toggle light/system via the Zustand UI store; that preference is in-memory only for now.
- `src/components/ui/*` follows shadcn/ui patterns. Prefer extending those primitives over duplicating styles.
- Feature work belongs under `src/features/<feature>/`; route entry points stay thin in `src/pages/`.
- **Docs first:** for every new feature, create/update `docs/features/<name>.md` (from `docs/_templates/feature.md`) before writing code. Architecture notes live under `docs/architecture/`; roadmap under `docs/roadmap/`.
- Domain contracts live in `src/core/*` (no React, no Web Serial/WebUSB). Device discovery uses `@/core/device`; raw byte streams use `@/core/transport` (`TransportIo`). Concrete transports belong in `src/providers/*` (Web Serial: `@/providers/web-serial`).
- Register providers at the app composition root (`src/app/device-runtime.ts` + `DeviceManagerProvider`); do not import `src/providers/*` from `src/core/*`.
- Devices UI talks to `useDeviceManager()` and stores serializable snapshots in Zustand (`useDeviceStore`). Never pass `SerialPort` into React state.
- Unexpected unplug / permission revoke: Web Serial fires `disconnect`; `WebSerialConnection` marks itself disconnected and the `ConnectionLossWatchdog` clears `activeDevice` with `errorKind: "lost"`. Do not invent auto-reconnect without a product decision.
- Byte IO for Serial Monitor / Flash must go through `CommunicationSession` over `connection.io` (`TransportIo`, `Uint8Array` only). Serial Monitor owner id is `"serial-monitor"` (`src/features/serial/constants.ts`).
- Chip identification owner id is `"chip-identification"` (`src/features/identification`). Flash Service owner id is `"flash-service"` (`src/features/flash`). Both require `TransportIo` to be **closed** (Serial Monitor must be stopped) because esptool-js needs native port stream locks + DTR/RTS. Never import `esptool-js` outside `src/adapters/esptool`. Call flash ops through `FlashService` / `EspToolAdapter` only. Flash UI sources: **Built-in Catalog** (static `src/features/firmware/catalog/`), **GitHub Repository**, or **Local File**. Built-in cards only supply `owner/repo` to `GitHubFirmwareProvider`; GitHub REST types stay under `src/features/firmware/providers/github/`. Default local / generated `.bin` address remains `DEFAULT_APP_FLASH_ADDRESS` (`0x10000`). Canonical package JSON is `FirmwareManifestDocument` (`schemaVersion: 1`) via `parseFirmwareManifest*` / `validateFirmwareManifestDocument`.
- GitHub release **binary** downloads use the Vite same-origin proxy `/__esp-studio/github-asset` in `pnpm dev` / `pnpm preview` (GitHub CDNs block browser CORS). Release **metadata** still comes from `api.github.com` directly.
- One-click Install UX lives on the Flash page (`/flash?project=<builtInId>` from the Firmware Library). Selecting a built-in project auto-configures GitHub, prefers chip-compatible options, auto-resolves when possible, and exposes a primary **Install Firmware** button over `FlashService.flash` (verify + reset).
- Firmware Library (`/firmware`, `src/features/library`) browses `BuiltInCatalog` with search/categories and deep-links Install into Flash. Recently used ids use localStorage; install history is a placeholder only.
- Device Diagnostics (`/diagnostics`, `src/features/diagnostics`) only aggregates existing store / DeviceManager / build-info / recent-library facts. Export `diagnostics.json` must never include Serial Monitor output or filesystem contents. Reserved hardware fields (`chipRevision`, `flashSize`, …) stay `null` until Identify exposes them — do not invent values.
- Release Candidate notes live in `docs/releases/v0.9.0-beta.1.md`. Architecture is frozen for beta: no new product features or abstraction layers; quality/docs only until the tag ships. Post-beta sequence: [docs/roadmap/versions.md](docs/roadmap/versions.md) (v0.9.1 → OTA → NVS → Partitions → Monaco → v1.0).
- Filesystem browse owner id is `"filesystem-browser"` (`src/features/filesystem`). Requires `TransportIo` **closed** (like Flash). Feature code uses `FilesystemService` + `EspFilesystemAdapter` only; flash reads/writes go through `EspToolAdapter` (never import `esptool-js` outside `src/adapters/esptool`). Upload/download rebuild SPIFFS volume images; LittleFS transfer may return `unsupported` in this MVP.
