import type {
  DeviceConnectOptions,
  DeviceConnection,
  DeviceInfo,
  DeviceProvider,
  ProviderId,
} from "@/core/device";
import { DeviceError } from "@/core/device";

import { WebSerialConnection } from "./WebSerialConnection";
import { getWebSerial, type WebSerialPort } from "./types";

/**
 * Stable provider id for Web Serial registrations.
 */
export const WEB_SERIAL_PROVIDER_ID: ProviderId = "web-serial";

const DEFAULT_BAUD_RATE = 115200;

/**
 * Configuration for {@link WebSerialProvider}.
 */
export type WebSerialProviderOptions = {
  /**
   * Baud rate used when opening ports if `DeviceConnectOptions.baudRate`
   * is omitted. Defaults to `115200`.
   */
  readonly baudRate?: number;
};

/**
 * Reports whether the Web Serial API is available in this runtime.
 *
 * Equivalent to constructing a provider and calling `isSupported()`.
 *
 * @returns `true` when `navigator.serial` exists.
 */
export function isWebSerialSupported(): boolean {
  return getWebSerial() !== undefined;
}

/**
 * Web Serial transport provider.
 *
 * Implements {@link DeviceProvider} using `navigator.serial`. Browser-specific
 * types never leave this module — consumers only see Device Layer contracts.
 */
export class WebSerialProvider implements DeviceProvider {
  /**
   * Provider id used with {@link import("@/core/device").DeviceManager}.
   */
  public readonly id: ProviderId = WEB_SERIAL_PROVIDER_ID;

  /**
   * Human-readable label for UI and logs.
   */
  public readonly label = "Web Serial";

  readonly #defaultBaudRate: number;
  readonly #ports = new Map<string, WebSerialPort>();
  #portSequence = 0;

  /**
   * @param options - Optional provider configuration.
   */
  public constructor(options: WebSerialProviderOptions = {}) {
    this.#defaultBaudRate = options.baudRate ?? DEFAULT_BAUD_RATE;
  }

  /**
   * Reports whether this provider can run in the current runtime.
   *
   * @returns `true` when Web Serial is present.
   */
  public isAvailable(): boolean {
    return this.isSupported();
  }

  /**
   * Web Serial naming alias for {@link WebSerialProvider.isAvailable}.
   *
   * @returns `true` when Web Serial is present.
   */
  public isSupported(): boolean {
    return isWebSerialSupported();
  }

  /**
   * Lists ports previously authorized for this origin.
   *
   * @returns Device info snapshots for granted ports.
   */
  public async listDevices(): Promise<readonly DeviceInfo[]> {
    const serial = this.#requireSerial();
    const ports = await serial.getPorts();
    return ports.map((port) => this.#rememberPort(port));
  }

  /**
   * Prompts the user to choose a serial port (`requestPort()`).
   *
   * Must be called from a user gesture in supporting browsers.
   *
   * @param options - Optional connect options (abort signal).
   * @returns Metadata for the selected port (not yet opened).
   * @throws {DeviceError} When the user cancels or the API fails.
   */
  public async requestDevice(
    options?: DeviceConnectOptions,
  ): Promise<DeviceInfo> {
    this.#throwIfAborted(options?.signal);
    const serial = this.#requireSerial();

    try {
      const port = await serial.requestPort();
      this.#throwIfAborted(options?.signal);
      return this.#rememberPort(port);
    } catch (error) {
      if (this.#isUserCancellation(error)) {
        throw new DeviceError("Web Serial port request was cancelled", {
          cause: error,
        });
      }

      throw new DeviceError("Failed to request a Web Serial port", {
        cause: error,
      });
    }
  }

  /**
   * Opens the serial port associated with `info` (`port.open()`).
   *
   * @param info - Device metadata previously returned by this provider.
   * @param options - Optional connect options (abort signal, baud rate).
   * @returns An active {@link DeviceConnection}.
   */
  public async connect(
    info: DeviceInfo,
    options?: DeviceConnectOptions,
  ): Promise<DeviceConnection> {
    if (info.providerId !== this.id) {
      throw new DeviceError(
        `Cannot connect device from provider "${info.providerId}" with Web Serial`,
      );
    }

    this.#throwIfAborted(options?.signal);

    const port = this.#ports.get(info.id);
    if (!port) {
      throw new DeviceError(
        `Unknown Web Serial device "${info.id}". Request or list the port again.`,
      );
    }

    const baudRate = options?.baudRate ?? this.#defaultBaudRate;

    try {
      await port.open({ baudRate });
      this.#throwIfAborted(options?.signal);
      return new WebSerialConnection(port);
    } catch (error) {
      // If open failed because the abort fired after open started, close best-effort.
      if (options?.signal?.aborted) {
        try {
          await port.close();
        } catch {
          // Ignore close failures during abort cleanup.
        }
        throw new DeviceError("Web Serial connection aborted", {
          cause: options.signal.reason,
        });
      }

      throw new DeviceError(
        `Failed to open Web Serial port at ${String(baudRate)} baud`,
        { cause: error },
      );
    }
  }

  /**
   * Returns the native Web Serial port for a remembered device id.
   *
   * Intended for adapters (for example esptool-js) that require browser port
   * control signals. Feature UI must not use this escape hatch.
   *
   * @param deviceId - Device id previously returned by this provider.
   * @returns The port, or `undefined` when unknown.
   */
  public getNativePort(deviceId: string): WebSerialPort | undefined {
    return this.#ports.get(deviceId);
  }

  #requireSerial() {
    const serial = getWebSerial();
    if (!serial) {
      throw new DeviceError("Web Serial API is not available in this runtime");
    }
    return serial;
  }

  #rememberPort(port: WebSerialPort): DeviceInfo {
    for (const [id, known] of this.#ports) {
      if (known === port) {
        return this.#toDeviceInfo(id, port);
      }
    }

    this.#portSequence += 1;
    const id = `web-serial:${String(this.#portSequence)}`;
    this.#ports.set(id, port);
    return this.#toDeviceInfo(id, port);
  }

  #toDeviceInfo(id: string, port: WebSerialPort): DeviceInfo {
    const info = port.getInfo();
    const vendor = info.usbVendorId;
    const product = info.usbProductId;
    const transportLabel =
      vendor !== undefined && product !== undefined
        ? `USB ${this.#hexId(vendor)}:${this.#hexId(product)}`
        : "Serial port";

    const metadata: Record<string, string> = {};
    if (vendor !== undefined) {
      metadata.usbVendorId = String(vendor);
    }
    if (product !== undefined) {
      metadata.usbProductId = String(product);
    }

    const deviceInfo: DeviceInfo = {
      id,
      name:
        vendor !== undefined && product !== undefined
          ? `Serial device ${this.#hexId(vendor)}:${this.#hexId(product)}`
          : "Serial device",
      providerId: this.id,
      chipFamily: "unknown",
      transportLabel,
    };

    if (Object.keys(metadata).length > 0) {
      return { ...deviceInfo, metadata };
    }

    return deviceInfo;
  }

  #hexId(value: number): string {
    return value.toString(16).padStart(4, "0");
  }

  #throwIfAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted) {
      throw new DeviceError("Web Serial operation aborted", {
        cause: signal.reason,
      });
    }
  }

  #isUserCancellation(error: unknown): boolean {
    if (!(error instanceof DOMException)) {
      return false;
    }

    return error.name === "NotFoundError" || error.name === "AbortError";
  }
}
