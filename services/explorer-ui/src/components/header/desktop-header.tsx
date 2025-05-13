import { Link } from "@tanstack/react-router";
import { SearchInput } from "~/components/ui/input";
import { CustomTooltip } from "../custom-tooltip";
import { MagicDevLink } from "../magic-dev-link";
import { ChicmozHomeLink } from "../ui/chicmoz-home-link";
import { DesktopBurgerMenu } from "./desktop-burger-menu";
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
    <div className="hidden md:flex md:w-full md:items-center md:justify-between">
      <div className="flex items-center">
        <ChicmozHomeLink className="-mt-1" textClasses="hidden md:block pr-6" />
        <MagicDevLink textClasses="hidden md:block self-center" />
      </div>
      <div className="flex justify-center items-center w-1/2 sm:w-1/3">
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
        {groupedLinks?.main.map((link) => (
          <CustomTooltip content={link.tooltip}>
            <Link
              key={link.key}
              to={link.to}
              className="text-white hover:text-secondary-foreground transition-colors"
            >
              {link.name}
            </Link>
          </CustomTooltip>
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
