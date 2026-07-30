/**
 * Base error for communication session failures.
 */
export class CommunicationError extends Error {
  /**
   * @param message - Human-readable error message.
   * @param options - Standard `Error` options (for example `cause`).
   */
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CommunicationError";
  }
}

/**
 * Thrown when the session is not open for the requested operation.
 */
export class CommunicationNotOpenError extends CommunicationError {
  /**
   * @param operation - Operation that required an open session.
   */
  public constructor(operation: string) {
    super(`Communication session is not open (required for ${operation})`);
    this.name = "CommunicationNotOpenError";
  }
}

/**
 * Thrown when exclusive ownership cannot be acquired or a lock is invalid.
 */
export class CommunicationOwnershipError extends CommunicationError {
  /**
   * @param message - Human-readable ownership failure.
   */
  public constructor(message: string) {
    super(message);
    this.name = "CommunicationOwnershipError";
  }
}

/**
 * Thrown when a read or write is attempted while another is already in flight.
 */
export class CommunicationBusyError extends CommunicationError {
  /**
   * @param operation - `"read"` or `"write"` that was already in progress.
   */
  public constructor(operation: "read" | "write") {
    super(`Communication session already has an in-flight ${operation}`);
    this.name = "CommunicationBusyError";
  }
}
