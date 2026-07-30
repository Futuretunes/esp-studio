/**
 * Orchestrates filesystem browse and transfer behind {@link EspFilesystemAdapter}.
 *
 * Acquires exclusive {@link CommunicationSession} ownership (`filesystem-browser`),
 * never imports `esptool-js`, and never talks to Web Serial from the UI layer.
 */

import { EspToolAdapter } from "@/adapters/esptool";
import { EspFilesystemAdapter } from "@/adapters/filesystem";
import {
  CommunicationOwnershipError,
  type CommunicationLock,
} from "@/core/communication";
import {
  formatDeviceBusyMessage,
  type DeviceManager,
  type DeviceOperationLock,
} from "@/core/device";
import { FILESYSTEM_BROWSER_OWNER_ID } from "@/features/filesystem/constants";
import type {
  FilesystemEntry,
  FilesystemPath,
} from "@/features/filesystem/FileEntry";
import { FilesystemError } from "@/features/filesystem/FilesystemError";
import type { FilesystemTransferProgressListener } from "@/features/filesystem/FilesystemTransferProgress";
import {
  WebSerialProvider,
  WEB_SERIAL_PROVIDER_ID,
} from "@/providers/web-serial";

/**
 * Options for {@link FilesystemService.uploadFile}.
 */
export type FilesystemUploadOptions = {
  readonly overwrite?: boolean;
  readonly onProgress?: FilesystemTransferProgressListener;
};

/**
 * Options for {@link FilesystemService.downloadFile}.
 */
export type FilesystemDownloadOptions = {
  readonly onProgress?: FilesystemTransferProgressListener;
};

/**
 * Filesystem browse + transfer service for connected ESP devices.
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
    adapter: EspFilesystemAdapter = new EspFilesystemAdapter(
      new EspToolAdapter(),
    ),
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
    return this.#withOwnership(deviceId, async (port) => {
      return this.#adapter.listDirectory(port, path);
    });
  }

  /**
   * Downloads file bytes from the device filesystem.
   *
   * @param deviceId - Connected device id
   * @param path - Absolute file path
   * @param options - Optional progress listener
   */
  async downloadFile(
    deviceId: string,
    path: FilesystemPath,
    options: FilesystemDownloadOptions = {},
  ): Promise<Uint8Array> {
    return this.#withOwnership(deviceId, async (port) => {
      return this.#adapter.readFile(port, path, {
        ...(options.onProgress !== undefined
          ? { onProgress: options.onProgress }
          : {}),
      });
    });
  }

  /**
   * Uploads file bytes to the device filesystem.
   *
   * @param deviceId - Connected device id
   * @param path - Absolute file path
   * @param data - Payload to write
   * @param options - Overwrite + progress
   */
  async uploadFile(
    deviceId: string,
    path: FilesystemPath,
    data: Uint8Array,
    options: FilesystemUploadOptions = {},
  ): Promise<void> {
    await this.#withOwnership(deviceId, async (port) => {
      await this.#adapter.writeFile(port, path, data, {
        ...(options.overwrite !== undefined
          ? { overwrite: options.overwrite }
          : {}),
        ...(options.onProgress !== undefined
          ? { onProgress: options.onProgress }
          : {}),
      });
    });
  }

  /**
   * Deletes a file or recursively deletes files under a directory prefix.
   */
  async deletePath(
    deviceId: string,
    path: FilesystemPath,
    options: FilesystemUploadOptions = {},
  ): Promise<void> {
    await this.#withOwnership(deviceId, async (port) => {
      await this.#adapter.deletePath(port, path, {
        ...(options.onProgress !== undefined
          ? { onProgress: options.onProgress }
          : {}),
      });
    });
  }

  /**
   * Renames a file within the same volume.
   */
  async renamePath(
    deviceId: string,
    fromPath: FilesystemPath,
    toPath: FilesystemPath,
    options: FilesystemUploadOptions = {},
  ): Promise<void> {
    await this.#withOwnership(deviceId, async (port) => {
      await this.#adapter.renamePath(port, fromPath, toPath, {
        ...(options.overwrite !== undefined
          ? { overwrite: options.overwrite }
          : {}),
        ...(options.onProgress !== undefined
          ? { onProgress: options.onProgress }
          : {}),
      });
    });
  }

  /**
   * Creates a directory marker on SPIFFS volumes.
   */
  async createDirectory(
    deviceId: string,
    path: FilesystemPath,
    options: FilesystemUploadOptions = {},
  ): Promise<void> {
    await this.#withOwnership(deviceId, async (port) => {
      await this.#adapter.createDirectory(port, path, {
        ...(options.onProgress !== undefined
          ? { onProgress: options.onProgress }
          : {}),
      });
    });
  }

  /**
   * Returns volume statistics for a volume root path.
   */
  async getVolumeStats(deviceId: string, volumePath: FilesystemPath) {
    return this.#withOwnership(deviceId, async (port) => {
      return this.#adapter.getVolumeStats(port, volumePath);
    });
  }

  async #withOwnership<T>(
    deviceId: string,
    run: (
      port: NonNullable<ReturnType<WebSerialProvider["getNativePort"]>>,
    ) => Promise<T>,
  ): Promise<T> {
    let lock: CommunicationLock | undefined;
    let operationLock: DeviceOperationLock | undefined;

    try {
      const target = this.#resolveTarget(deviceId);
      operationLock = target.operationLock;

      try {
        lock = operationLock.claim(FILESYSTEM_BROWSER_OWNER_ID);
      } catch (error) {
        if (error instanceof CommunicationOwnershipError) {
          throw new FilesystemError(
            "busy",
            formatDeviceBusyMessage(operationLock.ownerId, "filesystem"),
            { cause: error },
          );
        }
        throw error;
      }

      return await run(target.port);
    } catch (error) {
      throw this.#normalizeError(error);
    } finally {
      if (operationLock !== undefined && lock !== undefined) {
        try {
          operationLock.release(lock);
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
    readonly operationLock: DeviceOperationLock;
  } {
    const device = this.#manager.getDevice(deviceId);
    const io = device?.connection.io;
    if (!device || !io) {
      throw new FilesystemError(
        "no-device",
        "Cannot use the filesystem: device has no byte transport. Reconnect and retry.",
      );
    }

    if (io.state !== "closed") {
      throw new FilesystemError(
        "busy",
        formatDeviceBusyMessage(
          this.#manager.getOperationOwner(deviceId) ?? "serial-monitor",
          "filesystem",
        ),
      );
    }

    const provider = this.#manager.getProvider(WEB_SERIAL_PROVIDER_ID);
    if (!(provider instanceof WebSerialProvider)) {
      throw new FilesystemError(
        "unsupported",
        "Filesystem operations currently require the Web Serial provider.",
      );
    }

    const nativePort = provider.getNativePort(deviceId);
    if (!nativePort) {
      throw new FilesystemError(
        "no-device",
        "Cannot use the filesystem: native serial port is unavailable for this device.",
      );
    }

    return {
      port: nativePort,
      operationLock: this.#manager.getOperationLock(deviceId),
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
