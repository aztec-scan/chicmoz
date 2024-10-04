import { createRootRoute, Outlet } from "@tanstack/react-router";
import { lazy } from "react";
import { Footer } from "~/components/footer";
import { Header } from "~/components/header";
import { TailwindIndicator } from "~/components/ui/tailwind-indicator";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "development"
    ? lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        }))
      )
    : () => null;

export const Route = createRootRoute({
  component: () => (
    <div className="flex flex-col overflow-auto min-h-screen flex-grow">
      <div className="flex-grow">
        <Header />
        <Outlet />
      </div>
      <Footer />
      <TailwindIndicator />
      <TanStackRouterDevtools />
    </div>
  ),
  notFoundComponent: notFoundComponent,
});

export const routes = {
  home: {
    route: "/",
    title: "Home",
  },
  blocks: {
    route: "/blocks",
    title: "Blocks",
    children: {
      index: {
        route: "/",
        title: "All blocks",
      },
      blockNumber: {
        route: "/$blockNumber",
        title: "Block Details",
      },
    },
  },
  txEffects: {
    route: "/tx-effects",
    title: "Tx Effects",
    children: {
      index: {
        route: "/",
        title: "All tx effects",
      },
      txHash: {
        route: "/$txHash",
        title: "Tx Effect Details",
      },
    },
  },
  contracts: {
    route: "/contracts",
    title: "Contracts",
  },
  aboutUs: {
    route: "/about-us",
    title: "About us",
  },
  privacyPolicy: {
    route: "/privacy-policy",
    title: "Privacy Policy",
  },
  termsAndConditions: {
    route: "/terms-and-conditions",
    title: "Terms and Conditions",
  },
};

function notFoundComponent() {
  return (
    <div className="mx-auto px-[70px] max-w-[1440px]">
      <h1 className="mt-16">{text.title}</h1>
      <h3 className="text-purple-dark">{text.description}</h3>
    </div>
  );
}

const text = {
  title: "404... page not found",
  description: "Page does not exist or has been moved",
};
