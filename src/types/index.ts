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
