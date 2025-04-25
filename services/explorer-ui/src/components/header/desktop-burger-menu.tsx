import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "../ui";
import { type HeaderLink } from "./types";

type DesktopBurgerMenuProps = {
  isMenuOpen: boolean;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
  links: HeaderLink[];
};

export const DesktopBurgerMenu = ({
  isMenuOpen,
  setIsMenuOpen,
  links,
}: DesktopBurgerMenuProps) => {
  // Group links by their group property
  const groupedLinks = links.reduce<Record<string, HeaderLink[]>>(
    (acc, link) => {
      const group = link.group ?? "default";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(link);
      return acc;
    },
    {}
  );

  // Get groups in order they appear in the original array
  const groups = links
    .map((link) => link.group ?? "default")
    .filter((group, index, self) => self.indexOf(group) === index);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:text-secondary-foreground"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? (
          <X className="h-6 w-6 text-white hover:text-secondary-foreground" />
        ) : (
          <Menu className="h-6 w-6 text-white hover:text-secondary-foreground" />
        )}
      </Button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-purple-light ring-1 ring-black ring-opacity-5 z-10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {groups.map((group, groupIndex) => (
              <div key={group}>
                {groupIndex > 0 && (
                  <hr className="my-1 mx-[8%] border-t border-gray-400/30" />
                )}
                {groupedLinks[group].map((link) => (
                  <Link
                    key={link.key}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-white hover:text-gray-400"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            ))}
            <div className="flex flex-row justify-end items-center px-4 pt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
