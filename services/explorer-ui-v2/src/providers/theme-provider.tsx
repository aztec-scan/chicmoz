import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

/**
 * Wraps next-themes. We attach the class to <html> and default to the user's
 * OS preference via `prefers-color-scheme`. Explicit user choices (Light/Dark)
 * persist in localStorage and win over the system default.
 */
export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    {...props}
  >
    {children}
  </NextThemesProvider>
);
