# Feature: Public Beta Hardening

## Goal

Improve reliability, diagnostics, and UX consistency across the existing ESP Studio feature set so the product is ready for a public beta. No major new functionality.

## Background

Core platform features (Devices, Flash/One-click Install, Serial, Filesystem, Firmware catalog providers) are feature-complete. Remaining risk is operational: unexpected disconnects, permission revocation, inconsistent alerts/empty states, missing retry paths, and stale product copy.

See also:

- [Web Serial](./web-serial.md)
- [Device Discovery](./device-discovery.md)
- [Flash UI](./flash-ui.md)
- [Serial Monitor](./serial-monitor.md)
- [Filesystem Browser](./filesystem-browser.md)
- [Current roadmap](../roadmap/current.md)
- [Hardware compatibility](../hardware-compatibility.md)

## Reliability improvements

| Area | Change |
| ---- | ------ |
| Unexpected unplug / revoke | Listen for Web Serial `disconnect`; mark connection disconnected |
| UI sync | Watch active device connection state; clear snapshot + friendly “lost” alert |
| Serial stream EOF | Stop monitor cleanly; allow restart; surface loss when port is gone |
| Provider hygiene | Drop remembered ports that fire disconnect |
| Failed ops | In-alert **Retry** / **Reconnect** where actions already exist |
| Busy ops | Link to Serial Monitor to stop exclusive ownership |

## Error reporting

- Typed store `errorKind` includes `"lost"` for unexpected disconnect.
- Pages keep Alert variants: `warning` / `info` / `destructive`.
- Prefer actionable copy (“Reconnect on Devices”, “Stop Serial Monitor”).

## Hardware compatibility

Documented matrix in [hardware-compatibility.md](../hardware-compatibility.md). Cloud/agent environments typically lack physical boards; CI smoke tests cover domain logic without hardware.

## Browser compatibility

| Browser | Web Serial | Notes |
| ------- | ---------- | ----- |
| Chrome / Edge / Opera | Yes | Primary target (HTTPS or localhost) |
| Firefox / Safari | No | Unsupported alert on Devices / tools |

## Acceptance Criteria

- [x] Feature doc + hardware notes.
- [x] Unexpected disconnect updates connection state and UI.
- [x] Consistent alerts / empty / loading / retry across Devices, Flash, Serial, Filesystem.
- [x] Stale “flashing deferred” copy removed from Dashboard / placeholders / README.
- [x] Practical smoke tests (`pnpm test`) for core helpers.
- [x] `pnpm lint` / `typecheck` / `build` pass.

## Future Improvements

- Auto-reconnect (opt-in).
- Playwright e2e without hardware (nav + unsupported alerts).
- AbortController cancellation mid-flash.

## TODO Checklist

- [x] Documentation reviewed
- [x] Implementation complete
- [x] `pnpm lint` / `pnpm typecheck` / `pnpm build` / `pnpm test` pass
- [x] Roadmap updated

## Architecture decisions

- No new abstraction layers: extend existing Web Serial connection/provider, Zustand `errorKind`, and page alerts.
- Unexpected loss is detected via Chromium `SerialPort` `"disconnect"` plus a lightweight UI watchdog that clears `activeDevice` and sets `errorKind: "lost"`.
- Smoke tests use Vitest in Node (fake `DeviceProvider` + pure helpers); physical board QA remains a manual checklist in `docs/hardware-compatibility.md`.

## Public beta checklist

- [ ] Manual hardware matrix filled (ESP8266 / ESP32 / S2 / S3) on developer machines
- [ ] Chromium smoke: connect → identify → flash local → serial → filesystem
- [ ] Unsupported-browser path verified in Firefox/Safari (alerts only)
- [ ] No dead-end alerts (Retry / Reconnect / Open Serial / Open Devices)
- [ ] `pnpm lint` / `typecheck` / `test` / `build` green on release candidate

## Remaining blockers before beta

- Hardware verification rows in `docs/hardware-compatibility.md` (cloud agents cannot attach UART)
- Optional: mid-flash cancellation UX (AbortController plumbing exists partially elsewhere)
- Dedicated Firmware Library page shipped (`/firmware`); OTA remains deferred
