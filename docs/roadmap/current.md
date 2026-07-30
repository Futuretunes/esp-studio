# Current Focus

**Active milestone:** Device Layer (Core) — implementation complete, awaiting CI verification on the branch.

## Why this first

Web Serial is deliberately **not** the first implementation. ESP Studio needs a stable, transport-agnostic Device Layer so Web Serial, WebUSB, Bluetooth, and Network providers can plug in without rewriting consumers (UI, Flash Engine, Serial Monitor, plugins).

## Completed in this milestone

1. Documentation for architecture, Device Layer, roadmap, and feature template.
2. Implementation of `src/core/device` contracts and `DeviceManager`.
3. No browser transport APIs, no Web Serial, no WebUSB.

## Out of scope (still)

- Concrete transport providers
- Flashing / esptool-js
- Serial Monitor streaming
- Plugin host runtime
- Full UI migration onto `DeviceManager`

## Exit criteria

- Docs listed in the feature request exist and describe a maintainable architecture.
- `src/core/device` exports a stable public API.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.
- Future providers can be added by implementing `DeviceProvider` and registering with `DeviceManager`.

## Next up

**Web Serial provider** — document first (`docs/features/web-serial.md`), then implement `src/providers/web-serial` as a `DeviceProvider`.

## Related documents

- [Backlog](./backlog.md)
- [Device Layer feature spec](../features/device-layer.md)
- [Device Layer architecture](../architecture/device-layer.md)
