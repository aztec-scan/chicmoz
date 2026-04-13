import { useNavigate } from "@tanstack/react-router";
import { startTransition, useEffect, useState } from "react";
import { useSearch } from "~/hooks";
import { routes } from "~/routes/__root.tsx";
import { DesktopHeader } from "./desktop-header";
import { MobileHeader } from "./mobile-header";
import { type HeaderLink } from "./types";

export const Header = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [hasNoResults, setHasNoResults] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links: HeaderLink[] = [
    {
      key: "home",
      name: routes.home.title,
      to: routes.home.route,
      group: "home",
    },
    {
      key: "blocks",
      name: routes.blocks.title,
      to: routes.blocks.route,
      group: "main",
    },
    {
      key: "txEffects",
      name: routes.txEffects.title,
      to: routes.txEffects.route,
      group: "main",
    },
    {
      key: "contracts",
      name: routes.contracts.title,
      to: routes.contracts.route,
      group: "main",
    },
    {
      key: "aztecEcosystem",
      name: routes.ecosystem.title,
      to: routes.ecosystem.route,
      group: "aztec",
    },
    {
      key: "networkHealth",
      name: routes.networkHealth.title,
      to: routes.networkHealth.route,
      group: "aztec",
    },
    {
      key: "l1ContractEvents",
      name: routes.l1.children.contractEvents.title,
      to: routes.l1.route + routes.l1.children.contractEvents.route,
      group: "l1",
    },
    {
      key: "l1L2Validator",
      name: routes.validators.title,
      to: routes.l1.route + routes.validators.route,
      group: "l1",
    },
    {
      key: "aztecscanHealth",
      name: routes.aztecscanHealth.title,
      to: routes.aztecscanHealth.route,
      group: "dev",
    },
    {
      key: "staking",
      name: "Aztecscan Staking",
      to: routes.staking.route,
      group: "dev",
    },
    {
      key: "incidents",
      name: routes.incidents.title,
      to: routes.incidents.route,
      group: "dev",
    },
    {
      key: "docs",
      name: "API Docs",
      to: "https://docs.aztecscan.xyz/",
      group: "dev",
      external: true,
    },
  ];

  const { data, isLoading, error, refetch, isSuccess, fetchStatus } =
    useSearch(searchValue);

  useEffect(() => {
    if (data) {
      const [block] = data.results.blocks;
      const [txEffect] = data.results.txEffects;
      const [pendingTx] = data.results.pendingTx;
      const [droppedTx] = data.results.droppedTx;
      const [instance] = data.results.contractInstances;
      const [contractClass] = data.results.registeredContractClasses;
      const [validators] = data.results.validators;

      if (block) {
        startTransition(() => {
          void navigate({ to: `/blocks/${block.hash}` });
        });
        setIsMenuOpen(false);
      } else if (txEffect || pendingTx || droppedTx) {
        const hash = txEffect || pendingTx || droppedTx;
        startTransition(() => {
          void navigate({ to: `/tx-effects/${hash.txHash}` });
        });
        setIsMenuOpen(false);
      } else if (instance) {
        startTransition(() => {
          void navigate({ to: `/contracts/instances/${instance.address}` });
        });
        setIsMenuOpen(false);
      } else if (contractClass) {
        startTransition(() => {
          void navigate({
            to: `/contracts/classes/${contractClass.contractClassId}/versions/${contractClass.version}`,
          });
        });
        setIsMenuOpen(false);
      } else if (validators) {
        startTransition(() => {
          void navigate({
            to: `/l1/validators/${validators.validatorAddress}`,
          });
        });
        setIsMenuOpen(false);
      } else if (Object.values(data.results).every((arr) => !arr.length)) {
        setHasNoResults(true);
      }
    }
    if (error) {
      setHasNoResults(true);
    }
    if (!data && isSuccess) {
      setHasNoResults(true);
    }
  }, [data, error, isSuccess, navigate, fetchStatus]);

  const handleOnChange = (value: string) => {
    setHasNoResults(false);
    setSearchValue(value);
  };

  const handleSearch = () => {
    void refetch();
  };

  const searchProps = {
    handleSearch,
    handleOnChange,
    isLoading,
    hasNoResults,
  };

  const menuState = {
    isMenuOpen,
    setIsMenuOpen,
  };

  return (
    <div className="mx-auto px-4 mt-10 max-w-[1440px] md:px-[70px]">
      <div className="flex flex-col w-full items-center bg-purple-light rounded-[40px] py-4 pr-4 md:pl-10">
        <div
          className={`w-full transition-all duration-300 ease-in-out ${
            isMenuOpen ? "rounded-b-3xl" : ""
          }`}
        >
          {/* Header */}
          <div className="w-full mx-auto">
            <DesktopHeader
              links={links}
              searchProps={searchProps}
              menuState={menuState}
            />
            <MobileHeader
              links={links}
              searchProps={searchProps}
              menuState={menuState}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
