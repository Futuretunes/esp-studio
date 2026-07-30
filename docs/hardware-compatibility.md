# Hardware Compatibility

ESP Studio targets Espressif chips reachable over **Web Serial** in Chromium browsers.

## Supported chip families (identify / flash path)

| Family | Identify | Flash | Filesystem browse | Notes |
| ------ | -------- | ----- | ----------------- | ----- |
| ESP8266 | Yes | Yes | If SPIFFS/LittleFS partition present | Default app offset `0x10000` may not match all 8266 layouts |
| ESP32 | Yes | Yes | Same | Primary target |
| ESP32-S2 | Yes | Yes | Same | |
| ESP32-S3 | Yes | Yes | Same | |
| ESP32-C2 / C3 / C6 / H2 | Mapped when esptool reports | Best-effort | Same | Less field testing |

## Browser

| Environment | Status |
| ----------- | ------ |
| Chrome / Edge / Opera + HTTPS or localhost | Supported |
| Firefox / Safari | Unsupported (no Web Serial) |
| Cursor Cloud Agent VM | No physical UART; UI + unit smoke only |

## Hardware tested (public beta)

| Board / chip | Connect | Identify | Flash (local) | Serial | Filesystem | Tester / date |
| ------------ | ------- | -------- | ------------- | ------ | ---------- | ------------- |
| *(fill before release)* ESP32 DevKit | ☐ | ☐ | ☐ | ☐ | ☐ | |
| *(fill)* ESP32-S3 | ☐ | ☐ | ☐ | ☐ | ☐ | |
| *(fill)* ESP32-S2 | ☐ | ☐ | ☐ | ☐ | ☐ | |
| *(fill)* ESP8266 | ☐ | ☐ | ☐ | ☐ | ☐ | |

> Cloud agent sessions cannot attach USB boards. Mark rows after manual QA on developer hardware before calling beta “hardware verified”.

## Smoke tests (automated)

```bash
pnpm test
```

Covers Device Manager / fake-provider style logic and pure helpers (no Web Serial).
