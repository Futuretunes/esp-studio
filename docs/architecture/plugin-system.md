# Plugin System Architecture

## Purpose

ESP Studio will support a plugin system so third parties and first-party modules can extend firmware installers, device tools, editors, and UI contributions without forking the core.

This document describes the **target** architecture. The plugin host is not implemented yet; Device Layer ships first so plugins can later target a stable device contract.

## Goals

- Installable firmware plugins (install flows, board profiles, asset sources).
- Tool plugins (serial filters, filesystem helpers, OTA strategies).
- UI contributions (routes, sidebar items, panels) declared via manifests.
- Clear security and versioning boundaries.

## Non-goals (for now)

- Arbitrary remote code execution without review.
- Hot-loading unsigned plugins in production.
- Coupling plugins to a specific transport (Web Serial, etc.).

## Conceptual model

```text
┌──────────────────┐     manifest      ┌─────────────────┐
│  Plugin package  │ ───────────────►  │  Plugin Host    │
│  (JS module)     │                   │  (core/plugins) │
└────────┬─────────┘                   └────────┬────────┘
         │ contributes                          │ exposes
         ▼                                      ▼
   FirmwareInstaller                   DeviceManager
   SerialTransform                     FlashEngine
   UiContribution                      EventBus
```

## Manifest (planned)

```ts
type PluginManifest = {
  id: string;
  name: string;
  version: string;
  apiVersion: string;
  contributions: {
    firmwareInstallers?: string[];
    deviceTools?: string[];
    routes?: string[];
  };
};
```

Exact schema will be locked when `src/core/plugins` is implemented.

## Host responsibilities

| Responsibility | Description                                           |
| -------------- | ----------------------------------------------------- |
| Discovery      | Load manifests from configured plugin sources         |
| Validation     | Enforce API version and permission declarations       |
| Registration   | Wire contributions into core registries               |
| Lifecycle      | Activate / deactivate plugins cleanly                 |
| Isolation      | Prevent plugins from importing private core internals |

## Extension points (planned)

1. **Firmware installers** — package and flash workflows for popular firmwares.
2. **Device tools** — post-connect utilities that consume `Device`.
3. **Serial transforms** — parsers / highlighters for Serial Monitor.
4. **UI contributions** — optional feature routes and sidebar entries.
5. **Adapters** — bridges to ESP Web Tools or other installers.

## Relationship to Device Layer

Plugins that talk to hardware must use the Device Layer public API:

- `DeviceManager`
- `Device`
- `DeviceConnection`
- `DeviceCapabilities`

Plugins must not open Web Serial / WebUSB ports directly if a registered provider already owns that transport. This preserves a single connection owner and avoids port contention.

## Relationship to other modules

| Module           | Plugin interaction                        |
| ---------------- | ----------------------------------------- |
| Flash Engine     | Invokes firmware installer contributions  |
| Firmware Library | Indexes plugin-provided catalog entries   |
| Serial Monitor   | Applies serial transform contributions    |
| IDE / Monaco     | Optional language / snippet contributions |
| OTA              | Optional network update strategies        |

## Security principles

- Default deny: plugins declare required capabilities.
- Prefer reviewed first-party plugins for v1.0.
- Never grant plugins unrestricted access to all providers.
- Persist only allowlisted settings keys per plugin id.

## Implementation phases

1. Stabilize Device Layer contracts (current).
2. Introduce Flash Engine + Firmware Plugin contribution point.
3. Ship Plugin Host MVP with static registration.
4. Add manifest loading and UI contributions.
5. Document public plugin API for external authors.

## Related documents

- [Architecture overview](./overview.md)
- [Device Layer architecture](./device-layer.md)
- [Roadmap backlog](../roadmap/backlog.md)
