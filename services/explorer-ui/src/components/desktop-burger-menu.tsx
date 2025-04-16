import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import { routes } from "~/routes/__root.tsx";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui";

type DesktopBurgerMenuProps = {
  isMenuOpen: boolean;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
};

export const DesktopBurgerMenu = ({
  isMenuOpen,
  setIsMenuOpen,
}: DesktopBurgerMenuProps) => {
  const divider = <hr className="my-1 mx-[8%] border border-gray-400/30" />;

  return (
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
          <div className="py-1" role="menu" aria-orientation="vertical">
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
              to={routes.aztecscanHealth.route}
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-sm text-white hover:text-gray-400"
            >
              {routes.aztecscanHealth.title}
            </Link>

            <Link
              to={routes.dev.route}
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-sm text-white hover:text-gray-400"
            >
              Dev Page
            </Link>
            <div className="flex flex-row justify-end items-center px-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
