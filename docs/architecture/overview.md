# ESP Studio Architecture Overview

## Purpose

ESP Studio is a browser-based development environment for ESP8266 and ESP32 devices. The architecture is modular: every major capability is expressed as a replaceable module behind stable interfaces so providers (Web Serial, WebUSB, network OTA, plugins) can evolve independently.

## Design principles

1. **Interfaces over implementations** — consumers depend on contracts, never on concrete transports.
2. **Dependency injection** — modules receive collaborators; they do not import browser globals or hard-wire providers.
3. **Replaceable modules** — any module (device transport, flash engine, editor, plugin host) can be swapped without rewriting callers.
4. **No premature browser coupling** — core packages must remain free of Web Serial, WebUSB, and other browser APIs until a dedicated provider module owns that concern.
5. **Feature-based UI, core-based domain** — React features live under `src/features/*`; durable domain contracts live under `src/core/*`.

## High-level module map

```text
┌─────────────────────────────────────────────────────────────┐
│                        UI (React)                           │
│  features/  pages/  layouts/  components/                   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     Application services                    │
│  stores · query hooks · feature services                    │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                         Core domain                         │
│  device/ · flash/ · firmware/ · serial/ · filesystem/ · ota │
└───────┬──────────┬──────────┬──────────┬──────────┬─────────┘
        │          │          │          │          │
   providers   providers  plugins   editors    network
  (WebSerial) (WebUSB)  (firmware) (Monaco)   (OTA)
```

## Planned capabilities

| Capability         | Owning module (planned)              | Notes                                           |
| ------------------ | ------------------------------------ | ----------------------------------------------- |
| Device abstraction | `src/core/device`                    | First real core feature; transport-agnostic     |
| Transport IO       | `src/core/transport`                 | Raw `Uint8Array` streams for any transport      |
| Web Serial         | `src/providers/web-serial`           | Implements `DeviceProvider` + `TransportIo`     |
| WebUSB             | `src/providers/web-usb`              | Implements `DeviceProvider`                     |
| Bluetooth          | `src/providers/bluetooth`            | Future `DeviceProvider`                         |
| Network devices    | `src/providers/network`              | Future `DeviceProvider` for OTA targets         |
| Flash engine       | `src/core/flash`                     | Uses device connection + esptool-js adapter     |
| esptool-js         | `src/adapters/esptool`               | Isolated adapter; never imported by UI directly |
| ESP Web Tools      | `src/adapters/esp-web-tools`         | Optional install UX adapter                     |
| Firmware plugins   | `src/core/plugins` + plugin packages | Installable firmware installers                 |
| Firmware library   | `src/core/firmware`                  | Catalog / metadata / artifacts                  |
| Serial Monitor     | `src/core/serial` + UI feature       | Streams from device connection                  |
| Filesystem browser | `src/core/filesystem`                | SPIFFS / LittleFS operations                    |
| OTA                | `src/core/ota`                       | Network update orchestration                    |
| Monaco Editor      | `src/features/ide`                   | Editor shell; language services pluggable       |
| Plugin system      | `src/core/plugins`                   | Host + manifest + sandbox boundaries            |

## Layering rules

| Layer              | May depend on                           | Must not depend on                                |
| ------------------ | --------------------------------------- | ------------------------------------------------- |
| `src/core/*`       | Other core interfaces, pure TypeScript  | React, DOM, Web Serial, WebUSB, Vite runtime APIs |
| `src/providers/*`  | Core interfaces + browser APIs they own | UI components, unrelated providers                |
| `src/adapters/*`   | Core interfaces + third-party SDKs      | UI components                                     |
| `src/features/*`   | Core public APIs, UI primitives, stores | Provider internals                                |
| `src/components/*` | UI primitives only                      | Core providers, adapters                          |

## Dependency injection

Runtime composition happens at the application boundary (for example in `src/app/providers.tsx` or a dedicated composition root):

1. Construct concrete providers (when available).
2. Register them with `DeviceManager` (and future managers).
3. Expose manager instances to UI via React context or thin hooks.

This keeps core modules testable with fake providers and keeps browser APIs out of unit tests for domain logic.

## Evolution strategy

1. **Foundation** — UI shell, routing, tooling (done).
2. **Device Layer** — transport-agnostic contracts and manager (done).
3. **Providers & engines** — Web Serial (done), Transport IO (current), flash, serial monitor, filesystem, OTA.
4. **Extensibility** — firmware plugins, library, IDE, public plugin API.
5. **Release v1.0** — documented, tested, replaceable modules with at least one production transport.

## Related documents

- [Device Layer architecture](./device-layer.md)
- [Plugin system](./plugin-system.md)
- [Device Layer feature spec](../features/device-layer.md)
- [Web Serial feature](../features/web-serial.md)
- [Transport IO feature](../features/transport-io.md)
- [Roadmap backlog](../roadmap/backlog.md)
- [Current focus](../roadmap/current.md)
