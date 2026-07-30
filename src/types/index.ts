export type DeviceConnectionStatus =
  "disconnected" | "connecting" | "connected" | "error";

export type EspChipFamily =
  "esp8266" | "esp32" | "esp32-s2" | "esp32-s3" | "esp32-c3" | "unknown";

export type ConnectedDevice = {
  id: string;
  name: string;
  chipFamily: EspChipFamily;
  status: DeviceConnectionStatus;
  portLabel?: string;
};

export type AppTheme = "dark" | "light" | "system";

export type NavItemId =
  | "dashboard"
  | "devices"
  | "flash"
  | "firmware"
  | "serial"
  | "filesystem"
  | "ota"
  | "diagnostics"
  | "settings";

export type NavItem = {
  id: NavItemId;
  label: string;
  title: string;
  path: string;
  description: string;
};
