/**
 * Lifecycle state of a {@link TransportIo} byte stream.
 *
 * Distinct from device connection state: a device may be connected while IO
 * is still closed (streams not acquired yet).
 */
export type TransportIoState =
  "closed" | "opening" | "open" | "closing" | "error";

/**
 * Options for opening a transport byte stream.
 */
export type TransportIoOpenOptions = {
  /** Optional abort signal to cancel an in-flight open. */
  readonly signal?: AbortSignal;
};

/**
 * Options for a single read.
 */
export type TransportIoReadOptions = {
  /** Optional abort signal to cancel an in-flight read. */
  readonly signal?: AbortSignal;
};

/**
 * Options for write / flush operations.
 */
export type TransportIoWriteOptions = {
  /** Optional abort signal to cancel an in-flight write or flush. */
  readonly signal?: AbortSignal;
};

/**
 * Transport-agnostic raw byte stream.
 *
 * Implementations exist for Web Serial today and may later cover WebUSB, TCP,
 * and BLE. Consumers must use `Uint8Array` only — text encoding belongs above
 * this layer.
 */
export type TransportIo = {
  /** Current IO lifecycle state. */
  readonly state: TransportIoState;
  /**
   * Most recent error when `state` is `"error"`.
   *
   * Explicit `| undefined` for `exactOptionalPropertyTypes` compatibility.
   */
  readonly lastError?: Error | undefined;
  /**
   * Acquires underlying stream resources.
   *
   * Idempotent when already open.
   *
   * @param options - Optional open options.
   */
  open(options?: TransportIoOpenOptions): Promise<void>;
  /**
   * Releases stream resources.
   *
   * Idempotent when already closed. Does not replace
   * {@link import("../device/DeviceConnection").DeviceConnection.close} for
   * tearing down the device session.
   */
  close(): Promise<void>;
  /**
   * Reads the next binary chunk.
   *
   * @param options - Optional read options.
   * @returns The next chunk, or `null` when the stream ends (EOF).
   */
  read(options?: TransportIoReadOptions): Promise<Uint8Array | null>;
  /**
   * Writes binary data to the transport.
   *
   * Callers must not mutate `data` until the returned promise settles.
   *
   * @param data - Bytes to send.
   * @param options - Optional write options.
   */
  write(data: Uint8Array, options?: TransportIoWriteOptions): Promise<void>;
  /**
   * Waits until buffered outbound data has been accepted by the transport.
   *
   * @param options - Optional flush options.
   */
  flush(options?: TransportIoWriteOptions): Promise<void>;
};
