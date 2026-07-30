import type { JSX } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { getNavItemByPath } from "@/app/navigation";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { AppHeader, AppSidebar } from "@/layouts/app-shell";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store";

export function AppLayout(): JSX.Element {
  const location = useLocation();
  const navItem = getNavItemByPath(location.pathname);
  useDocumentTitle(navItem?.title ?? "");

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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppHeader />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 pb-10 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
