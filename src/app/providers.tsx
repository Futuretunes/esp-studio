import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { JSX, ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

import { DeviceManagerProvider } from "@/app/device-context";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type AppProvidersProps = {
  children: ReactNode;
};

/**
 * Application composition root for routing, query, tooltips, and devices.
 */
export function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <DeviceManagerProvider>{children}</DeviceManagerProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
