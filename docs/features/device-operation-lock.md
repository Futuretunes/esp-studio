# Feature: Device Operation Lock

## Goal

Guarantee that only one device operation may own the connected device at a time, preventing concurrent esptool/serial use that can corrupt flash.

## Background

Serial Monitor opens `TransportIo` and blocked other tools via `io.state !== "closed"`. Flash, Identify, and Filesystem each created ephemeral `CommunicationSession` instances, so their `acquire()` locks never saw each other. Connect-triggered identify plus Flash/Filesystem could contend on the same UART.

## Architecture

```text
DeviceManager
  └── DeviceOperationLock (per connected device with TransportIo)
        └── CommunicationSession (existing acquire / release / open / close)
              ├── serial-monitor
              ├── chip-identification
              ├── flash-service
              └── filesystem-browser
```

No second ownership model. `DeviceOperationLock` is a thin device-scoped holder around the existing `CommunicationSession` APIs. Claim fails immediately when another owner is active (`CommunicationOwnershipError`). Release in `finally`; disconnect force-disposes the lock (never leaves stale ownership).

UI mirrors `ownerId` via `DeviceManager.subscribeOperationOwner` → Zustand `operationOwner` for cross-page busy alerts.

## Responsibilities

| Component | Responsibility |
| --------- | -------------- |
| `DeviceOperationLock` | Wrap session; `claim` / `release` / `dispose` |
| `DeviceManager` | One lock per connected device; clear on disconnect |
| Flash / Identify / Filesystem / Serial | Claim shared lock; never `new CommunicationSession(io)` |
| `formatDeviceBusyMessage` | User-facing busy copy |
| Device store `operationOwner` | Cross-page busy visibility |

## Public Interfaces

```ts
class DeviceOperationLock {
  readonly session: CommunicationSession;
  get ownerId(): CommunicationOwnerId | null;
  claim(ownerId: CommunicationOwnerId): CommunicationLock;
  release(lock: CommunicationLock): void;
  dispose(): Promise<void>;
}

// DeviceManager
getOperationLock(deviceId): DeviceOperationLock
getOperationOwner(deviceId): CommunicationOwnerId | null
subscribeOperationOwner(listener): () => void
```

## Dependencies

| Dependency | Required? | Notes |
| ---------- | --------- | ----- |
| `CommunicationSession` | yes | Source of truth for ownership |
| Existing owner id constants | yes | No new owner strings |

Forbidden: parallel lock registries, queued claims, browser APIs in core.

## Acceptance Criteria

- [x] One owner at a time across Flash / Identify / Filesystem / Serial
- [x] Claim fails immediately when busy; clear user messages; no silent failure; no queue
- [x] Release in `finally`; disconnect clears ownership
- [x] Busy visible across pages
- [x] Unit tests for cross-owner cases + release paths
- [x] Flash catalog error + Retry (not infinite skeleton)
- [x] Light-theme status contrast tokens
- [x] `pnpm lint` / `typecheck` / `test` / `build`

## Future Improvements

- Abort in-flight esptool when ownership is force-cleared on disconnect
- Mid-flash cancel UX

## TODO Checklist

- [x] Documentation reviewed
- [x] Interfaces designed
- [x] Implementation complete
- [x] Tests added
- [x] Quality gates
- [x] Roadmap updated
