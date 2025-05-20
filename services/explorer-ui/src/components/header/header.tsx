import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
      key: "l1L2Validators",
      name: routes.l1.children.contractEvents.title,
      to: routes.l1.route + routes.l1.children.contractEvents.route,
      group: "l1",
    },
    {
      key: "aztecscanHealth",
      name: routes.aztecscanHealth.title,
      to: routes.aztecscanHealth.route,
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
      const [instance] = data.results.contractInstances;
      const [contractClass] = data.results.registeredContractClasses;

      if (block) {
        void navigate({ to: `/blocks/${block.hash}` });
        setIsMenuOpen(false);
      } else if (txEffect) {
        void navigate({ to: `/tx-effects/${txEffect.txHash}` });
        setIsMenuOpen(false);
      } else if (instance) {
        void navigate({ to: `/contracts/instances/${instance.address}` });
        setIsMenuOpen(false);
      } else if (contractClass) {
        void navigate({
          to: `/contracts/classes/${contractClass.contractClassId}/versions/${contractClass.version}`,
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
