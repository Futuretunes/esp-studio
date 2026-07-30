/**
 * esptool {@link Transport} that uses an already-open Web Serial port.
 *
 * {@link ESPLoader} normally opens and closes the port via {@link Transport}.
 * ESP Studio keeps the port open under the Device Layer; this subclass skips
 * `port.open` / `port.close` and only releases temporary reader locks.
 */

import { Transport, type SerialOptions } from "esptool-js";

/**
 * Structural access to the private reader field used by esptool's disconnect path.
 */
type TransportReaderAccess = {
  reader?: ReadableStreamDefaultReader<Uint8Array> | undefined;
};

/**
 * Transport that never opens or closes the underlying {@link SerialPort}.
 */
export class DeviceOwnedTransport extends Transport {
  /**
   * @param device - Already-open native Web Serial port
   * @param tracing - Forwarded to {@link Transport}
   * @param enableSlipReader - Forwarded to {@link Transport}
   */
  constructor(
    device: SerialPort,
    tracing = false,
    enableSlipReader = true,
  ) {
    super(device, tracing, enableSlipReader);
  }

  /**
   * Records the baud rate without calling `port.open`.
   *
   * Stream locks are acquired lazily by esptool's `readLoop` / `write`.
   *
   * @param baud - Baud rate metadata for the loader
   * @param _serialOptions - Ignored; the port is already configured
   */
  override connect(
    baud = 115200,
    _serialOptions: SerialOptions = {},
  ): Promise<void> {
    this.baudrate = baud;
    return Promise.resolve();
  }

  /**
   * Releases reader locks without closing the underlying SerialPort.
   *
   * Closing the port here would tear down the Device Layer session.
   */
  override async disconnect(): Promise<void> {
    const self = this as unknown as TransportReaderAccess;
    const readable = this.device.readable;

    if (readable?.locked === true && self.reader !== undefined) {
      try {
        await self.reader.cancel();
      } catch {
        /* best-effort cancel */
      }
    }

    await this.waitForUnlock(400);
    self.reader = undefined;
  }
}
