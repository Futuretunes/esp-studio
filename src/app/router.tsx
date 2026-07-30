import { Navigate, Route, Routes } from "react-router-dom";
import type { JSX } from "react";

import { AppLayout } from "@/layouts/app-layout";
import { DashboardPage } from "@/pages/dashboard-page";
import { DevicesPage } from "@/pages/devices-page";
import { DiagnosticsRoutePage } from "@/pages/diagnostics-page";
import { FilesystemPage } from "@/pages/filesystem-page";
import { FirmwarePage } from "@/pages/firmware-page";
import { FlashPage } from "@/pages/flash-page";
import { OtaPage } from "@/pages/ota-page";
import { SerialPage } from "@/pages/serial-page";
import { SettingsPage } from "@/pages/settings-page";

export function AppRouter(): JSX.Element {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="flash" element={<FlashPage />} />
        <Route path="firmware" element={<FirmwarePage />} />
        <Route path="serial" element={<SerialPage />} />
        <Route path="filesystem" element={<FilesystemPage />} />
        <Route path="ota" element={<OtaPage />} />
        <Route path="diagnostics" element={<DiagnosticsRoutePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
