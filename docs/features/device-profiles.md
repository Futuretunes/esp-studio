# Feature: Device Profiles

## Goal

ESP Studio remains a **generic** ESP8266 / ESP32 tool. Device Profiles add an optional richer experience when firmware can be recognised, without replacing Flash, Filesystem, Serial, Diagnostics, or Provisioning.

A connected board always works **without** a specialised profile — Generic ESP is always available.

## Background

Provisioning and Flash pipelines are frozen for this milestone. Profiles are a **compiled-in registry** that contributes dashboard cards, actions, and labels. They intentionally look like a future Plugin SDK surface without introducing a runtime plugin loader yet.

See also:

- [Device Discovery](./device-discovery.md)
- [ESP Identification](./esp-identification.md)
- [Provisioning Workflow](./provisioning-workflow.md)
- [Device Diagnostics](./device-diagnostics.md)
- [Current roadmap](../roadmap/current.md)

## Architecture

```text
Devices page
   │
   ▼
useMatchedDeviceProfile
   │  DeviceManager metadata + recent Firmware Library ids
   ▼
resolveDeviceProfile(registry)
   │
   ├─ Sentinel Node / WLED / ESPHome / Tasmota / OMG (placeholders)
   └─ Generic ESP Device (priority 0, always matches)
   │
   ▼
DeviceDashboard (cards + actions → existing routes)
```

No new service layer. Profiles do **not** own Web Serial, FlashService, or FilesystemService.

## Profile API

```ts
type DeviceProfile = {
  id: string;
  name: string;
  icon: LucideIcon;
  priority: number;
  match(context: DeviceProfileMatchContext): boolean;
  dashboardCards(context): DeviceProfileDashboardCard[];
  deviceActions(context): DeviceProfileAction[];
  settingsSections(context): DeviceProfileSettingsSection[];
  diagnostics(context): DeviceProfileDiagnosticsSection[];
  filesystemActions(context): DeviceProfileFilesystemAction[];
};
```

Profiles are registered in `DEVICE_PROFILES` (`src/features/profiles/registry.ts`).

## Matching strategy

`DeviceProfileMatchContext` includes:

- `chipFamily`
- `metadata` (`espToolChipName`, `espToolFlashSize`, optional `firmwareProjectId` / `firmwareName` / `firmwareVersion` / `filesystemFormat`)
- `recentFirmwareIds` (Firmware Library localStorage)

Rules:

1. Collect all profiles where `match(context)` is true.
2. Sort by **priority** descending.
3. Pick the first; Generic ESP (`priority: 0`) always matches as fallback.

Placeholder firmware profiles match when:

- `metadata.firmwareProjectId` equals the built-in catalog id, **or**
- that id appears in recent Firmware Library usage, **or**
- `metadata.firmwareName` contains a known name token.

Never invent on-device firmware identity.

## Capabilities

| Contribution | Behaviour |
| ------------ | --------- |
| Dashboard cards | Device overview fields + CTAs |
| Device actions | Links to `/serial`, `/filesystem`, `/flash`, `/diagnostics` |
| Settings sections | Descriptive placeholders (no duplicate Settings UI) |
| Diagnostics | Extra fact lines (profile name, known metadata) |
| Filesystem actions | Link into existing Filesystem page |

## Built-in profiles

| Id | Name | Priority | Status |
| -- | ---- | -------- | ------ |
| `generic-esp` | Generic ESP Device | 0 | Full generic sections |
| `sentinel-node` | Sentinel Node | 50 | Placeholder |
| `wled` | WLED | 40 | Placeholder |
| `esphome` | ESPHome | 40 | Placeholder |
| `tasmota` | Tasmota | 40 | Placeholder |
| `openmqttgateway` | OpenMQTTGateway | 35 | Placeholder |

Generic ESP sections: General, Flash, Filesystem, Serial, Diagnostics, Provisioning.

## UI

- Navigation unchanged (`/devices`).
- Connected device view becomes a **Device Dashboard** fed by the matched profile.
- Profile status badge: **Matched profile** vs **Generic profile**.

## Future plugin model (no redesign required)

1. Keep the `DeviceProfile` interface stable.
2. Later, load additional profile modules (dynamic import or host SDK) into the same registry array.
3. OTA, NVS Manager, and richer dashboards become **profile contributions** (extra cards/actions) that call existing services.
4. Plugin SDK = document how to implement `DeviceProfile` + register; core remains generic.

## Acceptance Criteria

- [x] Profile registry + Generic ESP profile
- [x] Placeholder profiles for Sentinel / WLED / ESPHome / Tasmota / OMG
- [x] Devices page dashboard with profile status
- [x] Board works without a specialised match (Generic fallback)
- [x] Docs: `docs/features/device-profiles.md`
- [x] `pnpm lint` / `typecheck` / `test` / `build`

## TODO Checklist

- [x] Documentation reviewed
- [x] Implementation complete
- [x] Tests added
- [x] Quality gates
