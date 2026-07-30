/**
 * Chip identification via esptool-js, isolated from UI and feature packages.
 */

import { ESPLoader } from "esptool-js";

import { DeviceOwnedTransport } from "./device-owned-transport";
import { mapEspToolChipName } from "./map-chip-name";
import type { ChipIdentificationResult } from "./types";

/**
 * Minimal SerialPort-like handle accepted by the esptool adapter.
 *
 * Kept structural so callers may pass the provider's Web Serial port handle
 * without depending on DOM `SerialPort` typings outside this package.
 */
export type EspToolSerialPort = {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  getInfo(): {
    readonly usbVendorId?: number;
    readonly usbProductId?: number;
  };
  open(options: { readonly baudRate: number }): Promise<void>;
  close(): Promise<void>;
  setSignals?(signals: {
    dataTerminalReady?: boolean;
    requestToSend?: boolean;
  }): Promise<void>;
};

/**
 * Chip identifier backed by esptool-js.
 *
 * UI and feature modules must depend on this adapter — never on `esptool-js`
 * directly.
 */
export class EspToolChipIdentifier {
  readonly #baudRate: number;

  /**
   * @param baudRate - Baud rate for detection (default `115200`)
   */
  constructor(baudRate = 115200) {
    this.#baudRate = baudRate;
  }

  /**
   * Detects the connected Espressif chip using esptool-js.
   *
   * Resets the device as part of detection. Callers must hold exclusive
   * communication ownership and must not hold `TransportIo` stream locks.
   *
   * @param port - Already-open Web Serial port owned by ESP Studio
   * @returns Normalized chip family plus optional raw name
   */
  async identify(port: EspToolSerialPort): Promise<ChipIdentificationResult> {
    const transport = new DeviceOwnedTransport(
      port as SerialPort,
      false,
      true,
    );
    const loader = new ESPLoader({
      transport,
      baudrate: this.#baudRate,
      debugLogging: false,
    });

    try {
      await loader.detectChip("default_reset");
      const rawName = loader.chip.CHIP_NAME;
      if (rawName.length === 0) {
        return { chipFamily: "unknown" };
      }

      return {
        chipFamily: mapEspToolChipName(rawName),
        rawName,
      };
    } finally {
      try {
        await transport.disconnect();
      } catch {
        /* Port lifecycle stays with Device Layer. */
      }
    }
  }
}
