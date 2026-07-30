/**
 * Unified esptool-js adapter for identify / erase / flash / verify / reset.
 *
 * Feature and UI modules must depend on this class (or {@link EspToolChipIdentifier})
 * — never on `esptool-js` directly.
 */

import { ESPLoader } from "esptool-js";

import { DeviceOwnedTransport } from "./device-owned-transport";
import { EspToolChipIdentifier, type EspToolSerialPort } from "./esp-tool-chip-identifier";
import { md5Hex } from "./md5";
import { mapEspToolChipName } from "./map-chip-name";
import type {
  ChipIdentificationResult,
  EspToolFlashInspectionResult,
  EspToolFlashOptions,
  EspToolVerifyOptions,
  EspToolVerifyResult,
  EspToolWriteProgress,
} from "./types";

export type { EspToolSerialPort };

/**
 * Adapter wrapping esptool-js bootloader operations used by Flash Service.
 */
export class EspToolAdapter {
  readonly #baudRate: number;
  readonly #identifier: EspToolChipIdentifier;

  /**
   * @param baudRate - ROM / stub baud rate (default `115200`; keep equal to avoid reconnect)
   */
  constructor(baudRate = 115200) {
    this.#baudRate = baudRate;
    this.#identifier = new EspToolChipIdentifier(baudRate);
  }

  /**
   * Detects the connected Espressif chip.
   *
   * @param port - Already-open Web Serial port owned by ESP Studio
   */
  async identify(port: EspToolSerialPort): Promise<ChipIdentificationResult> {
    return this.#identifier.identify(port);
  }

  /**
   * Erases the entire flash chip (requires flasher stub).
   *
   * @param port - Already-open Web Serial port
   */
  async erase(port: EspToolSerialPort): Promise<void> {
    await this.#withBootloader(port, async (loader) => {
      await loader.eraseFlash();
    });
  }

  /**
   * Samples flash at the given addresses and returns chip + optional flash size.
   *
   * Used by pre-flash inspection. Does not invent firmware product identity.
   *
   * @param port - Already-open Web Serial port
   * @param addresses - Absolute flash offsets to sample
   * @param sampleLength - Bytes to read at each address
   */
  async inspectFlash(
    port: EspToolSerialPort,
    addresses: readonly number[],
    sampleLength: number,
  ): Promise<EspToolFlashInspectionResult> {
    if (addresses.length === 0) {
      throw new Error("Cannot inspect flash: no sample addresses were provided.");
    }
    if (!Number.isInteger(sampleLength) || sampleLength <= 0) {
      throw new Error("Flash inspection sample length must be a positive integer.");
    }

    return this.#withBootloader(port, async (loader) => {
      const regions = [];
      for (const address of addresses) {
        if (!Number.isInteger(address) || address < 0) {
          throw new Error("Flash inspection address must be a non-negative integer.");
        }
        const bytes = await loader.readFlash(address, sampleLength);
        regions.push({ address, bytes });
      }

      let flashSize: string | undefined;
      try {
        flashSize = await loader.detectFlashSize();
      } catch {
        flashSize = undefined;
      }

      const chip = this.#chipFromLoader(loader);
      return {
        chipFamily: chip.chipFamily,
        ...(chip.rawName !== undefined ? { rawName: chip.rawName } : {}),
        ...(flashSize !== undefined ? { flashSize } : {}),
        regions,
      };
    });
  }

  /**
   * Writes one or more firmware images.
   *
   * @param port - Already-opened Web Serial port
   * @param options - Images and flash parameters
   */
  async flash(
    port: EspToolSerialPort,
    options: EspToolFlashOptions,
  ): Promise<ChipIdentificationResult> {
    if (options.images.length === 0) {
      throw new Error("Cannot flash: no firmware images were provided.");
    }

    return this.#withBootloader(port, async (loader) => {
      // esptool-js writeFlash calls flashSizeBytes(options.flashSize) before
      // resolving "detect", and flashSizeBytes("detect") returns -1 — which
      // makes every image fail the fit check. Resolve detection first.
      let flashSize: NonNullable<EspToolFlashOptions["flashSize"]> =
        options.flashSize ?? "detect";
      if (flashSize === "detect") {
        try {
          const detected = await loader.detectFlashSize();
          flashSize = detected as NonNullable<EspToolFlashOptions["flashSize"]>;
        } catch {
          throw new Error(
            "Unable to determine flash size. Reconnect the board and try again, or flash with an explicit flash size once that option is available.",
          );
        }
      }

      const writeOptions: {
        fileArray: { data: Uint8Array; address: number }[];
        flashMode: NonNullable<EspToolFlashOptions["flashMode"]>;
        flashFreq: NonNullable<EspToolFlashOptions["flashFreq"]>;
        flashSize: NonNullable<EspToolFlashOptions["flashSize"]>;
        eraseAll: boolean;
        compress: boolean;
        calculateMD5Hash: (data: Uint8Array) => string;
        reportProgress?: EspToolWriteProgress;
      } = {
        fileArray: options.images.map((image) => ({
          data: image.data,
          address: image.address,
        })),
        flashMode: options.flashMode ?? "keep",
        flashFreq: options.flashFreq ?? "keep",
        flashSize,
        eraseAll: options.eraseAll ?? false,
        compress: options.compress ?? true,
        calculateMD5Hash: md5Hex,
      };

      if (options.onWriteProgress !== undefined) {
        writeOptions.reportProgress = options.onWriteProgress;
      }

      await loader.writeFlash(writeOptions);

      return this.#chipFromLoader(loader);
    });
  }

  /**
   * Reads a contiguous region of flash memory.
   *
   * @param port - Already-open Web Serial port
   * @param address - Absolute flash address
   * @param size - Number of bytes to read (must be positive)
   */
  async readFlash(
    port: EspToolSerialPort,
    address: number,
    size: number,
  ): Promise<Uint8Array> {
    if (!Number.isInteger(address) || address < 0) {
      throw new Error("Flash read address must be a non-negative integer.");
    }
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error("Flash read size must be a positive integer.");
    }

    return this.#withBootloader(port, async (loader) => {
      return loader.readFlash(address, size);
    });
  }

  /**
   * Verifies on-device MD5 against the provided images.
   *
   * @param port - Already-open Web Serial port
   * @param options - Images to verify
   */
  async verify(
    port: EspToolSerialPort,
    options: EspToolVerifyOptions,
  ): Promise<EspToolVerifyResult> {
    if (options.images.length === 0) {
      throw new Error("Cannot verify: no firmware images were provided.");
    }

    return this.#withBootloader(port, async (loader) => {
      const results = [];
      for (const image of options.images) {
        const expectedMd5 = md5Hex(image.data);
        const actualMd5 = await loader.flashMd5sum(
          image.address,
          image.data.length,
        );
        results.push({
          address: image.address,
          size: image.data.length,
          expectedMd5,
          actualMd5,
          matched: expectedMd5 === actualMd5,
        });
      }

      return {
        matched: results.every((entry) => entry.matched),
        images: results,
      };
    });
  }

  /**
   * Hard-resets the chip via RTS after attaching the transport.
   *
   * @param port - Already-open Web Serial port
   */
  async reset(port: EspToolSerialPort): Promise<void> {
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
      await transport.connect(this.#baudRate);
      await loader.after("hard_reset");
    } finally {
      try {
        await transport.disconnect();
      } catch {
        /* Port lifecycle stays with Device Layer. */
      }
    }
  }

  async #withBootloader<T>(
    port: EspToolSerialPort,
    run: (loader: ESPLoader) => Promise<T>,
  ): Promise<T> {
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
      await loader.main("default_reset");
      return await run(loader);
    } finally {
      try {
        await transport.disconnect();
      } catch {
        /* Port lifecycle stays with Device Layer. */
      }
    }
  }

  #chipFromLoader(loader: ESPLoader): ChipIdentificationResult {
    const rawName = loader.chip.CHIP_NAME;
    if (rawName.length === 0) {
      return { chipFamily: "unknown" };
    }
    return {
      chipFamily: mapEspToolChipName(rawName),
      rawName,
    };
  }
}
