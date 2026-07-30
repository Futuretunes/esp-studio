# Feature: Flash Pipeline Robustness

## Goal

Make Install Firmware robust for blank ESP devices and devices that already run firmware by classifying the **selected package** (complete vs application-only) and the **target flash** (blank / existing / unknown / failed), then choosing a safe flash strategy.

Architecture stays frozen: reuse `FlashService`, `EspToolAdapter`, Identify metadata, and existing pre-flash inspection helpers. No new service layers.

See also:

- [Pre-Flash Firmware Inspection](./pre-flash-inspection.md)
- [Firmware Manifest](./firmware-manifest.md)
- [Flash UI](./flash-ui.md)
- [Flash Service](./flash-service.md)

## Distinguishing cases

| Signal | How ESP Studio decides |
| ------ | ---------------------- |
| Blank ESP | All sampled regions (`0x0`, `0x1000`, `0x10000`) are `0xFF` |
| Existing firmware | Any sampled region starts with ESP image magic `0xE9` |
| Unknown / failed inspection | Non-blank without magic, or read/connect failure |
| Complete package | Explicit `packageKind: "complete"` **or** images include a bootloader role (+ application / layout parts) from labels/ids/filenames |
| Application-only | Explicit `packageKind: "application-only"` **or** no bootloader role (local `.bin` / GitHub generated assets) |

Addresses always come from the resolved images / manifest — Flash does **not** hardcode chip-specific write addresses beyond the historical local default for unlabeled single bins (`DEFAULT_APP_FLASH_ADDRESS`).

## Flash strategy

| Device | Package | Action |
| ------ | ------- | ------ |
| Blank | Application-only | **STOP** — cannot boot without bootloader/partitions |
| Blank | Complete | Continue (info notice) — write all required images |
| Existing / unknown / failed | Application-only | Confirm (Cancel default) — preserve bootloader/partitions, write app only |
| Existing / unknown / failed | Complete | Confirm (Cancel default) — overwrite layout |

## Post-flash verification

After MD5 verify + reset, re-enter the bootloader and sample written bootloader/application addresses for `0xE9`. If missing, fail with the not-bootable message (do not report success).

## UI

Install Summary shows firmware type and a checklist of images that will be written. Overwrite confirmation shows current chip/flash size and new package type.
