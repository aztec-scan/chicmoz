import React, { FC } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export interface CustomTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CustomTooltip: FC<CustomTooltipProps> = ({
  children,
  content,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}) => {
  return (
    <TooltipProvider>
      <Tooltip
        open={open}
        defaultOpen={defaultOpen}
        delayDuration={200}
        onOpenChange={onOpenChange}
      >
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" align="center" {...props}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
