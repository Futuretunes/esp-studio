# Feature: Provisioning Workflow

## Goal

Give Install a clear, mode-based provisioning UX: **Update firmware**, **Reinstall firmware**, and **Factory erase**, with an honest summary of what is erased, preserved, and written — including Manifest V2 filesystem choice and a post-write bootable guarantee.

## Background

Pre-flash inspection and package-kind gating (`complete` vs `application-only`) already prevent blank + app-only installs. Users still needed explicit control over whether an install only overwrites the application, rewrites the full layout, or factory-erases user flash before writing a complete package.

See also:

- [Pre-Flash Firmware Inspection](./pre-flash-inspection.md)
- [Flash Pipeline Robustness](./flash-pipeline-robustness.md)
- [Firmware Manifest](./firmware-manifest.md)
- [Flash UI](./flash-ui.md)
- [One-Click Install](./one-click-install.md)

## Modes

| Mode | Package required | Device | Flash behavior |
| ---- | ---------------- | ------ | -------------- |
| **Update firmware** | `application-only` | Must not be blank | Overwrites application only; preserves bootloader, partitions, NVS, calibration, filesystem |
| **Reinstall firmware** | `complete` | Blank → continue; existing → confirm | Rewrites bootloader, partition table, boot_app0 (when present), application; optional FS layout choice |
| **Factory erase** | `complete` | Any | `eraseAll: true`, then write complete package; requires typing `ERASE` |

Blank + application-only is always a **stop** (blocked), independent of mode.

## Manifest V2

`schemaVersion: 2` adds optional `filesystemSupport`: `"none" | "spiffs" | "littlefs" | "both"`.

- Single value → Install auto-selects that filesystem.
- `"both"` → Reinstall shows SPIFFS / LittleFS radios (default LittleFS).
- Schema `1` documents remain valid; `filesystemSupport` is ignored when absent.

## Bootable guarantee

Install still calls `FlashService.flash` with:

- `verifyAfterWrite: true`
- `resetAfter: true`
- `verifyBootableAfterReset: true`

Factory erase passes `eraseAll: true` from the confirmed provisioning plan. Failures that look non-bootable surface the existing post-flash not-bootable messaging.

## Architecture

```text
FlashPanel / FlashFeature
        │
        ▼
useFlashWorkflow  ── planProvisioningInstall / buildProvisioningSummary
        │
        ▼
FlashService.inspectPreFlash → confirm / stop / continue
        │
        ▼
FlashService.flash({ eraseAll?, verifyBootableAfterReset: true })
```

Pure planners live in `src/features/flash/provisioning-mode.ts` (no hardware).

## Responsibilities

| Component | Responsibility |
| --------- | -------------- |
| `provisioning-mode.ts` | Mode planning + summary helpers |
| `use-flash-workflow.ts` | Mode/FS state, prefer mode from package kind, wire eraseAll |
| `flash-panel.tsx` | Mode selector, FS radios, summary card, typed ERASE |
| Manifest parser/validator | Accept schema 1\|2 + `filesystemSupport` |

## Public Interfaces

```ts
type ProvisioningMode = "update" | "reinstall" | "factory-erase";

planProvisioningInstall(
  mode,
  deviceOutcome,
  packageSummary,
  filesystemChoice?,
): ProvisioningPlan;

buildProvisioningSummary(options): ProvisioningSummary;

resolveProvisioningFilesystem(support, preferred?): ProvisioningFilesystemChoice | null;
```

## Acceptance Criteria

- [x] Three install modes with stop/confirm/continue planning.
- [x] Blank + app-only always blocked.
- [x] Factory erase requires typing `ERASE`; Cancel is default on confirms.
- [x] Reinstall + `filesystemSupport === "both"` shows FS radios.
- [x] `eraseAll` passed through for factory erase; bootable verify retained.
- [x] Unit tests for planners; Manifest V2 parser coverage.

## Future Improvements

- Detect current on-device filesystem for the “Current” summary column.
- ZIP unpack for filesystem uploads (deferred; see filesystem browser notes).
- Per-image filesystem payload selection when packages ship both SPIFFS and LittleFS images.

## TODO Checklist

- [x] Documentation reviewed
- [x] Implementation complete
- [x] Tests added
- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm build` (parent agent)
