import type {
  DeviceCapabilities,
  DeviceConnection,
  DeviceConnectionState,
} from "@/core/device";
import { DeviceError } from "@/core/device";
import type { TransportIo } from "@/core/transport";

import type { WebSerialPort } from "./types";
import { WebSerialTransportIo } from "./WebSerialTransportIo";

/**
 * Capabilities advertised by a Web Serial session with raw byte IO.
 *
 * `flash` is true because erase/write/verify can run through the esptool
 * adapter + Flash Service; Flash page UI remains a separate milestone.
 */
export const WEB_SERIAL_CAPABILITIES: DeviceCapabilities = {
  serial: true,
  flash: true,
  filesystem: false,
  ota: false,
  baudRateControl: true,
};

/**
 * {@link DeviceConnection} backed by a browser `SerialPort`.
 *
 * Exposes raw byte IO via {@link WebSerialTransportIo}. Serial Monitor and
 * framing logic stay outside this class.
 */
export class WebSerialConnection implements DeviceConnection {
  readonly #port: WebSerialPort;
  readonly #io: WebSerialTransportIo;
  #state: DeviceConnectionState;
  #lastError: Error | undefined;

  /**
   * @param port - Already-opened Web Serial port.
   */
  public constructor(port: WebSerialPort) {
    this.#port = port;
    this.#io = new WebSerialTransportIo(port);
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
   * Raw byte stream for this connection (`Uint8Array` only).
   */
  public get io(): TransportIo {
    return this.#io;
  }

  /**
   * Closes transport IO (if open) and then the underlying `SerialPort`.
   *
   * Idempotent: repeated calls resolve without throwing once disconnected.
   */
  public async close(): Promise<void> {
    if (this.#state === "disconnected") {
      return;
    }

    this.#state = "disconnecting";

    try {
      if (this.#io.state !== "closed") {
        await this.#io.close();
      }
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
