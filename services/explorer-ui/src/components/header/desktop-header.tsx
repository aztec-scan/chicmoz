import { Link } from "@tanstack/react-router";
import { SearchInput } from "~/components/ui/input";
import { ChicmozHomeLink } from "../ui/chicmoz-home-link";
import { DesktopBurgerMenu } from "./desktop-burger-menu";
import { NetworkSelector } from "./network-selector";
import { type HeaderLink } from "./types";

interface DesktopHeaderProps {
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

export const DesktopHeader = ({
  links,
  searchProps,
  menuState,
}: DesktopHeaderProps) => {
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

  return (
    <div className="hidden lg:flex lg:w-full lg:items-center lg:gap-8">
      {/* Left section: Logo + Network */}
      <div className="flex items-center gap-4 shrink-0">
        <ChicmozHomeLink className="-mt-1" textClasses="hidden lg:block" />
        <NetworkSelector className="hidden lg:flex" />
      </div>

      {/* Center section: Search - grows to fill available space */}
      <div className="flex-1 flex justify-center items-center max-w-md mx-auto">
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

      {/* Right section: Nav links + Menu */}
      <div className="flex items-center gap-6 shrink-0 pr-6">
        {groupedLinks?.main.map((link) => (
          <Link
            key={link.key}
            to={link.to}
            className="text-white hover:text-secondary-foreground transition-colors whitespace-nowrap"
          >
            {link.name}
          </Link>
        ))}

        <DesktopBurgerMenu
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          links={links}
        />
      </div>
    </div>
  );
};
