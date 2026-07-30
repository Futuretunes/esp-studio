import {
  Cable,
  Cpu,
  FolderTree,
  HardDriveDownload,
  LayoutDashboard,
  Library,
  Radio,
  Settings,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import type { NavItemId } from "@/types";

export const NAV_ICONS: Record<NavItemId, LucideIcon> = {
  dashboard: LayoutDashboard,
  devices: Cpu,
  flash: HardDriveDownload,
  firmware: Library,
  serial: Cable,
  filesystem: FolderTree,
  ota: Radio,
  diagnostics: Stethoscope,
  settings: Settings,
};
