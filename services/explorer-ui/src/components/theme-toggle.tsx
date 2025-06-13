import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";
import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Theme } from "~/types";
import { Button } from "./ui/button";

interface ThemeToggleProps {
  size?: number;
}

export function ThemeToggle({ size = 5 }: ThemeToggleProps) {
  const { theme, setTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine the proper size class based on the size prop
  const sizeClass = (() => {
    switch (size) {
      case 4:
        return "h-4 w-4";
      case 5:
        return "h-5 w-5";
      case 6:
        return "h-6 w-6";
      case 7:
        return "h-7 w-7";
      case 8:
        return "h-8 w-8";
      default:
        return "h-5 w-5";
    }
  })();

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="w-9" />;
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "light") {
      return (
        <SunIcon className={`${sizeClass} hover:text-accent-foreground`} />
      );
    } else if (theme === "dark") {
      return (
        <MoonIcon className={`${sizeClass} hover:text-accent-foreground`} />
      );
    } else {
      return (
        <MonitorIcon className={`${sizeClass} hover:text-accent-foreground`} />
      );
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 text-white hover:text-white hover:bg-purple-light/20"
      onClick={cycleTheme}
      aria-label="Toggle theme"
    >
      {getIcon()}
    </Button>
  );
}
