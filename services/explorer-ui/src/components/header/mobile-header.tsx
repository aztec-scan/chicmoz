import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { SearchInput } from "~/components/ui/input";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "../ui";
import { ChicmozHomeLink } from "../ui/chicmoz-home-link";
import { NetworkSelector } from "./network-selector";
import { type HeaderLink } from "./types";

interface MobileHeaderProps {
  links: HeaderLink[];
  searchProps: {
    handleSearch: () => void;
    handleOnChange: (value: string) => void;
    isLoading: boolean;
    hasNoResults: boolean;
  };
  menuState: {
    isMenuOpen: boolean;
    setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };
}

export const MobileHeader = ({
  links,
  searchProps,
  menuState,
}: MobileHeaderProps) => {
  const { handleSearch, handleOnChange, isLoading, hasNoResults } = searchProps;
  const { isMenuOpen, setIsMenuOpen } = menuState;

  // Group links by their group property
  const groupedLinks = links.reduce<Record<string, typeof links>>(
    (acc, link) => {
      const group = link.group ?? "default";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(link);
      return acc;
    },
    {},
  );

  // Get groups in order they appear in the original array
  const groups = links
    .map((link) => link.group ?? "default")
    .filter((group, index, self) => self.indexOf(group) === index);

  return (
    <>
      {/* Mobile Navigation Header */}
      <div className="flex items-center justify-between w-full px-4 lg:hidden">
        <ChicmozHomeLink textClasses="hidden lg:block" />
        <NetworkSelector className="lg:hidden" />
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
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out
        ${isMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-4 pt-4 space-y-3 overflow-y-auto">
          {/* Search bar */}
          <div className="flex items-center mt-1 w-full">
            <SearchInput
              placeholder="Search"
              onIconClick={handleSearch}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onChange={(e) => handleOnChange(e.target.value)}
              isLoading={isLoading}
              noResults={hasNoResults}
              className="w-full"
            />
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col space-y-2">
            {groups.map((group, groupIndex) => (
              <div key={group} className="flex flex-col space-y-2 w-full">
                {groupIndex > 0 && (
                  <hr className="border-t border-gray-400/30 mt-2 w-full" />
                )}
                {groupedLinks[group].map((link) =>
                  link.external ? (
                    <a
                      key={link.key}
                      href={link.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-white text-lg pt-2 hover:bg-white/10 transition-colors truncate w-full"
                    >
                      {link.name}
                      <ExternalLinkIcon className="inline-block ml-1" />
                    </a>
                  ) : (
                    <Link
                      key={link.key}
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-white text-lg pt-2 hover:bg-white/10 transition-colors truncate w-full"
                    >
                      {link.name}
                    </Link>
                  ),
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span></span>
              <ThemeToggle size={7} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
