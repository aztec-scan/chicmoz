import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Theme } from "~/types";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="w-9 px-0" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 px-0 text-white hover:text-white hover:bg-purple-light/20"
      onClick={() => setTheme(theme === Theme.DARK ? Theme.LIGHT : Theme.DARK)}
      aria-label="Toggle theme"
    >
      {theme === Theme.DARK ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </Button>
  );
}
