import { describe, expect, it } from "vitest";

import type { TransportIo, TransportIoState } from "@/core/transport";
import {
  DeviceManager,
  DeviceOperationLock,
  formatDeviceBusyMessage,
} from "@/core/device";
import type {
  DeviceConnectOptions,
  DeviceConnection,
  DeviceInfo,
  DeviceProvider,
} from "@/core/device";
import { CommunicationOwnershipError } from "@/core/communication";
import { FLASH_SERVICE_OWNER_ID } from "@/features/flash/constants";
import { CHIP_IDENTIFICATION_OWNER_ID } from "@/features/identification/constants";
import { FILESYSTEM_BROWSER_OWNER_ID } from "@/features/filesystem/constants";
import { SERIAL_MONITOR_OWNER_ID } from "@/features/serial/constants";

function createFakeIo(): TransportIo {
  let state: TransportIoState = "closed";
  return {
    get state() {
      return state;
    },
    open() {
      state = "open";
      return Promise.resolve();
    },
    close() {
      state = "closed";
      return Promise.resolve();
    },
    read() {
      return Promise.resolve(null);
    },
    write() {
      return Promise.resolve();
    },
    flush() {
      return Promise.resolve();
    },
  };
}

function createFakeConnection(io: TransportIo): DeviceConnection {
  let state: DeviceConnection["state"] = "connected";
  return {
    get state() {
      return state;
    },
    capabilities: {
      serial: true,
      flash: true,
      filesystem: true,
      ota: false,
      baudRateControl: true,
    },
    io,
    close() {
      state = "disconnected";
      return io.close();
    },
  };
}

function createFakeProvider(io: TransportIo): DeviceProvider {
  const info: DeviceInfo = {
    id: "fake:1",
    name: "Fake Device",
    providerId: "fake",
    chipFamily: "esp32",
    transportLabel: "fake",
  };

  return {
    id: "fake",
    label: "Fake",
    isAvailable() {
      return true;
    },
    listDevices() {
      return Promise.resolve([info]);
    },
    requestDevice(_options?: DeviceConnectOptions) {
      return Promise.resolve(info);
    },
    connect(_info: DeviceInfo, _options?: DeviceConnectOptions) {
      return Promise.resolve(createFakeConnection(io));
    },
  };
}

describe("formatDeviceBusyMessage", () => {
  it("asks to stop Serial Monitor before flashing", () => {
    expect(formatDeviceBusyMessage("serial-monitor", "flash")).toBe(
      "Stop the Serial Monitor before flashing.",
    );
  });

  it("names the active owner for other tools", () => {
    expect(formatDeviceBusyMessage("flash-service", "identify")).toBe(
      "Device is busy (Flash in progress).",
    );
  });
});

describe("DeviceOperationLock", () => {
  it("allows only one owner at a time", () => {
    const lock = new DeviceOperationLock(createFakeIo());
    const flash = lock.claim(FLASH_SERVICE_OWNER_ID);
    expect(lock.ownerId).toBe(FLASH_SERVICE_OWNER_ID);
    expect(() => lock.claim(CHIP_IDENTIFICATION_OWNER_ID)).toThrow(
      CommunicationOwnershipError,
    );
    lock.release(flash);
    expect(lock.ownerId).toBeNull();
    const identify = lock.claim(CHIP_IDENTIFICATION_OWNER_ID);
    lock.release(identify);
  });

  it("releases after exception in finally-style usage", () => {
    const lock = new DeviceOperationLock(createFakeIo());
    const claim = lock.claim(FILESYSTEM_BROWSER_OWNER_ID);
    try {
      throw new Error("boom");
    } catch {
      /* expected */
    } finally {
      lock.release(claim);
    }
    expect(lock.ownerId).toBeNull();
    const next = lock.claim(FLASH_SERVICE_OWNER_ID);
    lock.release(next);
  });

  it("clears ownership on dispose", async () => {
    const lock = new DeviceOperationLock(createFakeIo());
    lock.claim(SERIAL_MONITOR_OWNER_ID);
    expect(lock.ownerId).toBe(SERIAL_MONITOR_OWNER_ID);
    await lock.dispose();
    expect(lock.ownerId).toBeNull();
  });
});

describe("DeviceManager operation lock", () => {
  it("shares one lock across Flash vs Identify vs Filesystem vs Serial", async () => {
    const io = createFakeIo();
    const manager = new DeviceManager();
    manager.registerProvider(createFakeProvider(io));
    const device = await manager.connect("fake");
    const operationLock = manager.getOperationLock(device.id);

    const flash = operationLock.claim(FLASH_SERVICE_OWNER_ID);
    expect(manager.getOperationOwner(device.id)).toBe(FLASH_SERVICE_OWNER_ID);

    expect(() =>
      manager.getOperationLock(device.id).claim(CHIP_IDENTIFICATION_OWNER_ID),
    ).toThrow(CommunicationOwnershipError);
    expect(() =>
      manager.getOperationLock(device.id).claim(FILESYSTEM_BROWSER_OWNER_ID),
    ).toThrow(CommunicationOwnershipError);
    expect(() =>
      manager.getOperationLock(device.id).claim(SERIAL_MONITOR_OWNER_ID),
    ).toThrow(CommunicationOwnershipError);

    operationLock.release(flash);
    const identify = operationLock.claim(CHIP_IDENTIFICATION_OWNER_ID);
    expect(() =>
      manager.getOperationLock(device.id).claim(FILESYSTEM_BROWSER_OWNER_ID),
    ).toThrow(CommunicationOwnershipError);
    operationLock.release(identify);
  });

  it("notifies subscribers and clears ownership on disconnect", async () => {
    const io = createFakeIo();
    const manager = new DeviceManager();
    manager.registerProvider(createFakeProvider(io));
    const device = await manager.connect("fake");

    const events: (string | null)[] = [];
    const unsubscribe = manager.subscribeOperationOwner((_id, ownerId) => {
      events.push(ownerId);
    });

    const lock = manager.getOperationLock(device.id);
    const claim = lock.claim(FLASH_SERVICE_OWNER_ID);
    expect(events.at(-1)).toBe(FLASH_SERVICE_OWNER_ID);
    lock.release(claim);
    expect(events.at(-1)).toBeNull();

    const held = lock.claim(CHIP_IDENTIFICATION_OWNER_ID);
    expect(held.ownerId).toBe(CHIP_IDENTIFICATION_OWNER_ID);
    await manager.disconnect(device.id);
    expect(manager.getOperationOwner(device.id)).toBeNull();
    expect(events.at(-1)).toBeNull();
    unsubscribe();
  });

  it("does not leave stale ownership after success", async () => {
    const io = createFakeIo();
    const manager = new DeviceManager();
    manager.registerProvider(createFakeProvider(io));
    const device = await manager.connect("fake");
    const lock = manager.getOperationLock(device.id);

    const claim = lock.claim(FLASH_SERVICE_OWNER_ID);
    lock.release(claim);
    expect(manager.getOperationOwner(device.id)).toBeNull();

    const again = lock.claim(FILESYSTEM_BROWSER_OWNER_ID);
    lock.release(again);
    expect(manager.getOperationOwner(device.id)).toBeNull();
  });
});

describe("Flash vs Serial ownership ordering", () => {
  it("blocks Serial claim while Flash owns the device", async () => {
    const io = createFakeIo();
    const manager = new DeviceManager();
    manager.registerProvider(createFakeProvider(io));
    const device = await manager.connect("fake");
    const lock = manager.getOperationLock(device.id);

    const flash = lock.claim(FLASH_SERVICE_OWNER_ID);
    expect(() => lock.claim(SERIAL_MONITOR_OWNER_ID)).toThrow(
      CommunicationOwnershipError,
    );
    lock.release(flash);

    const serial = lock.claim(SERIAL_MONITOR_OWNER_ID);
    await lock.session.open();
    expect(io.state).toBe("open");
    expect(() => lock.claim(FLASH_SERVICE_OWNER_ID)).toThrow(
      CommunicationOwnershipError,
    );
    lock.release(serial);
    await lock.session.close();
    expect(io.state).toBe("closed");
  });
});
