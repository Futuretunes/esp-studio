import type { NavItem } from "@/types";

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "Dashboard",
    path: "/",
    description: "Overview of ESP Studio tools and device status",
  },
  {
    id: "devices",
    label: "Devices",
    title: "Connect Device",
    path: "/devices",
    description: "Connect and manage ESP8266 / ESP32 boards",
  },
  {
    id: "flash",
    label: "Flash",
    title: "Flash Firmware",
    path: "/flash",
    description: "Flash firmware images to connected devices",
  },
  {
    id: "firmware",
    label: "Firmware",
    title: "Firmware Library",
    path: "/firmware",
    description: "Browse and manage your firmware library",
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
    description: "Browse and edit device filesystem contents",
  },
  {
    id: "ota",
    label: "OTA",
    title: "OTA Updates",
    path: "/ota",
    description: "Push over-the-air firmware updates",
  },
  {
    id: "settings",
    label: "Settings",
    title: "Settings",
    path: "/settings",
    description: "Configure ESP Studio preferences",
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
