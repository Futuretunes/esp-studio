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
  filesystem: true,
  ota: false,
  baudRateControl: true,
};

/**
 * Optional hooks for {@link WebSerialConnection}.
 */
export type WebSerialConnectionOptions = {
  /**
   * Invoked after an unexpected browser `disconnect` event (unplug / revoke).
   * Used by the provider to drop remembered ports.
   */
  readonly onUnexpectedDisconnect?: () => void;
  /**
   * Invoked after a successful intentional {@link WebSerialConnection.close}.
   * Does not run for unexpected browser disconnect (use
   * {@link WebSerialConnectionOptions.onUnexpectedDisconnect}).
   */
  readonly onClosed?: () => void;
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
  readonly #onUnexpectedDisconnect: (() => void) | undefined;
  readonly #onClosed: (() => void) | undefined;
  readonly #handleBrowserDisconnect: () => void;
  #state: DeviceConnectionState;
  #lastError: Error | undefined;
  #listening = false;

  /**
   * @param port - Already-opened Web Serial port.
   * @param options - Optional disconnect / close hooks.
   */
  public constructor(
    port: WebSerialPort,
    options: WebSerialConnectionOptions = {},
  ) {
    this.#port = port;
    this.#io = new WebSerialTransportIo(port);
    this.#state = "connected";
    this.#onUnexpectedDisconnect = options.onUnexpectedDisconnect;
    this.#onClosed = options.onClosed;
    this.#handleBrowserDisconnect = () => {
      void this.#onBrowserDisconnect();
    };
    this.#attachDisconnectListener();
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
   * Follows the Web Serial pattern: release streams, then `port.close()`.
   * Does **not** call `SerialPort.forget()` — that revokes the origin grant
   * and must be an explicit user action (see {@link WebSerialProvider.forgetPort}).
   *
   * Idempotent: repeated calls resolve without throwing once disconnected.
   */
  public async close(): Promise<void> {
    if (this.#state === "disconnected") {
      return;
    }

    this.#state = "disconnecting";
    this.#detachDisconnectListener();

    try {
      if (this.#io.state !== "closed") {
        await this.#io.close();
      }
      try {
        await this.#port.close();
      } catch {
        // Port may already be gone after unplug / revoke — treat as closed.
      }
      this.#state = "disconnected";
      this.#lastError = undefined;
      this.#onClosed?.();
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

  #attachDisconnectListener(): void {
    if (this.#listening || typeof this.#port.addEventListener !== "function") {
      return;
    }
    this.#port.addEventListener("disconnect", this.#handleBrowserDisconnect);
    this.#listening = true;
  }

  #detachDisconnectListener(): void {
    if (
      !this.#listening ||
      typeof this.#port.removeEventListener !== "function"
    ) {
      this.#listening = false;
      return;
    }
    this.#port.removeEventListener(
      "disconnect",
      this.#handleBrowserDisconnect,
    );
    this.#listening = false;
  }

  async #onBrowserDisconnect(): Promise<void> {
    if (
      this.#state === "disconnected" ||
      this.#state === "disconnecting"
    ) {
      return;
    }

    this.#detachDisconnectListener();
    this.#state = "disconnected";
    this.#lastError = undefined;

    try {
      if (this.#io.state !== "closed") {
        await this.#io.close();
      }
    } catch {
      // Best-effort IO teardown after unexpected loss.
    }

    try {
      await this.#port.close();
    } catch {
      // Port may already be closed by the browser.
    }

    this.#onUnexpectedDisconnect?.();
  }
}
