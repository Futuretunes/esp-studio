import { useEffect, useRef, type JSX } from "react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSerialMonitor } from "@/features/serial/use-serial-monitor";

/**
 * Minimal Serial Monitor panel: live UTF-8 output, send, clear, connect.
 */
export function SerialMonitorPanel(): JSX.Element {
  const {
    activeDevice,
    webSerialSupported,
    isConnecting,
    isDisconnecting,
    isMonitoring,
    isSending,
    output,
    input,
    setInput,
    errorMessage,
    handleConnect,
    handleDisconnect,
    handleSend,
    clearOutput,
    restartMonitor,
  } = useSerialMonitor();

  const outputEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ block: "end" });
  }, [output]);

  const unsupported = webSerialSupported === false;
  const streamEnded =
    errorMessage !== null &&
    (errorMessage.toLowerCase().includes("stream ended") ||
      errorMessage.toLowerCase().includes("disconnected"));

  return (
    <div className="space-y-4">
      {unsupported ? (
        <Alert variant="warning">
          <AlertTitle>Browser unsupported</AlertTitle>
          <AlertDescription>
            Web Serial is required for the Serial Monitor. Use a Chromium-based
            browser on HTTPS or localhost.
          </AlertDescription>
        </Alert>
      ) : null}

      {!activeDevice && !unsupported && !errorMessage ? (
        <Alert variant="info">
          <AlertTitle>No device connected</AlertTitle>
          <AlertDescription>
            Connect here or from the{" "}
            <Link to="/devices" className="underline underline-offset-4">
              Devices
            </Link>{" "}
            page to start monitoring.
          </AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Serial Monitor</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{errorMessage}</p>
            <div className="flex flex-wrap gap-2">
              {streamEnded && activeDevice ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isMonitoring || isConnecting || isDisconnecting}
                  onClick={restartMonitor}
                >
                  Restart monitor
                </Button>
              ) : null}
              {!activeDevice ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={unsupported || isConnecting}
                  onClick={() => {
                    void handleConnect();
                  }}
                >
                  Reconnect
                </Button>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Session</CardTitle>
            <CardDescription>
              {activeDevice
                ? `${activeDevice.name} · ${activeDevice.providerLabel}`
                : "No device connected"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isMonitoring ? "success" : "secondary"}>
              {isMonitoring ? "monitoring" : "idle"}
            </Badge>
            {activeDevice ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDisconnecting || isConnecting}
                onClick={() => {
                  void handleDisconnect();
                }}
              >
                {isDisconnecting ? "Disconnecting…" : "Disconnect"}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={unsupported || isConnecting}
                onClick={() => {
                  void handleConnect();
                }}
              >
                {isConnecting ? "Connecting…" : "Connect Device"}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Output</CardTitle>
            <CardDescription>
              Live UTF-8 decode from TransportIo
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearOutput}
            disabled={output.length === 0}
          >
            Clear
          </Button>
        </CardHeader>
        <CardContent>
          {!activeDevice ? (
            <p className="text-muted-foreground text-sm">
              Connect a device to view serial output.
            </p>
          ) : (
            <ScrollArea className="border-border bg-muted/20 h-80 rounded-md border">
              <pre className="p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
                {output.length > 0
                  ? output
                  : isMonitoring
                    ? "Waiting for serial data…"
                    : "Monitor idle — restart if the stream ended."}
                <div ref={outputEndRef} />
              </pre>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send</CardTitle>
          <CardDescription>
            Text is encoded with TextEncoder and written as raw bytes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              void handleSend(event);
            }}
          >
            <Input
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
              placeholder="Type text to send…"
              disabled={!isMonitoring || isSending}
              aria-label="Serial input"
            />
            <Button
              type="submit"
              disabled={!isMonitoring || isSending || input.length === 0}
            >
              {isSending ? "Sending…" : "Send"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
