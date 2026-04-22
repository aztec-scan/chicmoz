import { RouterProvider, createRouter } from "@tanstack/react-router";
import { type FC } from "react";
import { useWebSocketConnection } from "~/hooks";
import { routeTree } from "../routeTree.gen";

const router = createRouter({
  routeTree,
  defaultPendingComponent: () => null,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const TanstackRouterProvider: FC = () => {
  useWebSocketConnection();
  return <RouterProvider router={router} />;
};
