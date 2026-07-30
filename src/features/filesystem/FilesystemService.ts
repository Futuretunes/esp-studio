/**
 * Orchestrates filesystem browse operations behind {@link EspFilesystemAdapter}.
 *
 * Acquires exclusive {@link CommunicationSession} ownership (`filesystem-browser`),
 * never imports `esptool-js`, and never talks to Web Serial from the UI layer.
 */

import { EspToolAdapter } from "@/adapters/esptool";
import { EspFilesystemAdapter } from "@/adapters/filesystem";
import {
  CommunicationOwnershipError,
  CommunicationSession,
} from "@/core/communication";
import type { DeviceManager } from "@/core/device";
import { FILESYSTEM_BROWSER_OWNER_ID } from "@/features/filesystem/constants";
import type {
  FilesystemEntry,
  FilesystemPath,
} from "@/features/filesystem/FileEntry";
import { FilesystemError } from "@/features/filesystem/FilesystemError";
import {
  WebSerialProvider,
  WEB_SERIAL_PROVIDER_ID,
} from "@/providers/web-serial";

/**
 * Filesystem browse service for connected ESP devices.
 */
export class FilesystemService {
  readonly #manager: DeviceManager;
  readonly #adapter: EspFilesystemAdapter;

  /**
   * @param manager - App {@link DeviceManager}
   * @param adapter - Optional filesystem adapter
   */
  constructor(
    manager: DeviceManager,
    adapter: EspFilesystemAdapter = new EspFilesystemAdapter(new EspToolAdapter()),
  ) {
    this.#manager = manager;
    this.#adapter = adapter;
  }

  /**
   * Lists the filesystem root (`/`) — typically volume directories.
   *
   * @param deviceId - Connected device id
   */
  async listRoot(deviceId: string): Promise<readonly FilesystemEntry[]> {
    return this.listDirectory(deviceId, "/");
  }

  /**
   * Lists children of `path`.
   *
   * @param deviceId - Connected device id
   * @param path - Absolute path (`/` or `/volume/…`)
   */
  async listDirectory(
    deviceId: string,
    path: FilesystemPath,
  ): Promise<readonly FilesystemEntry[]> {
    let lock: ReturnType<CommunicationSession["acquire"]> | undefined;
    let session: CommunicationSession | undefined;

    try {
      const target = this.#resolveTarget(deviceId);
      session = target.session;

      try {
        lock = session.acquire(FILESYSTEM_BROWSER_OWNER_ID);
      } catch (error) {
        if (error instanceof CommunicationOwnershipError) {
          throw new FilesystemError(
            "busy",
            `Cannot browse the filesystem while another tool owns the connection (${session.ownerId ?? "unknown"}). Stop the Serial Monitor and retry.`,
            { cause: error },
          );
        }
        throw error;
      }

      return await this.#adapter.listDirectory(target.port, path);
    } catch (error) {
      throw this.#normalizeError(error);
    } finally {
      if (session !== undefined && lock !== undefined) {
        try {
          session.release(lock);
        } catch {
          /* Ignore double-release. */
        }
      }
    }
  }

  #resolveTarget(deviceId: string): {
    readonly port: NonNullable<
      ReturnType<WebSerialProvider["getNativePort"]>
    >;
    readonly session: CommunicationSession;
  } {
    const device = this.#manager.getDevice(deviceId);
    const io = device?.connection.io;
    if (!device || !io) {
      throw new FilesystemError(
        "no-device",
        "Cannot browse the filesystem: device has no byte transport. Reconnect and retry.",
      );
    }

    if (io.state !== "closed") {
      throw new FilesystemError(
        "busy",
        "Cannot browse the filesystem while another tool owns the connection. Stop the Serial Monitor and retry.",
      );
    }

    const provider = this.#manager.getProvider(WEB_SERIAL_PROVIDER_ID);
    if (!(provider instanceof WebSerialProvider)) {
      throw new FilesystemError(
        "unsupported",
        "Filesystem browsing currently requires the Web Serial provider.",
      );
    }

    const nativePort = provider.getNativePort(deviceId);
    if (!nativePort) {
      throw new FilesystemError(
        "no-device",
        "Cannot browse the filesystem: native serial port is unavailable for this device.",
      );
    }

    return {
      port: nativePort,
      session: new CommunicationSession(io),
    };
  }

  #normalizeError(error: unknown): FilesystemError {
    if (error instanceof FilesystemError) {
      return error;
    }
    if (error instanceof Error) {
      return new FilesystemError("io-failure", error.message, { cause: error });
    }
    return new FilesystemError("io-failure", "Filesystem operation failed.");
  }
}
