import { afterEach, describe, expect, it, vi } from "vitest";

import { WebSerialConnection } from "@/providers/web-serial/WebSerialConnection";
import { WebSerialProvider } from "@/providers/web-serial/WebSerialProvider";
import type { WebSerialPort } from "@/providers/web-serial/types";

function createMockPort(options?: {
  forget?: () => Promise<void>;
}): WebSerialPort & {
  emitDisconnect: () => void;
  closeCalls: number;
} {
  const listeners = new Set<(ev: Event) => void>();
  let closeCalls = 0;
  const port: WebSerialPort & {
    emitDisconnect: () => void;
    closeCalls: number;
  } = {
    readable: null,
    writable: null,
    getInfo() {
      return { usbVendorId: 0x10c4, usbProductId: 0xea60 };
    },
    open() {
      return Promise.resolve();
    },
    close() {
      closeCalls += 1;
      port.closeCalls = closeCalls;
      return Promise.resolve();
    },
    addEventListener(_type, listener) {
      listeners.add(listener);
    },
    removeEventListener(_type, listener) {
      listeners.delete(listener);
    },
    emitDisconnect() {
      for (const listener of listeners) {
        listener(new Event("disconnect"));
      }
    },
    closeCalls: 0,
  };

  if (options?.forget) {
    port.forget = options.forget;
  }

  return port;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WebSerialConnection intentional close", () => {
  it("invokes onClosed after port.close()", async () => {
    const port = createMockPort();
    const onClosed = vi.fn();
    const connection = new WebSerialConnection(port, { onClosed });

    await connection.close();

    expect(port.closeCalls).toBe(1);
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(connection.state).toBe("disconnected");
  });

  it("does not call onClosed for unexpected browser disconnect", async () => {
    const port = createMockPort();
    const onClosed = vi.fn();
    const onUnexpectedDisconnect = vi.fn();
    const connection = new WebSerialConnection(port, {
      onClosed,
      onUnexpectedDisconnect,
    });

    port.emitDisconnect();
    await vi.waitFor(() => {
      expect(connection.state).toBe("disconnected");
    });

    expect(onUnexpectedDisconnect).toHaveBeenCalledTimes(1);
    expect(onClosed).not.toHaveBeenCalled();
  });
});

describe("WebSerialProvider.forgetPort", () => {
  it("closes, forgets, and drops the remembered port", async () => {
    const forget = vi.fn().mockResolvedValue(undefined);
    const port = createMockPort({ forget });
    const provider = new WebSerialProvider();

    const serial = {
      getPorts: () => Promise.resolve([port]),
      requestPort: () => Promise.resolve(port),
    };
    vi.stubGlobal("navigator", { serial });

    const info = await provider.requestDevice();
    await provider.forgetPort(info.id);

    expect(port.closeCalls).toBeGreaterThanOrEqual(1);
    expect(forget).toHaveBeenCalledTimes(1);
    expect(provider.getNativePort(info.id)).toBeUndefined();
  });
});
