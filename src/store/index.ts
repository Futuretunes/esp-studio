import { create } from "zustand";

import type { AppTheme, ConnectedDevice } from "@/types";

type UiState = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: AppTheme;
  toggleSidebarCollapsed: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: AppTheme) => void;
};

type DeviceState = {
  activeDevice: ConnectedDevice | null;
  setActiveDevice: (device: ConnectedDevice | null) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  theme: "dark",
  toggleSidebarCollapsed: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },
  setMobileSidebarOpen: (open) => {
    set({ mobileSidebarOpen: open });
  },
  setTheme: (theme) => {
    set({ theme });
  },
}));

export const useDeviceStore = create<DeviceState>((set) => ({
  activeDevice: null,
  setActiveDevice: (device) => {
    set({ activeDevice: device });
  },
}));
