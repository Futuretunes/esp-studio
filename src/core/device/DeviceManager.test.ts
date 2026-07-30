import { describe, expect, it } from "vitest";

import type {
  DeviceConnectOptions,
  DeviceConnection,
  DeviceInfo,
  DeviceProvider,
} from "@/core/device";
import { DeviceManager } from "@/core/device";

function createFakeConnection(): DeviceConnection {
  let state: DeviceConnection["state"] = "connected";
  return {
    get state() {
      return state;
    },
    capabilities: {
      serial: true,
      flash: false,
      filesystem: false,
      ota: false,
      baudRateControl: false,
    },
    close() {
      state = "disconnected";
      return Promise.resolve();
    },
  };
}

function createFakeProvider(): DeviceProvider {
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
      return Promise.resolve(createFakeConnection());
    },
  };
}

describe("DeviceManager", () => {
  it("connects, tracks, and disconnects devices", async () => {
    const manager = new DeviceManager();
    manager.registerProvider(createFakeProvider());

    const device = await manager.connect("fake");
    expect(device.id).toBe("fake:1");
    expect(manager.getDevice("fake:1")?.id).toBe("fake:1");
    expect(manager.listConnectedDevices()).toHaveLength(1);

    await manager.disconnect("fake:1");
    expect(manager.getDevice("fake:1")).toBeUndefined();
    expect(manager.listConnectedDevices()).toHaveLength(0);
  });

  it("reconnects to a known device without requestDevice", async () => {
    const manager = new DeviceManager();
    const provider = createFakeProvider();
    manager.registerProvider(provider);

    const listedDevices = await manager.listDevices();
    const listed = listedDevices[0];
    expect(listed).toBeDefined();
    if (!listed) {
      throw new Error("expected listed device");
    }

    const device = await manager.connectToDevice("fake", listed);
    expect(device.connection.state).toBe("connected");
    await manager.disconnect(device.id);
  });
});
