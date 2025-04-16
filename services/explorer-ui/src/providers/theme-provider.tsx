import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { Theme } from "~/types";

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={Theme.LIGHT}
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  );
}
