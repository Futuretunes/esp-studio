# ESP Studio — Version Roadmap

Canonical product version sequence after architecture freeze.

| Version | Theme | Status |
| ------- | ----- | ------ |
| **v0.9.0-beta.1** | Public Beta | 🟡 RC / tagging |
| **v0.9.1** | Bug fixes · Hardware compatibility · Performance | ⬜ next |
| **v0.10** | OTA | ⬜ |
| **v0.11** | NVS | ⬜ |
| **v0.12** | Partition Manager | ⬜ |
| **v0.13** | Monaco IDE | ⬜ |
| **v1.0** | Stable | ⬜ |

---

## v0.9.0-beta.1 — Public Beta

Ships (or is ready to tag):

- ✔ Flash
- ✔ Library
- ✔ Filesystem
- ✔ Diagnostics
- ✔ Deployment

Release notes: [v0.9.0-beta.1](../releases/v0.9.0-beta.1.md)

No new product features in this line — quality and supportability only until the tag ships.

## v0.9.1 — Stabilization

- Bug fixes from beta feedback
- Hardware compatibility matrix fill-in and identify/flash smoke on real boards
- Performance polish (bundle, flash UX responsiveness, no architectural changes)

## v0.10 — OTA

Network over-the-air firmware update flows (replaces the current OTA placeholder).

## v0.11 — NVS

Non-volatile storage browse / edit workflows.

## v0.12 — Partition Manager

Partition table inspection and management.

## v0.13 — Monaco IDE

In-browser editing shell (Monaco).

## v1.0 — Stable

API freeze for Device Layer + Flash Engine, documented contracts, hardware-verified transports, production-hardened release.

---

## Rules

- Architecture remains frozen through **v0.9.1** unless a bug requires a minimal contract fix.
- New product surfaces start at **v0.10+**, each with a docs-first feature doc before code.
- Do not reorder major themes without updating this file and [current.md](./current.md).

## Related

- [Current focus](./current.md)
- [Feature backlog](./backlog.md)
- [Hardware compatibility](../hardware-compatibility.md)
