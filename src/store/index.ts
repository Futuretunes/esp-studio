import { create } from "zustand";

import type {
  ChipFamily,
  DeviceCapabilities,
  DeviceConnectionState,
} from "@/core/device";
import type { AppTheme } from "@/types";

/**
 * UI-facing snapshot of a connected device (no transport objects).
 */
export type DeviceSnapshot = {
  readonly id: string;
  readonly name: string;
  readonly providerId: string;
  readonly providerLabel: string;
  readonly chipFamily: ChipFamily;
  readonly status: DeviceConnectionState;
  readonly transportLabel?: string;
  readonly capabilities: DeviceCapabilities;
};

type UiState = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: AppTheme;
  toggleSidebarCollapsed: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: AppTheme) => void;
};

type DeviceUiState = {
  webSerialSupported: boolean | null;
  isConnecting: boolean;
  isDisconnecting: boolean;
  errorKind: "unsupported" | "cancelled" | "failed" | "disconnect" | null;
  errorMessage: string | null;
  activeDevice: DeviceSnapshot | null;
  setWebSerialSupported: (supported: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setDisconnecting: (disconnecting: boolean) => void;
  setActiveDevice: (device: DeviceSnapshot | null) => void;
  setError: (kind: DeviceUiState["errorKind"], message: string | null) => void;
  clearError: () => void;
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

export const useDeviceStore = create<DeviceUiState>((set) => ({
  webSerialSupported: null,
  isConnecting: false,
  isDisconnecting: false,
  errorKind: null,
  errorMessage: null,
  activeDevice: null,
  setWebSerialSupported: (supported) => {
    set({ webSerialSupported: supported });
  },
  setConnecting: (connecting) => {
    set({ isConnecting: connecting });
  },
  setDisconnecting: (disconnecting) => {
    set({ isDisconnecting: disconnecting });
  },
  setActiveDevice: (device) => {
    set({ activeDevice: device });
  },
  setError: (kind, message) => {
    set({ errorKind: kind, errorMessage: message });
  },
  clearError: () => {
    set({ errorKind: null, errorMessage: null });
  },
}));
