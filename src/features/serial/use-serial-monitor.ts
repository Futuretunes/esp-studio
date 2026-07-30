import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";

import { useDeviceManager } from "@/app/device-context";
import {
  CommunicationSession,
  type CommunicationLock,
} from "@/core/communication";
import { DeviceError } from "@/core/device";
import { toDeviceSnapshot } from "@/features/devices/to-device-snapshot";
import { SERIAL_MONITOR_OWNER_ID } from "@/features/serial/constants";
import {
  isWebSerialSupported,
  WEB_SERIAL_PROVIDER_ID,
} from "@/providers/web-serial";
import { useDeviceStore } from "@/store";

/**
 * Minimal Serial Monitor controller over CommunicationSession.
 */
export function useSerialMonitor() {
  const manager = useDeviceManager();
  const activeDevice = useDeviceStore((s) => s.activeDevice);
  const setActiveDevice = useDeviceStore((s) => s.setActiveDevice);
  const setConnecting = useDeviceStore((s) => s.setConnecting);
  const setDisconnecting = useDeviceStore((s) => s.setDisconnecting);
  const isConnecting = useDeviceStore((s) => s.isConnecting);
  const isDisconnecting = useDeviceStore((s) => s.isDisconnecting);
  const webSerialSupported = useDeviceStore((s) => s.webSerialSupported);
  const setWebSerialSupported = useDeviceStore((s) => s.setWebSerialSupported);

  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionRef = useRef<CommunicationSession | null>(null);
  const lockRef = useRef<CommunicationLock | null>(null);
  const monitorGenerationRef = useRef(0);
  const decoderRef = useRef(new TextDecoder("utf-8", { fatal: false }));
  const encoderRef = useRef(new TextEncoder());

  useEffect(() => {
    setWebSerialSupported(isWebSerialSupported());
  }, [setWebSerialSupported]);

  const disposeSession = useCallback(async () => {
    monitorGenerationRef.current += 1;

    const session = sessionRef.current;
    const lock = lockRef.current;
    lockRef.current = null;
    sessionRef.current = null;

    if (!session) {
      return;
    }

    try {
      if (lock && !lock.isReleased && session.ownerId === lock.ownerId) {
        session.release(lock);
      }
    } catch {
      // Best-effort release before close.
    }

    try {
      await session.close();
    } catch {
      // Best-effort close.
    }

    decoderRef.current = new TextDecoder("utf-8", { fatal: false });
  }, []);

  const runMonitorLoop = useCallback(
    async (deviceId: string) => {
      setErrorMessage(null);

      const device = manager.getDevice(deviceId);
      const io = device?.connection.io;
      if (!device || !io) {
        setErrorMessage(
          "The connected device has no byte stream. Reconnect the device and try again.",
        );
        return;
      }

      await disposeSession();

      const generation = monitorGenerationRef.current + 1;
      monitorGenerationRef.current = generation;

      const session = new CommunicationSession(io);
      sessionRef.current = session;

      try {
        await session.open();
        if (monitorGenerationRef.current !== generation) {
          return;
        }

        const lock = session.acquire(SERIAL_MONITOR_OWNER_ID);
        lockRef.current = lock;
        setIsMonitoring(true);

        while (monitorGenerationRef.current === generation) {
          const chunk = await session.read(lock);
          if (monitorGenerationRef.current !== generation) {
            break;
          }
          if (chunk === null) {
            const stillTracked = manager.getDevice(deviceId);
            const connectionState = stillTracked?.connection.state;
            if (
              !stillTracked ||
              connectionState === "disconnected" ||
              connectionState === "error"
            ) {
              setErrorMessage(
                "Serial stream ended because the device disconnected. Reconnect the board to continue.",
              );
            } else {
              setErrorMessage(
                "Serial stream ended. Restart the monitor if the device is still connected.",
              );
            }
            break;
          }

          const text = decoderRef.current.decode(chunk, { stream: true });
          if (text.length > 0) {
            setOutput((previous) => previous + text);
          }
        }
      } catch (error) {
        if (monitorGenerationRef.current === generation) {
          const detail =
            error instanceof Error ? error.message : "Serial monitor failed.";
          setErrorMessage(detail);
        }
      } finally {
        if (monitorGenerationRef.current === generation) {
          await disposeSession();
          setIsMonitoring(false);
        }
      }
    },
    [disposeSession, manager],
  );

  const handleConnect = useCallback(async () => {
    setErrorMessage(null);

    if (!isWebSerialSupported()) {
      setWebSerialSupported(false);
      setErrorMessage("Web Serial is not available in this browser.");
      return;
    }

    setConnecting(true);

    try {
      const provider = manager.getProvider(WEB_SERIAL_PROVIDER_ID);
      const device = await manager.connect(WEB_SERIAL_PROVIDER_ID);
      setActiveDevice(
        toDeviceSnapshot(device, provider?.label ?? "Web Serial"),
      );
    } catch (error) {
      setActiveDevice(null);
      if (error instanceof DeviceError) {
        const message = error.message.toLowerCase();
        if (message.includes("cancelled") || message.includes("canceled")) {
          setErrorMessage("No device was selected in the browser chooser.");
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "Connection failed.",
        );
      }
    } finally {
      setConnecting(false);
    }
  }, [manager, setActiveDevice, setConnecting, setWebSerialSupported]);

  const handleDisconnect = useCallback(async () => {
    const snapshot = useDeviceStore.getState().activeDevice;
    if (!snapshot) {
      return;
    }

    setErrorMessage(null);
    setDisconnecting(true);

    try {
      await disposeSession();
      setIsMonitoring(false);
      await manager.disconnect(snapshot.id);
      setActiveDevice(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Disconnect failed.",
      );
    } finally {
      setDisconnecting(false);
    }
  }, [disposeSession, manager, setActiveDevice, setDisconnecting]);

  const handleSend = useCallback(
    async (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();

      const session = sessionRef.current;
      const lock = lockRef.current;
      const text = input;

      if (!session || !lock || lock.isReleased) {
        setErrorMessage("Serial monitor is not running.");
        return;
      }

      if (text.length === 0) {
        return;
      }

      setIsSending(true);
      setErrorMessage(null);

      try {
        const bytes = encoderRef.current.encode(text);
        await session.write(lock, bytes);
        await session.flush(lock);
        setInput("");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to send data.",
        );
      } finally {
        setIsSending(false);
      }
    },
    [input],
  );

  const clearOutput = useCallback(() => {
    setOutput("");
  }, []);

  const restartMonitor = useCallback(() => {
    const deviceId = useDeviceStore.getState().activeDevice?.id;
    if (!deviceId) {
      setErrorMessage("Connect a device before restarting the monitor.");
      return;
    }
    void runMonitorLoop(deviceId);
  }, [runMonitorLoop]);

  const activeDeviceId = activeDevice?.id;

  useEffect(() => {
    if (!activeDeviceId) {
      return;
    }

    const timer = window.setTimeout(() => {
      void runMonitorLoop(activeDeviceId);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      void disposeSession().then(() => {
        setIsMonitoring(false);
      });
    };
  }, [activeDeviceId, disposeSession, runMonitorLoop]);

  return {
    activeDevice,
    webSerialSupported,
    isConnecting,
    isDisconnecting,
    isMonitoring,
    isSending,
    output,
    input,
    setInput,
    errorMessage,
    handleConnect,
    handleDisconnect,
    handleSend,
    clearOutput,
    restartMonitor,
  };
}
