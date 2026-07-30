# Current Focus

**Active milestone:** Communication Session — implementation complete

## Completed

1. `docs/features/communication-session.md`
2. `CommunicationSession` + `CommunicationLock` (+ typed errors)
3. Exclusive ownership and read/write mutexes over `TransportIo`
4. Raw `Uint8Array` forwarding only

## Still out of scope

- Serial Monitor UI / UTF-8 / ANSI / logging
- Flash Engine / protocol parsing / line buffering

## Next up

**Serial Monitor** — document first, then a minimal console that acquires `CommunicationSession` ownership, streams bytes, and decodes UTF-8 only in the UI.

## Related documents

- [Communication Session feature](../features/communication-session.md)
- [Transport IO feature](../features/transport-io.md)
- [Backlog](./backlog.md)
