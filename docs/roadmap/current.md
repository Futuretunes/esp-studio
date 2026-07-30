# Current Focus

**Active milestone:** Web Serial provider — implementation complete

## Completed

1. `docs/features/web-serial.md`
2. Minimal `WebSerialProvider` + `WebSerialConnection` under `src/providers/web-serial`
3. Additive Device Layer helpers: `connectToDevice`, optional `baudRate`

## Still out of scope

- Flashing / esptool-js
- Serial Monitor streaming and parsing
- Auto-reconnect
- Devices UI wiring
- WebUSB / Bluetooth / Network providers

## Next up

**Device Discovery UX** — wire `DeviceManager` + `WebSerialProvider` into the Devices feature (user-gesture connect flow), then Flash Engine.

## Related documents

- [Web Serial feature](../features/web-serial.md)
- [Device Layer feature](../features/device-layer.md)
- [Backlog](./backlog.md)
