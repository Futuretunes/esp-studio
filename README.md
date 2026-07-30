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
| `pnpm build`     | Typecheck and build for production      |
| `pnpm lint`      | Run ESLint                              |
| `pnpm format`    | Format with Prettier                    |
| `pnpm typecheck` | Run TypeScript project references check |
| `pnpm preview`   | Preview the production build            |

## Architecture

Feature-based layout under `src/features/*`, with shared UI in `src/components`, app shell in `src/layouts`, and route pages in `src/pages`.

Flashing and Web Serial are intentionally **not** implemented in this foundation.
