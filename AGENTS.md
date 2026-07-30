# ESP Studio — Agent Notes

## Cursor Cloud specific instructions

### Product scope

ESP Studio is a browser-only SPA (React + Vite + TypeScript). There is **no backend**, database, or Docker dependency in this foundation. Flashing and Web Serial are intentionally deferred.

### Required service

| Service         | Command    | Notes                                                            |
| --------------- | ---------- | ---------------------------------------------------------------- |
| Vite dev server | `pnpm dev` | Serves the app at http://localhost:5173 (host `true`, port 5173) |

### Standard commands

See `README.md` / `package.json` scripts for `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm format`, and `pnpm preview`.

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
- Byte IO for Serial Monitor / Flash must go through `CommunicationSession` over `connection.io` (`TransportIo`, `Uint8Array` only). Serial Monitor owner id is `"serial-monitor"` (`src/features/serial/constants.ts`).
- Chip identification owner id is `"chip-identification"` (`src/features/identification`). Flash Service owner id is `"flash-service"` (`src/features/flash`). Both require `TransportIo` to be **closed** (Serial Monitor must be stopped) because esptool-js needs native port stream locks + DTR/RTS. Never import `esptool-js` outside `src/adapters/esptool`. Call flash ops through `FlashService` / `EspToolAdapter` only.
