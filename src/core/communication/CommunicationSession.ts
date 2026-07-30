import type { TransportIo } from "../transport/TransportIo";
import {
  CommunicationBusyError,
  CommunicationError,
  CommunicationNotOpenError,
  CommunicationOwnershipError,
} from "./CommunicationError";
import {
  CommunicationLock,
  type CommunicationOwnerId,
} from "./CommunicationLock";

/**
 * Lifecycle state of a {@link CommunicationSession}.
 */
export type CommunicationSessionState =
  "closed" | "opening" | "open" | "closing" | "error";

/**
 * Single-owner communication layer over a {@link TransportIo}.
 *
 * Ensures only one consumer owns the byte stream at a time and that reads and
 * writes are not overlapped. Forwards raw `Uint8Array` only — no text, framing,
 * or protocol logic.
 */
export class CommunicationSession {
  readonly #transport: TransportIo;
  #state: CommunicationSessionState = "closed";
  #lastError: Error | undefined;
  #activeLock: CommunicationLock | null = null;
  #readInFlight = false;
  #writeInFlight = false;

  /**
   * @param transport - Underlying byte stream owned by this session.
   */
  public constructor(transport: TransportIo) {
    this.#transport = transport;
  }

  /**
   * Current session lifecycle state.
   */
  public get state(): CommunicationSessionState {
    return this.#state;
  }

  /**
   * Most recent error when `state` is `"error"`.
   */
  public get lastError(): Error | undefined {
    return this.#lastError;
  }

  /**
   * Owner id currently holding exclusive access, if any.
   */
  public get ownerId(): CommunicationOwnerId | null {
    return this.#activeLock?.ownerId ?? null;
  }

  /**
   * Whether the session currently has an exclusive owner.
   */
  public get isOwned(): boolean {
    return this.#activeLock !== null;
  }

  /**
   * Opens the session and underlying transport IO.
   *
   * Idempotent when already open.
   */
  public async open(): Promise<void> {
    if (this.#state === "open") {
      return;
    }

    this.#state = "opening";
    this.#lastError = undefined;

    try {
      await this.#transport.open();
      this.#state = "open";
    } catch (error) {
      const normalized = this.#normalizeError(
        error,
        "Failed to open communication session",
      );
      this.#state = "error";
      this.#lastError = normalized;
      throw normalized;
    }
  }

  /**
   * Releases ownership (if held) and closes the underlying transport IO.
   *
   * Idempotent when already closed.
   */
  public async close(): Promise<void> {
    if (this.#state === "closed") {
      return;
    }

    this.#state = "closing";

    try {
      this.#forceReleaseActiveLock();
      await this.#transport.close();
      this.#state = "closed";
      this.#lastError = undefined;
    } catch (error) {
      const normalized = this.#normalizeError(
        error,
        "Failed to close communication session",
      );
      this.#state = "error";
      this.#lastError = normalized;
      throw normalized;
    }
  }

  /**
   * Acquires exclusive ownership of the session for `ownerId`.
   *
   * @param ownerId - Consumer identity requesting ownership.
   * @returns A lock that must be passed to IO methods and later released.
   * @throws {CommunicationNotOpenError} When the session is not open.
   * @throws {CommunicationOwnershipError} When another owner already holds the session.
   */
  public acquire(ownerId: CommunicationOwnerId): CommunicationLock {
    this.#assertOpen("acquire");

    const trimmed = ownerId.trim();
    if (trimmed.length === 0) {
      throw new CommunicationOwnershipError(
        "Communication owner id must be a non-empty string",
      );
    }

    if (this.#activeLock !== null) {
      throw new CommunicationOwnershipError(
        `Communication session is already owned by "${this.#activeLock.ownerId}"`,
      );
    }

    const lock = new CommunicationLock(trimmed);
    this.#activeLock = lock;
    return lock;
  }

  /**
   * Releases exclusive ownership represented by `lock`.
   *
   * @param lock - Lock previously returned by {@link CommunicationSession.acquire}.
   * @throws {CommunicationOwnershipError} When the lock is not the active owner.
   */
  public release(lock: CommunicationLock): void {
    if (this.#activeLock !== lock) {
      throw new CommunicationOwnershipError(
        "Cannot release a communication lock that is not the active owner",
      );
    }

    lock.markReleased();
    this.#activeLock = null;
  }

  /**
   * Reads the next binary chunk through the underlying transport.
   *
   * @param lock - Active ownership lock.
   * @returns The next chunk, or `null` on EOF.
   */
  public async read(lock: CommunicationLock): Promise<Uint8Array | null> {
    this.#assertOpen("read");
    this.#assertActiveLock(lock);

    if (this.#readInFlight) {
      throw new CommunicationBusyError("read");
    }

    this.#readInFlight = true;

    try {
      return await this.#transport.read();
    } catch (error) {
      const normalized = this.#normalizeError(
        error,
        "Failed to read from communication session",
      );
      this.#state = "error";
      this.#lastError = normalized;
      throw normalized;
    } finally {
      this.#readInFlight = false;
    }
  }

  /**
   * Writes binary data through the underlying transport.
   *
   * @param lock - Active ownership lock.
   * @param data - Bytes to send.
   */
  public async write(lock: CommunicationLock, data: Uint8Array): Promise<void> {
    this.#assertOpen("write");
    this.#assertActiveLock(lock);

    if (this.#writeInFlight) {
      throw new CommunicationBusyError("write");
    }

    this.#writeInFlight = true;

    try {
      await this.#transport.write(data);
    } catch (error) {
      const normalized = this.#normalizeError(
        error,
        "Failed to write to communication session",
      );
      this.#state = "error";
      this.#lastError = normalized;
      throw normalized;
    } finally {
      this.#writeInFlight = false;
    }
  }

  /**
   * Flushes buffered outbound data through the underlying transport.
   *
   * @param lock - Active ownership lock.
   */
  public async flush(lock: CommunicationLock): Promise<void> {
    this.#assertOpen("flush");
    this.#assertActiveLock(lock);

    if (this.#writeInFlight) {
      throw new CommunicationBusyError("write");
    }

    this.#writeInFlight = true;

    try {
      await this.#transport.flush();
    } catch (error) {
      const normalized = this.#normalizeError(
        error,
        "Failed to flush communication session",
      );
      this.#state = "error";
      this.#lastError = normalized;
      throw normalized;
    } finally {
      this.#writeInFlight = false;
    }
  }

  #assertOpen(operation: string): void {
    if (this.#state !== "open") {
      throw new CommunicationNotOpenError(operation);
    }
  }

  #assertActiveLock(lock: CommunicationLock): void {
    if (lock.isReleased || this.#activeLock !== lock) {
      throw new CommunicationOwnershipError(
        "Communication lock is not the active session owner",
      );
    }
  }

  #forceReleaseActiveLock(): void {
    if (this.#activeLock !== null) {
      this.#activeLock.markReleased();
      this.#activeLock = null;
    }
  }

  #normalizeError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof CommunicationError) {
      return error;
    }
    if (error instanceof Error) {
      return new CommunicationError(fallbackMessage, { cause: error });
    }
    return new CommunicationError(fallbackMessage, { cause: error });
  }
}
