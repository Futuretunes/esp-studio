import type { JSX } from "react";
import { Outlet } from "react-router-dom";

import { ScrollArea } from "@/components/ui/scroll-area";
import { AppHeader, AppSidebar } from "@/layouts/app-shell";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store";

export function AppLayout(): JSX.Element {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore(
    (state) => state.setMobileSidebarOpen,
  );

  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <div
        className={cn(
          "hidden shrink-0 transition-[width] duration-200 md:block",
          sidebarCollapsed ? "w-[68px]" : "w-60",
        )}
      >
        <AppSidebar className="w-full" />
      </div>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close navigation overlay"
            onClick={() => {
              setMobileSidebarOpen(false);
            }}
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <AppSidebar className="w-full" />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <ScrollArea className="flex-1">
          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
