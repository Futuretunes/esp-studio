/**
 * Orchestrates firmware flash operations behind {@link EspToolAdapter}.
 *
 * Acquires exclusive {@link CommunicationSession} ownership (`flash-service`),
 * never imports `esptool-js`, and emits {@link FlashProgress} for future UI.
 */

import {
  EspToolAdapter,
  type EspToolSerialPort,
} from "@/adapters/esptool";
import {
  CommunicationOwnershipError,
  CommunicationSession,
} from "@/core/communication";
import type { DeviceManager } from "@/core/device";
import { FLASH_SERVICE_OWNER_ID } from "@/features/flash/constants";
import {
  FlashBusyError,
  FlashDeviceError,
  FlashError,
  FlashOperationError,
} from "@/features/flash/errors";
import type {
  FlashOperationOptions,
  FlashOptions,
  FlashVerifyOptions,
} from "@/features/flash/FlashOptions";
import {
  createFlashProgress,
  type FlashProgressListener,
} from "@/features/flash/FlashProgress";
import type { FlashResult } from "@/features/flash/FlashResult";
import {
  WebSerialProvider,
  WEB_SERIAL_PROVIDER_ID,
} from "@/providers/web-serial";

type ResolvedTarget = {
  readonly deviceId: string;
  readonly port: EspToolSerialPort;
  readonly session: CommunicationSession;
};

/**
 * Reusable flash orchestration service.
 *
 * Call from future Flash UI, tests, or other features. Do not import
 * `esptool-js` from UI layers — go through this service + adapter.
 */
export class FlashService {
  readonly #manager: DeviceManager;
  readonly #adapter: EspToolAdapter;

  /**
   * @param manager - App {@link DeviceManager}
   * @param adapter - Optional esptool adapter (defaults to a new instance)
   */
  constructor(manager: DeviceManager, adapter: EspToolAdapter = new EspToolAdapter()) {
    this.#manager = manager;
    this.#adapter = adapter;
  }

  /**
   * Identifies the connected chip and updates {@link DeviceManager} metadata.
   *
   * @param deviceId - Connected device id
   * @param options - Optional progress / baud overrides
   */
  async identify(
    deviceId: string,
    options: FlashOperationOptions = {},
  ): Promise<FlashResult> {
    return this.#run(deviceId, options, async ({ port }, adapter) => {
      this.#emit(options.onProgress, "connecting", "Syncing with ROM bootloader…", {
        percent: 20,
      });

      const identified = await adapter.identify(port);

      this.#manager.updateDeviceInfo(deviceId, {
        chipFamily: identified.chipFamily,
        metadata: {
          ...(this.#manager.getDevice(deviceId)?.info.metadata ?? {}),
          ...(identified.rawName !== undefined
            ? { espToolChipName: identified.rawName }
            : {}),
        },
      });

      return {
        success: true,
        stage: "completed",
        chipFamily: identified.chipFamily,
        ...(identified.rawName !== undefined
          ? { rawName: identified.rawName }
          : {}),
        message: `Identified ${identified.rawName ?? identified.chipFamily}`,
      } satisfies FlashResult;
    });
  }

  /**
   * Erases the entire flash chip.
   *
   * @param deviceId - Connected device id
   * @param options - Optional progress / baud overrides
   */
  async erase(
    deviceId: string,
    options: FlashOperationOptions = {},
  ): Promise<FlashResult> {
    return this.#run(deviceId, options, async ({ port }, adapter) => {
      this.#emit(options.onProgress, "connecting", "Connecting flasher stub…", {
        percent: 15,
      });
      this.#emit(options.onProgress, "erasing", "Erasing flash…", {
        percent: 40,
      });

      await adapter.erase(port);

      return {
        success: true,
        stage: "completed",
        message: "Flash erased",
      } satisfies FlashResult;
    });
  }

  /**
   * Writes firmware images to the connected device.
   *
   * @param options - Device id, images, and write parameters
   */
  async flash(options: FlashOptions): Promise<FlashResult> {
    return this.#run(options.deviceId, options, async ({ port }, adapter) => {
      this.#emit(options.onProgress, "connecting", "Connecting flasher stub…", {
        percent: 10,
      });

      if (options.eraseAll === true) {
        this.#emit(options.onProgress, "erasing", "Erasing flash before write…", {
          percent: 20,
        });
      }

      this.#emit(options.onProgress, "writing", "Writing firmware…", {
        percent: 30,
      });

      const written = await adapter.flash(port, {
        images: options.images,
        ...(options.eraseAll !== undefined ? { eraseAll: options.eraseAll } : {}),
        ...(options.compress !== undefined ? { compress: options.compress } : {}),
        ...(options.flashMode !== undefined ? { flashMode: options.flashMode } : {}),
        ...(options.flashFreq !== undefined ? { flashFreq: options.flashFreq } : {}),
        ...(options.flashSize !== undefined ? { flashSize: options.flashSize } : {}),
        onWriteProgress: (fileIndex, writtenBytes, total) => {
          const ratio = total > 0 ? writtenBytes / total : 1;
          const percent = Math.min(90, Math.round(30 + ratio * 50));
          this.#emit(options.onProgress, "writing", "Writing firmware…", {
            percent,
            fileIndex,
            bytesWritten: writtenBytes,
            bytesTotal: total,
          });
        },
      });

      this.#manager.updateDeviceInfo(options.deviceId, {
        chipFamily: written.chipFamily,
        metadata: {
          ...(this.#manager.getDevice(options.deviceId)?.info.metadata ?? {}),
          ...(written.rawName !== undefined
            ? { espToolChipName: written.rawName }
            : {}),
        },
      });

      let verify: FlashResult["verify"];

      if (options.verifyAfterWrite === true) {
        this.#emit(options.onProgress, "verifying", "Verifying flash MD5…", {
          percent: 92,
        });
        const verified = await adapter.verify(port, {
          images: options.images,
        });
        verify = verified;
        if (!verified.matched) {
          throw new FlashOperationError(
            "Flash write completed but MD5 verification failed.",
          );
        }
      }

      if (options.resetAfter === true) {
        this.#emit(options.onProgress, "resetting", "Resetting device…", {
          percent: 97,
        });
        await adapter.reset(port);
      }

      return {
        success: true,
        stage: "completed",
        chipFamily: written.chipFamily,
        ...(written.rawName !== undefined ? { rawName: written.rawName } : {}),
        message: "Flash write completed",
        ...(verify !== undefined ? { verify } : {}),
      } satisfies FlashResult;
    });
  }

  /**
   * Verifies on-device MD5 checksums for the provided images.
   *
   * @param options - Device id and images to verify
   */
  async verify(options: FlashVerifyOptions): Promise<FlashResult> {
    return this.#run(options.deviceId, options, async ({ port }, adapter) => {
      this.#emit(options.onProgress, "connecting", "Connecting flasher stub…", {
        percent: 20,
      });
      this.#emit(options.onProgress, "verifying", "Verifying flash MD5…", {
        percent: 50,
      });

      const verified = await adapter.verify(port, {
        images: options.images,
      });

      if (!verified.matched) {
        throw new FlashOperationError(
          "Flash MD5 verification failed for one or more images.",
        );
      }

      return {
        success: true,
        stage: "completed",
        message: "Flash verification matched",
        verify: verified,
      } satisfies FlashResult;
    });
  }

  /**
   * Hard-resets the connected chip.
   *
   * @param deviceId - Connected device id
   * @param options - Optional progress / baud overrides
   */
  async reset(
    deviceId: string,
    options: FlashOperationOptions = {},
  ): Promise<FlashResult> {
    return this.#run(deviceId, options, async ({ port }, adapter) => {
      this.#emit(options.onProgress, "resetting", "Resetting device…", {
        percent: 50,
      });
      await adapter.reset(port);
      return {
        success: true,
        stage: "completed",
        message: "Device reset",
      } satisfies FlashResult;
    });
  }

  async #run(
    deviceId: string,
    options: FlashOperationOptions,
    operation: (
      target: ResolvedTarget,
      adapter: EspToolAdapter,
    ) => Promise<FlashResult>,
  ): Promise<FlashResult> {
    this.#emit(options.onProgress, "preparing", "Preparing flash operation…", {
      percent: 0,
    });

    let lock: ReturnType<CommunicationSession["acquire"]> | undefined;
    let session: CommunicationSession | undefined;
    const adapter =
      options.baudRate !== undefined
        ? new EspToolAdapter(options.baudRate)
        : this.#adapter;

    try {
      const target = this.#resolveTarget(deviceId);
      session = target.session;

      try {
        lock = session.acquire(FLASH_SERVICE_OWNER_ID);
      } catch (error) {
        if (error instanceof CommunicationOwnershipError) {
          throw new FlashBusyError(
            `Cannot run flash service while another tool owns the connection (${session.ownerId ?? "unknown"}). Stop the Serial Monitor and retry.`,
            { cause: error },
          );
        }
        throw error;
      }

      const result = await operation(target, adapter);
      this.#emit(options.onProgress, "completed", result.message ?? "Done", {
        percent: 100,
      });
      return result;
    } catch (error) {
      const flashError = this.#normalizeError(error);
      this.#emit(options.onProgress, "failed", flashError.message, {
        percent: 100,
      });
      return {
        success: false,
        stage: "failed",
        message: flashError.message,
        error: flashError,
      };
    } finally {
      if (session !== undefined && lock !== undefined) {
        try {
          session.release(lock);
        } catch {
          /* Never leave an unreleased lock intentionally; ignore double-release. */
        }
      }
    }
  }

  #resolveTarget(deviceId: string): ResolvedTarget {
    const device = this.#manager.getDevice(deviceId);
    const io = device?.connection.io;
    if (!device || !io) {
      throw new FlashDeviceError(
        "Cannot flash: device has no byte transport. Reconnect and retry.",
      );
    }

    if (io.state !== "closed") {
      throw new FlashBusyError(
        "Cannot flash while another tool owns the connection. Stop the Serial Monitor and retry.",
      );
    }

    const provider = this.#manager.getProvider(WEB_SERIAL_PROVIDER_ID);
    if (!(provider instanceof WebSerialProvider)) {
      throw new FlashDeviceError(
        "Flash Service currently requires the Web Serial provider.",
      );
    }

    const nativePort = provider.getNativePort(deviceId);
    if (!nativePort) {
      throw new FlashDeviceError(
        "Cannot flash: native serial port is unavailable for this device.",
      );
    }

    return {
      deviceId,
      port: nativePort,
      session: new CommunicationSession(io),
    };
  }

  #emit(
    listener: FlashProgressListener | undefined,
    stage: Parameters<typeof createFlashProgress>[0],
    message: string,
    extras?: Parameters<typeof createFlashProgress>[2],
  ): void {
    listener?.(createFlashProgress(stage, message, extras));
  }

  #normalizeError(error: unknown): FlashError {
    if (error instanceof FlashError) {
      return error;
    }
    if (error instanceof Error) {
      return new FlashOperationError(error.message, { cause: error });
    }
    return new FlashOperationError("Flash operation failed.");
  }
}
