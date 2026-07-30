/**
 * Device-scoped operation ownership over a shared {@link CommunicationSession}.
 *
 * Ensures Flash, Identify, Filesystem, and Serial Monitor contend on one lock
 * per connected device instead of ephemeral per-call sessions.
 */

import {
  CommunicationSession,
  type CommunicationLock,
  type CommunicationOwnerId,
} from "../communication";
import type { TransportIo } from "../transport/TransportIo";

/**
 * Thin holder: one {@link CommunicationSession} per connected device transport.
 */
export class DeviceOperationLock {
  readonly #session: CommunicationSession;
  readonly #onOwnerChange: ((ownerId: CommunicationOwnerId | null) => void) | undefined;

  /**
   * @param transport - Device {@link TransportIo}
   * @param onOwnerChange - Optional callback when ownership changes
   */
  public constructor(
    transport: TransportIo,
    onOwnerChange?: (ownerId: CommunicationOwnerId | null) => void,
  ) {
    this.#session = new CommunicationSession(transport);
    this.#onOwnerChange = onOwnerChange;
  }

  /**
   * Underlying session (Serial Monitor open / read / write / close).
   */
  public get session(): CommunicationSession {
    return this.#session;
  }

  /**
   * Active owner id, if any.
   */
  public get ownerId(): CommunicationOwnerId | null {
    return this.#session.ownerId;
  }

  /**
   * Claims exclusive device ownership for `ownerId`.
   *
   * @param ownerId - Existing owner string (for example `"flash-service"`)
   * @returns Lock that must be released in `finally`
   */
  public claim(ownerId: CommunicationOwnerId): CommunicationLock {
    const lock = this.#session.acquire(ownerId);
    this.#onOwnerChange?.(this.#session.ownerId);
    return lock;
  }

  /**
   * Releases a previously claimed lock.
   *
   * @param lock - Lock from {@link DeviceOperationLock.claim}
   */
  public release(lock: CommunicationLock): void {
    this.#session.release(lock);
    this.#onOwnerChange?.(this.#session.ownerId);
  }

  /**
   * Force-releases ownership and closes the underlying transport session.
   *
   * Safe on disconnect. Idempotent when already closed.
   */
  public async dispose(): Promise<void> {
    try {
      await this.#session.close();
    } finally {
      this.#onOwnerChange?.(null);
    }
  }
}
