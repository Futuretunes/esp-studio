/**
 * Typed errors for {@link FlashService} orchestration failures.
 */

/**
 * Base error for Flash Service failures.
 */
export class FlashError extends Error {
  /**
   * @param message - Human-readable error message
   * @param options - Standard `Error` options (for example `cause`)
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "FlashError";
  }
}

/**
 * Thrown when another tool owns the device connection (for example Serial Monitor).
 */
export class FlashBusyError extends FlashError {
  /**
   * @param message - Friendly busy explanation
   * @param options - Standard `Error` options
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "FlashBusyError";
  }
}

/**
 * Thrown when the target device / port / provider is missing or unusable.
 */
export class FlashDeviceError extends FlashError {
  /**
   * @param message - Friendly device explanation
   * @param options - Standard `Error` options
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "FlashDeviceError";
  }
}

/**
 * Thrown when an esptool adapter operation fails.
 */
export class FlashOperationError extends FlashError {
  /**
   * @param message - Friendly operation explanation
   * @param options - Standard `Error` options
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "FlashOperationError";
  }
}
