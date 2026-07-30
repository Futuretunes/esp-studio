import { createDevice, type Device } from "./Device";
import type { DeviceId, ProviderId } from "./DeviceInfo";
import type { DeviceConnectOptions, DeviceProvider } from "./DeviceProvider";
import type { DeviceInfo } from "./DeviceInfo";

/**
 * Base error for Device Layer failures.
 */
export class DeviceError extends Error {
  /**
   * @param message - Human-readable error message.
   * @param options - Standard `Error` options (for example `cause`).
   */
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DeviceError";
  }
}

/**
 * Thrown when a provider id is not registered with the manager.
 */
export class UnknownProviderError extends DeviceError {
  /** Provider id that was requested. */
  public readonly providerId: ProviderId;

  /**
   * @param providerId - Unknown provider id.
   */
  public constructor(providerId: ProviderId) {
    super(`Unknown device provider: ${providerId}`);
    this.name = "UnknownProviderError";
    this.providerId = providerId;
  }
}

/**
 * Thrown when a provider reports it is unavailable in the current runtime.
 */
export class ProviderUnavailableError extends DeviceError {
  /** Provider id that was unavailable. */
  public readonly providerId: ProviderId;

  /**
   * @param providerId - Unavailable provider id.
   */
  public constructor(providerId: ProviderId) {
    super(`Device provider is unavailable: ${providerId}`);
    this.name = "ProviderUnavailableError";
    this.providerId = providerId;
  }
}

/**
 * Thrown when a connected device id cannot be found.
 */
export class UnknownDeviceError extends DeviceError {
  /** Device id that was requested. */
  public readonly deviceId: DeviceId;

  /**
   * @param deviceId - Unknown device id.
   */
  public constructor(deviceId: DeviceId) {
    super(`Unknown connected device: ${deviceId}`);
    this.name = "UnknownDeviceError";
    this.deviceId = deviceId;
  }
}

/**
 * Orchestrates device providers and connected device handles.
 *
 * The manager is transport-agnostic: inject providers with
 * {@link DeviceManager.registerProvider}, then connect through provider ids.
 * It never imports browser APIs.
 */
export class DeviceManager {
  readonly #providers = new Map<ProviderId, DeviceProvider>();
  readonly #devices = new Map<DeviceId, Device>();

  /**
   * Registers a device provider.
   *
   * Re-registering the same `provider.id` replaces the previous registration.
   *
   * @param provider - Provider implementation to register.
   */
  public registerProvider(provider: DeviceProvider): void {
    this.#providers.set(provider.id, provider);
  }

  /**
   * Removes a previously registered provider.
   *
   * Does not disconnect devices already opened through that provider.
   *
   * @param providerId - Provider id to remove.
   */
  public unregisterProvider(providerId: ProviderId): void {
    this.#providers.delete(providerId);
  }

  /**
   * Returns a registered provider by id.
   *
   * @param providerId - Provider id to look up.
   * @returns The provider, or `undefined` if not registered.
   */
  public getProvider(providerId: ProviderId): DeviceProvider | undefined {
    return this.#providers.get(providerId);
  }

  /**
   * Lists all registered providers in registration-map iteration order.
   *
   * @returns A readonly snapshot of providers.
   */
  public listProviders(): readonly DeviceProvider[] {
    return [...this.#providers.values()];
  }

  /**
   * Aggregates `listDevices()` results from every registered provider.
   *
   * Providers that throw are skipped so one failing transport does not block
   * others; failures surface when connecting to that specific provider.
   *
   * @returns Combined device info snapshots.
   */
  public async listDevices(): Promise<readonly DeviceInfo[]> {
    const results: DeviceInfo[] = [];

    for (const provider of this.#providers.values()) {
      try {
        const devices = await provider.listDevices();
        results.push(...devices);
      } catch {
        // Ignore enumeration failures from individual providers.
      }
    }

    return results;
  }

  /**
   * Requests a device from the given provider and opens a connection.
   *
   * @param providerId - Registered provider id.
   * @param options - Optional connect options.
   * @returns A connected {@link Device} handle.
   * @throws {UnknownProviderError} When the provider is not registered.
   * @throws {ProviderUnavailableError} When `isAvailable()` is false.
   */
  public async connect(
    providerId: ProviderId,
    options?: DeviceConnectOptions,
  ): Promise<Device> {
    const provider = this.#providers.get(providerId);
    if (!provider) {
      throw new UnknownProviderError(providerId);
    }

    const available = await provider.isAvailable();
    if (!available) {
      throw new ProviderUnavailableError(providerId);
    }

    this.#throwIfAborted(options?.signal);

    const info =
      options === undefined
        ? await provider.requestDevice()
        : await provider.requestDevice(options);

    this.#throwIfAborted(options?.signal);

    const connection =
      options === undefined
        ? await provider.connect(info)
        : await provider.connect(info, options);

    const device = createDevice(info, connection);
    this.#devices.set(device.id, device);
    return device;
  }

  /**
   * Opens a connection to an already-known {@link DeviceInfo} snapshot.
   *
   * Unlike {@link DeviceManager.connect}, this does **not** call
   * `requestDevice()`. Use it after `listDevices()` when reconnecting to a
   * previously authorized port without showing the chooser again.
   *
   * @param providerId - Registered provider id (must match `info.providerId`).
   * @param info - Device metadata previously returned by the provider.
   * @param options - Optional connect options.
   * @returns A connected {@link Device} handle.
   * @throws {UnknownProviderError} When the provider is not registered.
   * @throws {ProviderUnavailableError} When `isAvailable()` is false.
   * @throws {DeviceError} When `info.providerId` does not match `providerId`.
   */
  public async connectToDevice(
    providerId: ProviderId,
    info: DeviceInfo,
    options?: DeviceConnectOptions,
  ): Promise<Device> {
    if (info.providerId !== providerId) {
      throw new DeviceError(
        `Device provider mismatch: expected "${providerId}", got "${info.providerId}"`,
      );
    }

    const provider = this.#providers.get(providerId);
    if (!provider) {
      throw new UnknownProviderError(providerId);
    }

    const available = await provider.isAvailable();
    if (!available) {
      throw new ProviderUnavailableError(providerId);
    }

    this.#throwIfAborted(options?.signal);

    const connection =
      options === undefined
        ? await provider.connect(info)
        : await provider.connect(info, options);

    const device = createDevice(info, connection);
    this.#devices.set(device.id, device);
    return device;
  }

  /**
   * Returns a connected device handle by id.
   *
   * @param deviceId - Device id to look up.
   * @returns The device, or `undefined` if not connected via this manager.
   */
  public getDevice(deviceId: DeviceId): Device | undefined {
    return this.#devices.get(deviceId);
  }

  /**
   * Updates metadata on a connected device without reconnecting.
   *
   * Replaces the tracked {@link Device} handle while preserving the live
   * {@link import("./DeviceConnection").DeviceConnection}.
   *
   * @param deviceId - Connected device id.
   * @param patch - Fields to merge into {@link DeviceInfo}.
   * @returns The updated device handle.
   * @throws {UnknownDeviceError} When the device is not tracked.
   */
  public updateDeviceInfo(
    deviceId: DeviceId,
    patch: {
      readonly chipFamily?: DeviceInfo["chipFamily"];
      readonly name?: string;
      readonly metadata?: Readonly<Record<string, string>>;
    },
  ): Device {
    const existing = this.#devices.get(deviceId);
    if (!existing) {
      throw new UnknownDeviceError(deviceId);
    }

    const nextInfo: DeviceInfo = {
      id: existing.info.id,
      name: patch.name ?? existing.info.name,
      providerId: existing.info.providerId,
      chipFamily: patch.chipFamily ?? existing.info.chipFamily,
      ...(existing.info.transportLabel !== undefined
        ? { transportLabel: existing.info.transportLabel }
        : {}),
      ...(patch.metadata !== undefined
        ? { metadata: patch.metadata }
        : existing.info.metadata !== undefined
          ? { metadata: existing.info.metadata }
          : {}),
    };

    const updated = createDevice(nextInfo, existing.connection);
    this.#devices.set(deviceId, updated);
    return updated;
  }

  /**
   * Lists devices currently tracked as connected by this manager.
   *
   * @returns A readonly snapshot of connected devices.
   */
  public listConnectedDevices(): readonly Device[] {
    return [...this.#devices.values()];
  }

  /**
   * Disconnects a tracked device and removes it from the active set.
   *
   * @param deviceId - Device id to disconnect.
   * @throws {UnknownDeviceError} When the device is not tracked.
   */
  public async disconnect(deviceId: DeviceId): Promise<void> {
    const device = this.#devices.get(deviceId);
    if (!device) {
      throw new UnknownDeviceError(deviceId);
    }

    try {
      await device.disconnect();
    } finally {
      this.#devices.delete(deviceId);
    }
  }

  /**
   * Disconnects every tracked device.
   *
   * Attempts all disconnects even if individual calls fail. If any fail, the
   * first error is rethrown after cleanup.
   */
  public async disconnectAll(): Promise<void> {
    const devices = [...this.#devices.values()];
    const errors: unknown[] = [];

    for (const device of devices) {
      try {
        await this.disconnect(device.id);
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors[0] !== undefined) {
      const firstError = errors[0];
      if (firstError instanceof Error) {
        throw firstError;
      }
      throw new DeviceError("Failed to disconnect one or more devices", {
        cause: firstError,
      });
    }
  }

  #throwIfAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted) {
      throw new DeviceError("Device connection aborted", {
        cause: signal.reason,
      });
    }
  }
}
