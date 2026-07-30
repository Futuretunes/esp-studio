import { describe, expect, it, vi } from "vitest";

import { WebSerialConnection } from "@/providers/web-serial/WebSerialConnection";
import type { WebSerialPort } from "@/providers/web-serial/types";

function createMockPort(): WebSerialPort & {
  emitDisconnect: () => void;
} {
  const listeners = new Set<(ev: Event) => void>();
  return {
    readable: null,
    writable: null,
    getInfo() {
      return {};
    },
    open() {
      return Promise.resolve();
    },
    close() {
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
  };
}

describe("WebSerialConnection unexpected disconnect", () => {
  it("marks the connection disconnected and invokes the hook", async () => {
    const port = createMockPort();
    const onUnexpectedDisconnect = vi.fn();
    const connection = new WebSerialConnection(port, {
      onUnexpectedDisconnect,
    });

    expect(connection.state).toBe("connected");
    port.emitDisconnect();

    await vi.waitFor(() => {
      expect(connection.state).toBe("disconnected");
    });
    expect(onUnexpectedDisconnect).toHaveBeenCalledTimes(1);

    await expect(connection.close()).resolves.toBeUndefined();
  });
});
