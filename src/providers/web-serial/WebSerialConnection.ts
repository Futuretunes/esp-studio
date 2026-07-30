import type {
  DeviceCapabilities,
  DeviceConnection,
  DeviceConnectionState,
} from "@/core/device";
import { DeviceError } from "@/core/device";

import type { WebSerialPort } from "./types";

/**
 * Capabilities advertised by a minimal Web Serial session.
 *
 * Streaming IO and flashing are intentionally deferred; `serial` is true
 * because the underlying transport is a serial port.
 */
export const WEB_SERIAL_CAPABILITIES: DeviceCapabilities = {
  serial: true,
  flash: false,
  filesystem: false,
  ota: false,
  baudRateControl: true,
};

/**
 * {@link DeviceConnection} backed by a browser `SerialPort`.
 *
 * Does not expose readable/writable streams yet — Serial Monitor will own
 * that surface in a later milestone.
 */
export class WebSerialConnection implements DeviceConnection {
  readonly #port: WebSerialPort;
  #state: DeviceConnectionState;
  #lastError: Error | undefined;

  /**
   * @param port - Already-opened Web Serial port.
   */
  public constructor(port: WebSerialPort) {
    this.#port = port;
    this.#state = "connected";
  }

  /**
   * Current lifecycle state for this serial session.
   */
  public get state(): DeviceConnectionState {
    return this.#state;
  }

  /**
   * Feature flags for this session.
   */
  public get capabilities(): DeviceCapabilities {
    return WEB_SERIAL_CAPABILITIES;
  }

  /**
   * Most recent error when `state` is `"error"`.
   */
  public get lastError(): Error | undefined {
    return this.#lastError;
  }

  /**
   * Closes the underlying `SerialPort`.
   *
   * Idempotent: repeated calls resolve without throwing once disconnected.
   */
  public async close(): Promise<void> {
    if (this.#state === "disconnected") {
      return;
    }

    this.#state = "disconnecting";

    try {
      await this.#port.close();
      this.#state = "disconnected";
      this.#lastError = undefined;
    } catch (error) {
      const normalized =
        error instanceof Error
          ? error
          : new DeviceError("Failed to close Web Serial port", {
              cause: error,
            });
      this.#state = "error";
      this.#lastError = normalized;
      throw normalized;
    }
  }
}
