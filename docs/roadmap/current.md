# Current Focus

**Active milestone:** Transport IO Layer — implementation complete

## Completed

1. `docs/features/transport-io.md`
2. Core `TransportIo` (`open` / `close` / `read` / `write` / `flush`, `Uint8Array` only)
3. `DeviceConnection.io?` additive optional link
4. `WebSerialTransportIo` + `WebSerialConnection.io`

## Still out of scope

- Serial Monitor UI / ANSI / logging / line buffering
- Flash Engine / packet parsers
- Auto-reconnect

## Next up

**Serial Monitor** — document first, then build a minimal console that opens `connection.io`, decodes UTF-8 for display only, and writes user input as bytes. Do not put framing/ANSI in the transport layer.

## Related documents

- [Transport IO feature](../features/transport-io.md)
- [Web Serial feature](../features/web-serial.md)
- [Backlog](./backlog.md)
