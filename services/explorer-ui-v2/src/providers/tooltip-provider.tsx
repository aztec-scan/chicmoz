import { type FC, type ReactNode } from "react";
import { TooltipProvider as BaseTooltipProvider } from "~/components/ui/tooltip";

interface Props {
  children: ReactNode;
}

/**
 * Wraps the Radix TooltipProvider with default config.
 * Delay 200ms before showing, 0ms before hiding.
 */
export const TooltipProvider: FC<Props> = ({ children }) => (
  <BaseTooltipProvider delayDuration={200} skipDelayDuration={0}>
    {children}
  </BaseTooltipProvider>
);
