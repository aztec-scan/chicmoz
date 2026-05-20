import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type FC, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Data stays fresh for 10s by default — so navigating between pages
      // doesn't retrigger requests for data that was just fetched. Hooks
      // that genuinely need different freshness set their own staleTime.
      staleTime: 10_000,
    },
  },
});

export const QueryProvider: FC<Props> = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
