import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Footer } from "~/components/footer";
import { Header } from "~/components/header";
import { TailwindIndicator } from "~/components/ui/tailwind-indicator";

// Temporarily disabled to avoid dynamic import issues
const TanStackRouterDevtools = () => null;

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
      hash: {
        route: "/$hash",
        title: "Tx Effect Details",
      },
    },
  },
  contracts: {
    route: "/contracts",
    title: "Contracts",
    children: {
      index: {
        route: "/",
        title: "All Contracts",
      },
      instances: {
        route: "/instances",
        children: {
          address: {
            route: "/$address",
            title: "Contract Instance Details",
          },
        },
      },
      classes: {
        route: "/classes",
        children: {
          id: {
            route: "/$id",
            children: {
              versions: {
                route: "/versions",
                children: {
                  version: {
                    route: "/$version",
                    title: "Contract Class Details",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  dev: {
    route: "/dev",
    title: "Dev",
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
  verifiedContractInstances: {
    route: "/verified-contract-instances",
    title: "Verified Contract Instances",
  },
  feeRecipients: {
    route: "/fee-recipients",
    title: "Fee Recipients",
  },
  l1: {
    route: "/l1",
    title: "L1",
    children: {
      index: {
        route: "/",
        title: "L1 base",
      },
      contractEvents: {
        route: "/contract-events",
        title: "L1 Contract Events",
      },
    },
  },
  validators: {
    route: "/validators",
    title: "Validators",
    children: {
      index: {
        route: "/",
        title: "All Validators",
      },
      attesterAddress: {
        route: "/$attesterAddress",
        title: "Validator Details",
      },
    },
  },
};

function notFoundComponent() {
  // Temporary solution to handle /contracts/test and similar routes
  if (window.location.pathname.startsWith('/contracts/') && 
      !window.location.pathname.includes('/classes/') && 
      !window.location.pathname.includes('/instances/')) {
    
    // Redirect to the contract index page
    window.location.href = '/contracts';
    return <div>Redirecting...</div>;
  }
  
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
