/**
 * Opaque identifier for a communication session owner.
 *
 * Examples: `"serial-monitor"`, `"flash-engine"`.
 */
export type CommunicationOwnerId = string;

/**
 * Exclusive ownership token for a {@link import("./CommunicationSession").CommunicationSession}.
 *
 * Obtained via `acquire` and invalidated via `release`. Stale locks must not
 * be used for IO after release.
 */
export class CommunicationLock {
  readonly #ownerId: CommunicationOwnerId;
  #released: boolean;

  /**
   * @param ownerId - Consumer that holds exclusive session ownership.
   */
  public constructor(ownerId: CommunicationOwnerId) {
    this.#ownerId = ownerId;
    this.#released = false;
  }

  /**
   * Owner id associated with this lock.
   */
  public get ownerId(): CommunicationOwnerId {
    return this.#ownerId;
  }

  /**
   * Whether this lock has been released and is no longer valid for IO.
   */
  public get isReleased(): boolean {
    return this.#released;
  }

  /**
   * Marks the lock as released.
   *
   * Intended for use by {@link import("./CommunicationSession").CommunicationSession}
   * only. Idempotent.
   *
   * @internal
   */
  public markReleased(): void {
    this.#released = true;
  }
}
