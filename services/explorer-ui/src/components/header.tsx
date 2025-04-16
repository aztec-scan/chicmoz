import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchInput } from "~/components/ui/input";
import { useSearch } from "~/hooks";
import { routes } from "~/routes/__root.tsx";
import { MagicDevLink } from "./magic-dev-link";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui";
import { ChicmozHomeLink } from "./ui/chicmoz-home-link";

export const Header = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [hasNoResults, setHasNoResults] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { name: routes.home.title, path: routes.home.route },
    { name: routes.blocks.title, path: routes.blocks.route },
    { name: routes.txEffects.title, path: routes.txEffects.route },
    { name: routes.contracts.title, path: routes.contracts.route },
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
  const divider = <hr className="my-1 mx-[8%] border border-gray-400/30" />;
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
            {/* Desktop Navigation */}
            <div className="hidden md:flex md:w-full md:items-center md:justify-between ">
              <div className="flex items-center">
                <ChicmozHomeLink
                  className="-mt-1"
                  textClasses="hidden md:block pr-6"
                />
                <MagicDevLink textClasses="hidden md:block self-center" />
              </div>
              <div className="flex  justify-center items-center w-1/2 sm:w-1/3 ">
                <SearchInput
                  placeholder="Search"
                  onIconClick={handleSearch}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onChange={(e) => handleOnChange(e.target.value)}
                  isLoading={isLoading}
                  noResults={hasNoResults}
                />
              </div>

              <div className="flex space-x-6 justify-center items-center pr-11">
                <Link
                  to={routes.blocks.route}
                  className="text-white hover:text-secondary-foreground transition-colors"
                >
                  Blocks
                </Link>
                <Link
                  to={routes.txEffects.route}
                  className="text-white hover:text-secondary-foreground transition-colors"
                >
                  TxEffects
                </Link>
                <Link
                  to={routes.contracts.route}
                  className="text-white hover:text-secondary-foreground transition-colors"
                >
                  Contracts
                </Link>

                {/* Desktop Burger Menu */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-secondary-foreground"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    {isMenuOpen ? (
                      <X className="h-6 w-6 text-white" />
                    ) : (
                      <Menu className="h-6 w-6 text-white" />
                    )}
                  </Button>

                  {/* Desktop Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md bg-purple-light ring-1 ring-black ring-opacity-5 z-10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                      <div
                        className="py-1"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        {/* Only show Home in the dropdown */}
                        <Link
                          to={routes.home.route}
                          onClick={() => setIsMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-white hover:text-gray-400"
                        >
                          {routes.home.title}
                        </Link>

                        {divider}

                        <Link
                          to={routes.blocks.route}
                          onClick={() => setIsMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-white hover:text-gray-400"
                        >
                          {routes.blocks.title}
                        </Link>

                        <Link
                          to={routes.txEffects.route}
                          onClick={() => setIsMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-white hover:text-gray-400"
                        >
                          {routes.txEffects.title}
                        </Link>

                        <Link
                          to={routes.contracts.route}
                          onClick={() => setIsMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-white hover:text-gray-400"
                        >
                          {routes.contracts.title}
                        </Link>

                        {divider}

                        <Link
                          to={routes.dev.route}
                          onClick={() => setIsMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-white hover:text-gray-400"
                        >
                          Dev Page
                        </Link>
                        {divider}
                        <div className="px-4 py-2 flex items-center">
                          <span className="text-white text-sm mr-2">
                            Theme:
                          </span>
                          <ThemeToggle />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Navigation Header */}
            <div className=" flex items-center justify-between w-full px-4 md:hidden">
              <ChicmozHomeLink textClasses="hidden md:block" />
              <MagicDevLink textClasses="md:hidden" />
              <div className="flex items-center justify-between space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-transparent"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <span className="flex items-center">
                    {isMenuOpen ? (
                      <X className="h-6 w-6 mr-2 text-white" />
                    ) : (
                      <Menu className="h-6 w-6 mr-2 text-white" />
                    )}
                  </span>
                </Button>
              </div>
            </div>

            {/* Mobile Menu Content */}
            <div
              className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out
              ${
                isMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-4 py-4 space-y-3">
                {/* Search bar */}

                <div className="flex items-center mt-1">
                  <SearchInput
                    placeholder="Search"
                    onIconClick={handleSearch}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    onChange={(e) => handleOnChange(e.target.value)}
                    isLoading={isLoading}
                    noResults={hasNoResults}
                  />
                </div>

                {/* Navigation Items */}
                <div className="flex flex-col space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-white text-lg py-1 hover:bg-white/10 transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link
                    to={routes.dev.route}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white text-lg py-1 hover:bg-white/10 transition-colors"
                  >
                    Dev Page
                  </Link>
                  <div className="flex items-center py-2">
                    <span className="text-white mr-2">Theme:</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
