// Import the generated route tree
import { type FC } from "react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";
import { useWebSocketConnection } from "~/hooks";

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPendingComponent: () => null,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const TanstackRouterProvider: FC = () => {
  useWebSocketConnection();
  return <RouterProvider router={router} />;
};
