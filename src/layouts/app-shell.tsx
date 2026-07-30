import { Menu, PanelLeftClose, PanelLeftOpen, Zap } from "lucide-react";
import type { JSX } from "react";
import { NavLink } from "react-router-dom";

import { NAV_ICONS } from "@/app/nav-icons";
import { NAV_ITEMS } from "@/app/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDeviceOperationOwnerLabel } from "@/core/device";
import { cn } from "@/lib/utils";
import { useDeviceStore, useUiStore } from "@/store";

type AppSidebarProps = {
  className?: string;
};

export function AppSidebar({ className }: AppSidebarProps): JSX.Element {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const setMobileSidebarOpen = useUiStore(
    (state) => state.setMobileSidebarOpen,
  );
  const activeDevice = useDeviceStore((state) => state.activeDevice);

  return (
    <aside
      className={cn(
        "border-sidebar-border bg-sidebar text-sidebar-foreground flex h-full flex-col border-r",
        className,
      )}
    >
      <div
        className={cn(
          "border-sidebar-border flex h-14 items-center gap-2 border-b px-3",
          sidebarCollapsed && "justify-center px-2",
        )}
      >
        <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Zap className="size-4" aria-hidden />
        </div>
        {!sidebarCollapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              ESP Studio
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              ESP8266 & ESP32
            </p>
          </div>
        ) : null}
      </div>

      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-1 px-2" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.id];

            const link = (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/"}
                aria-label={sidebarCollapsed ? item.label : undefined}
                onClick={() => {
                  setMobileSidebarOpen(false);
                }}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    sidebarCollapsed && "justify-center px-2",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                  )
                }
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {!sidebarCollapsed ? <span>{item.label}</span> : null}
              </NavLink>
            );

            if (!sidebarCollapsed) {
              return link;
            }

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-sidebar-border border-t p-3">
        {!sidebarCollapsed ? (
          <div className="border-sidebar-border bg-sidebar-accent/40 rounded-lg border px-3 py-2.5">
            <p className="text-xs font-medium">Device</p>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {activeDevice
                ? `${activeDevice.name} · ${activeDevice.status}`
                : "No device connected"}
            </p>
          </div>
        ) : (
          <div
            role="status"
            className={cn(
              "mx-auto size-2.5 rounded-full",
              activeDevice?.status === "connected"
                ? "bg-emerald-400"
                : "bg-muted-foreground/40",
            )}
            aria-label={
              activeDevice
                ? `${activeDevice.name} · ${activeDevice.status}`
                : "No device connected"
            }
            title={
              activeDevice
                ? `${activeDevice.name} · ${activeDevice.status}`
                : "No device connected"
            }
          />
        )}
      </div>
    </aside>
  );
}

export function AppHeader(): JSX.Element {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebarCollapsed = useUiStore(
    (state) => state.toggleSidebarCollapsed,
  );
  const setMobileSidebarOpen = useUiStore(
    (state) => state.setMobileSidebarOpen,
  );
  const activeDevice = useDeviceStore((state) => state.activeDevice);
  const operationOwner = useDeviceStore((state) => state.operationOwner);

  return (
    <header className="border-border bg-background/80 supports-backdrop-filter:bg-background/60 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => {
          setMobileSidebarOpen(true);
        }}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={toggleSidebarCollapsed}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </Button>

      <Separator orientation="vertical" className="hidden h-5 md:block" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">ESP Studio</p>
        <p className="text-muted-foreground truncate text-xs">
          Browser-based ESP development platform
        </p>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
            activeDevice?.status === "connected"
              ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-300"
              : "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              activeDevice?.status === "connected"
                ? "bg-emerald-600 dark:bg-emerald-400"
                : "bg-muted-foreground/50",
            )}
          />
          {activeDevice?.status === "connected"
            ? operationOwner
              ? `Busy · ${formatDeviceOperationOwnerLabel(operationOwner)}`
              : "Connected"
            : "Disconnected"}
        </span>
      </div>
    </header>
  );
}
