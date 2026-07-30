import type {
  TransportIo,
  TransportIoOpenOptions,
  TransportIoReadOptions,
  TransportIoState,
  TransportIoWriteOptions,
} from "@/core/transport";
import { TransportIoError, TransportIoNotOpenError } from "@/core/transport";

import type { WebSerialPort } from "./types";

/**
 * {@link TransportIo} backed by a Web Serial port's readable/writable streams.
 *
 * Browser stream locks stay inside this provider module. Consumers only see
 * `Uint8Array` chunks through the core contract.
 */
export class WebSerialTransportIo implements TransportIo {
  readonly #port: WebSerialPort;
  #state: TransportIoState = "closed";
  #lastError: Error | undefined;
  #reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  #writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  /**
   * @param port - Already-opened Web Serial port whose streams will be used.
   */
  public constructor(port: WebSerialPort) {
    this.#port = port;
  }

  /**
   * Current IO lifecycle state.
   */
  public get state(): TransportIoState {
    return this.#state;
  }

  /**
   * Most recent error when `state` is `"error"`.
   */
  public get lastError(): Error | undefined {
    return this.#lastError;
  }

  /**
   * Acquires the port's readable reader and writable writer.
   *
   * @param options - Optional open options.
   */
  public async open(options?: TransportIoOpenOptions): Promise<void> {
    if (this.#state === "open") {
      return;
    }

    this.#throwIfAborted(options?.signal);
    this.#state = "opening";
    this.#lastError = undefined;

    try {
      const readable = this.#port.readable;
      const writable = this.#port.writable;

      if (!readable || !writable) {
        throw new TransportIoError(
          "Web Serial port streams are not available (readable/writable missing)",
        );
      }

      this.#reader = readable.getReader();
      this.#writer = writable.getWriter();
      this.#throwIfAborted(options?.signal);
      this.#state = "open";
    } catch (error) {
      await this.#releaseLocks();
      const normalized = this.#normalizeError(
        error,
        "Failed to open Web Serial transport IO",
      );
      this.#state = "error";
      this.#lastError = normalized;
      throw normalized;
    }
  }

  /**
   * Releases reader/writer locks without closing the underlying serial port.
   */
  public async close(): Promise<void> {
    if (this.#state === "closed") {
      return;
    }

    this.#state = "closing";

    try {
      await this.#releaseLocks();
      this.#state = "closed";
      this.#lastError = undefined;
    } catch (error) {
      const normalized = this.#normalizeError(
        error,
        "Failed to close Web Serial transport IO",
      );
      this.#state = "error";
      this.#lastError = normalized;
      throw normalized;
    }
  }

  /**
   * Reads the next binary chunk from the serial port.
   *
   * @param options - Optional read options.
   * @returns The next chunk, or `null` on EOF.
   */
  public async read(
    options?: TransportIoReadOptions,
  ): Promise<Uint8Array | null> {
    const reader = this.#requireReader("read");
    this.#throwIfAborted(options?.signal);

    try {
      const result = await reader.read();
      this.#throwIfAborted(options?.signal);

      if (result.done) {
        return null;
      }

      return result.value;
    } catch (error) {
      const normalized = this.#normalizeError(
        error,
        "Failed to read from Web Serial transport IO",
      );
      this.#state = "error";
      this.#lastError = normalized;
      throw normalized;
    }
  }

  /**
   * Writes binary data to the serial port.
   *
   * @param data - Bytes to send.
   * @param options - Optional write options.
   */
  public async write(
    data: Uint8Array,
    options?: TransportIoWriteOptions,
  ): Promise<void> {
    const writer = this.#requireWriter("write");
    this.#throwIfAborted(options?.signal);

    try {
      await writer.write(data);
      this.#throwIfAborted(options?.signal);
    } catch (error) {
      const normalized = this.#normalizeError(
        error,
        "Failed to write to Web Serial transport IO",
      );
      this.#state = "error";
      this.#lastError = normalized;
      throw normalized;
    }
  }

  /**
   * Waits until the writable stream reports it can accept more data.
   *
   * @param options - Optional flush options.
   */
  public async flush(options?: TransportIoWriteOptions): Promise<void> {
    const writer = this.#requireWriter("flush");
    this.#throwIfAborted(options?.signal);

    try {
      await writer.ready;
      this.#throwIfAborted(options?.signal);
    } catch (error) {
      const normalized = this.#normalizeError(
        error,
        "Failed to flush Web Serial transport IO",
      );
      this.#state = "error";
      this.#lastError = normalized;
      throw normalized;
    }
  }

  #requireReader(operation: string): ReadableStreamDefaultReader<Uint8Array> {
    if (this.#state !== "open" || !this.#reader) {
      throw new TransportIoNotOpenError(operation);
    }
    return this.#reader;
  }

  #requireWriter(operation: string): WritableStreamDefaultWriter<Uint8Array> {
    if (this.#state !== "open" || !this.#writer) {
      throw new TransportIoNotOpenError(operation);
    }
    return this.#writer;
  }

  async #releaseLocks(): Promise<void> {
    const reader = this.#reader;
    const writer = this.#writer;
    this.#reader = null;
    this.#writer = null;

    if (reader) {
      try {
        await reader.cancel();
      } catch {
        // Ignore cancel failures while releasing.
      }
      try {
        reader.releaseLock();
      } catch {
        // Ignore double-release.
      }
    }

    if (writer) {
      try {
        writer.releaseLock();
      } catch {
        // Ignore double-release. Do not close() the writer here — that would
        // permanently close the port's writable side before DeviceConnection
        // can shut the port down cleanly.
      }
    }
  }

  #normalizeError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof TransportIoError) {
      return error;
    }
    if (error instanceof Error) {
      return new TransportIoError(fallbackMessage, { cause: error });
    }
    return new TransportIoError(fallbackMessage, { cause: error });
  }

  #throwIfAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted) {
      throw new TransportIoError("Transport IO operation aborted", {
        cause: signal.reason,
      });
    }
  }
}
