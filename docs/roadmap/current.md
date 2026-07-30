# Current Focus

**Active milestone:** ESP Identification

## Why this next

Flash Engine needs a real chip identity. Identification must run under exclusive `CommunicationSession` ownership, keep `esptool-js` behind an adapter, and update Device + Devices UI—without implementing flashing yet.

## In scope

1. `docs/features/esp-identification.md`
2. `src/adapters/esptool` chip detect adapter
3. `src/features/identification` orchestration
4. Devices UI chip label (`Chip: ESP32-S3` / `Unknown`)
5. Additive `DeviceManager.updateDeviceInfo`

## Out of scope

Firmware flashing, erase, write, verify, filesystem, OTA, firmware library

## Next up

**Flash Engine** — reuse the esptool adapter boundary; acquire `"flash-engine"` ownership.

## Related documents

- [ESP Identification](../features/esp-identification.md)
- [Communication Session](../features/communication-session.md)
- [Backlog](./backlog.md)
