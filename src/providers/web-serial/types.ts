/**
 * Minimal Web Serial API typings.
 *
 * TypeScript's DOM lib does not yet ship complete Serial definitions for this
 * project toolchain, so the provider owns a narrow local contract. Keep this
 * file inside `src/providers/web-serial` so core stays browser-independent.
 */

/**
 * USB identity fields returned by `SerialPort.getInfo()`.
 */
export type WebSerialPortInfo = {
  readonly usbVendorId?: number;
  readonly usbProductId?: number;
};

/**
 * Subset of `SerialOptions` used when opening a port.
 */
export type WebSerialOpenOptions = {
  readonly baudRate: number;
};

/**
 * Narrow `SerialPort` surface required by this provider.
 */
export type WebSerialPort = {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  getInfo(): WebSerialPortInfo;
  open(options: WebSerialOpenOptions): Promise<void>;
  close(): Promise<void>;
};

/**
 * Narrow `Serial` surface required by this provider.
 */
export type WebSerial = {
  getPorts(): Promise<WebSerialPort[]>;
  requestPort(options?: {
    readonly filters?: readonly {
      readonly usbVendorId?: number;
      readonly usbProductId?: number;
    }[];
  }): Promise<WebSerialPort>;
};

type NavigatorWithSerial = Navigator & {
  readonly serial?: WebSerial;
};

/**
 * Returns the browser Web Serial entry point when available.
 *
 * @returns `navigator.serial`, or `undefined` when unsupported.
 */
export function getWebSerial(): WebSerial | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  const withSerial = navigator as NavigatorWithSerial;
  return withSerial.serial;
}
