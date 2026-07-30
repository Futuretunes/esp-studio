# Current Focus

**Active milestone:** Serial Monitor (Minimal) — implementation complete

## Completed

1. `docs/features/serial-monitor.md`
2. Live UTF-8 output with auto-scroll
3. Send text via TextEncoder
4. Connect if needed / Disconnect / Clear
5. `CommunicationLock` owner `"serial-monitor"` acquired and released on stop

## Still out of scope

ANSI, terminal emulation, logging, timestamps, filters, hex mode, themes, line endings, history, macros, flashing, filesystem, OTA

## Next up

**Flash Engine** — document first. Must acquire `"flash-engine"` ownership and cannot run while Serial Monitor holds the session lock.

## Related documents

- [Serial Monitor feature](../features/serial-monitor.md)
- [Communication Session](../features/communication-session.md)
- [Backlog](./backlog.md)
