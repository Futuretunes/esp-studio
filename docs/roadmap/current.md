# Current Focus

**Active milestone:** Device Discovery UI — implementation complete

## Completed

1. `docs/features/device-discovery.md`
2. `DeviceManager` + `WebSerialProvider` registered in `AppProviders`
3. Devices page: support detection, Connect Device (user gesture), status card, disconnect
4. Friendly unsupported / cancelled / failed messages

## Still out of scope

- Serial read/write streaming
- Flashing / esptool-js
- Serial Monitor parsing/UI
- OTA / filesystem
- Auto-reconnect / background scanning

## Next up

Define a transport-agnostic IO contract on (or beside) `DeviceConnection`, then **Serial Monitor** — or **Flash Engine** if flashing is prioritized first. Serial Monitor is the natural follow-on while a device session is already visible in the UI.

## Related documents

- [Device Discovery feature](../features/device-discovery.md)
- [Web Serial feature](../features/web-serial.md)
- [Backlog](./backlog.md)
