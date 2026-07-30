# ESP Studio

Browser-based platform for ESP8266 and ESP32 development.

## Stack

- React + TypeScript + Vite
- pnpm
- Tailwind CSS + shadcn/ui
- React Router
- Zustand
- TanStack Query
- Lucide React

## Requirements

- **Node.js ≥ 20**
- **pnpm** (see `packageManager` in `package.json`; `corepack enable` recommended)
- **Chromium** (Chrome / Edge / Opera) for Web Serial device features, over HTTPS or localhost

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command          | Description                             |
| ---------------- | --------------------------------------- |
| `pnpm dev`       | Start the Vite development server       |
| `pnpm build`     | Generate build.json, typecheck, and build |
| `pnpm lint`      | Run ESLint                              |
| `pnpm format`    | Format with Prettier                    |
| `pnpm typecheck` | Run TypeScript project references check |
| `pnpm test`      | Run Vitest smoke tests                  |
| `pnpm preview`   | Preview the production build            |

CI and FTP deploy: [`docs/features/deployment.md`](./docs/features/deployment.md).

## Releases

- [v0.9.0-beta.1](./docs/releases/v0.9.0-beta.1.md) — first public beta / RC notes

## Architecture

Feature-based layout under `src/features/*`, with shared UI in `src/components`, app shell in `src/layouts`, and route pages in `src/pages`. Domain contracts live under `src/core/*` (see Device Layer).

Product and architecture docs: [`docs/README.md`](./docs/README.md).

Device connect, flash, serial monitor, and filesystem browse run in the browser over Web Serial (Chromium). See [`docs/hardware-compatibility.md`](./docs/hardware-compatibility.md).
