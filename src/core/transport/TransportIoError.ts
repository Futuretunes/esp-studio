/**
 * Base error for transport IO failures.
 */
export class TransportIoError extends Error {
  /**
   * @param message - Human-readable error message.
   * @param options - Standard `Error` options (for example `cause`).
   */
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TransportIoError";
  }
}

/**
 * Thrown when an IO operation is attempted before {@link import("./TransportIo").TransportIo.open}.
 */
export class TransportIoNotOpenError extends TransportIoError {
  /**
   * Creates a not-open error for the given operation name.
   *
   * @param operation - Operation that required an open stream.
   */
  public constructor(operation: string) {
    super(`Transport IO is not open (required for ${operation})`);
    this.name = "TransportIoNotOpenError";
  }
}
