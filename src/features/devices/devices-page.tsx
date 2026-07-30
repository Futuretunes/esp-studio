import { useEffect, useCallback, type JSX } from "react";

import { useDeviceManager } from "@/app/device-context";
import { DeviceBusyBanner } from "@/components/device-busy-banner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DeviceError } from "@/core/device";
import { DeviceDiscoveryPanel } from "@/features/devices/device-discovery-panel";
import { toDeviceSnapshot } from "@/features/devices/to-device-snapshot";
import { DeviceDashboard } from "@/features/profiles/device-dashboard";
import { useMatchedDeviceProfile } from "@/features/profiles/use-matched-device-profile";
import { useChipIdentification } from "@/features/identification/use-chip-identification";
import {
  isWebSerialSupported,
  WEB_SERIAL_PROVIDER_ID,
  WebSerialProvider,
} from "@/providers/web-serial";
import { useDeviceStore } from "@/store";

function isCancellationError(error: unknown): boolean {
  if (!(error instanceof DeviceError)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("cancelled") || message.includes("canceled");
}

/**
 * Devices feature: Web Serial discovery, connection status, and chip identity.
 */
export function DevicesFeature(): JSX.Element {
  const manager = useDeviceManager();
  const webSerialSupported = useDeviceStore((s) => s.webSerialSupported);
  const isConnecting = useDeviceStore((s) => s.isConnecting);
  const isDisconnecting = useDeviceStore((s) => s.isDisconnecting);
  const activeDevice = useDeviceStore((s) => s.activeDevice);
  const errorKind = useDeviceStore((s) => s.errorKind);
  const errorMessage = useDeviceStore((s) => s.errorMessage);
  const setWebSerialSupported = useDeviceStore((s) => s.setWebSerialSupported);
  const setConnecting = useDeviceStore((s) => s.setConnecting);
  const setDisconnecting = useDeviceStore((s) => s.setDisconnecting);
  const setActiveDevice = useDeviceStore((s) => s.setActiveDevice);
  const setError = useDeviceStore((s) => s.setError);
  const clearError = useDeviceStore((s) => s.clearError);
  const { isIdentifying, identifyError, runIdentification } =
    useChipIdentification();
  const matchedProfile = useMatchedDeviceProfile();

  useEffect(() => {
    const supported = isWebSerialSupported();
    setWebSerialSupported(supported);
    if (!supported) {
      setError("unsupported", "Web Serial is not available in this browser.");
    }
  }, [setError, setWebSerialSupported]);

  const handleConnect = useCallback(async () => {
    clearError();

    if (!isWebSerialSupported()) {
      setWebSerialSupported(false);
      setError("unsupported", "Web Serial is not available in this browser.");
      return;
    }

    setConnecting(true);

    try {
      const provider = manager.getProvider(WEB_SERIAL_PROVIDER_ID);
      const device = await manager.connect(WEB_SERIAL_PROVIDER_ID);
      setActiveDevice(
        toDeviceSnapshot(device, provider?.label ?? "Web Serial"),
      );
      void runIdentification(device.id);
    } catch (error) {
      setActiveDevice(null);

      if (isCancellationError(error)) {
        setError("cancelled", "No device was selected in the browser chooser.");
      } else {
        const detail =
          error instanceof Error ? error.message : "Unknown connection error.";
        setError("failed", detail);
      }
    } finally {
      setConnecting(false);
    }
  }, [
    clearError,
    manager,
    runIdentification,
    setActiveDevice,
    setConnecting,
    setError,
    setWebSerialSupported,
  ]);

  const handleDisconnect = useCallback(async () => {
    if (!activeDevice) {
      return;
    }

    clearError();
    setDisconnecting(true);

    try {
      await manager.disconnect(activeDevice.id);
      setActiveDevice(null);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown disconnect error.";
      setError("disconnect", detail);
    } finally {
      setDisconnecting(false);
    }
  }, [
    activeDevice,
    clearError,
    manager,
    setActiveDevice,
    setDisconnecting,
    setError,
  ]);

  const handleForgetPort = useCallback(async () => {
    if (!activeDevice) {
      return;
    }

    clearError();
    setDisconnecting(true);
    const deviceId = activeDevice.id;

    try {
      try {
        await manager.disconnect(deviceId);
      } catch {
        // Port may already be closed; still attempt forget.
      }
      setActiveDevice(null);

      const provider = manager.getProvider(WEB_SERIAL_PROVIDER_ID);
      if (provider instanceof WebSerialProvider) {
        await provider.forgetPort(deviceId);
      }
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown forget-port error.";
      setError("disconnect", detail);
    } finally {
      setDisconnecting(false);
    }
  }, [
    activeDevice,
    clearError,
    manager,
    setActiveDevice,
    setDisconnecting,
    setError,
  ]);

  const connectDisabled =
    webSerialSupported === false ||
    isConnecting ||
    isDisconnecting ||
    isIdentifying;

  return (
    <div>
      <PageHeader
        title="Device"
        description="Connect a board, then use the Device Dashboard powered by Device Profiles."
        actions={
          activeDevice ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDisconnecting || isConnecting || isIdentifying}
                onClick={() => {
                  void handleDisconnect();
                }}
              >
                {isDisconnecting ? "Disconnecting…" : "Disconnect"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isDisconnecting || isConnecting || isIdentifying}
                onClick={() => {
                  void handleForgetPort();
                }}
              >
                Forget port
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              disabled={connectDisabled}
              onClick={() => {
                void handleConnect();
              }}
            >
              {isConnecting ? "Connecting…" : "Connect Device"}
            </Button>
          )
        }
      />

      <div className="mb-4">
        <DeviceBusyBanner attempting="identify" />
      </div>

      <DeviceDiscoveryPanel
        webSerialSupported={webSerialSupported}
        isConnecting={isConnecting}
        isIdentifying={isIdentifying}
        identifyError={identifyError}
        activeDevice={activeDevice}
        showConnectedCard={matchedProfile === null}
        errorKind={errorKind}
        errorMessage={errorMessage}
        onIdentify={
          activeDevice
            ? () => {
                void runIdentification(activeDevice.id);
              }
            : undefined
        }
        onRetryConnect={() => {
          void handleConnect();
        }}
      />

      {matchedProfile ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isIdentifying || isConnecting || isDisconnecting}
              onClick={() => {
                void runIdentification(matchedProfile.context.deviceId);
              }}
            >
              {isIdentifying ? "Identifying…" : "Identify"}
            </Button>
          </div>
          <DeviceDashboard matched={matchedProfile} />
        </div>
      ) : null}
    </div>
  );
}
