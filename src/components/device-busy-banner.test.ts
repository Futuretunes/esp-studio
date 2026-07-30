import { describe, expect, it } from "vitest";

import { deviceBusyAttemptOwner } from "@/components/device-busy-attempt";

describe("deviceBusyAttemptOwner", () => {
  it("maps page attempt contexts to operation owner ids", () => {
    expect(deviceBusyAttemptOwner("flash")).toBe("flash-service");
    expect(deviceBusyAttemptOwner("identify")).toBe("chip-identification");
    expect(deviceBusyAttemptOwner("filesystem")).toBe("filesystem-browser");
    expect(deviceBusyAttemptOwner("serial")).toBe("serial-monitor");
  });
});
