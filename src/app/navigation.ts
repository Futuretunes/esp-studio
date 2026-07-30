import type { NavItem } from "@/types";

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "Dashboard",
    path: "/",
    description: "Overview of ESP Studio tools — connect, flash, monitor, and manage boards",
  },
  {
    id: "devices",
    label: "Devices",
    title: "Connect Device",
    path: "/devices",
    description: "Connect ESP8266 / ESP32 boards over Web Serial",
  },
  {
    id: "firmware",
    label: "Firmware",
    title: "Firmware Library",
    path: "/firmware",
    description: "Browse popular firmware and start one-click install",
  },
  {
    id: "flash",
    label: "Flash",
    title: "Install Firmware",
    path: "/flash",
    description: "Connect a device, choose a project, then install firmware",
  },
  {
    id: "serial",
    label: "Serial",
    title: "Serial Monitor",
    path: "/serial",
    description: "Monitor serial output from connected devices",
  },
  {
    id: "filesystem",
    label: "Filesystem",
    title: "Filesystem",
    path: "/filesystem",
    description: "Browse, upload, and download files on the device",
  },
  {
    id: "ota",
    label: "OTA",
    title: "OTA Updates",
    path: "/ota",
    description: "Not available in this beta — network OTA is planned later",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    title: "Diagnostics",
    path: "/diagnostics",
    description: "Inspect connection and environment facts, then export a support report",
  },
  {
    id: "settings",
    label: "Settings",
    title: "Settings",
    path: "/settings",
    description: "Theme and about information for this session",
  },
] as const;

export function getNavItemByPath(pathname: string): NavItem | undefined {
  if (pathname === "/") {
    return NAV_ITEMS.find((item) => item.id === "dashboard");
  }

  return NAV_ITEMS.find(
    (item) => item.path !== "/" && pathname.startsWith(item.path),
  );
}
