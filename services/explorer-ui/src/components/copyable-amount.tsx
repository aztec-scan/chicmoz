import { type FC } from "react";
import { toast } from "sonner";
import { CustomTooltip } from "~/components/custom-tooltip";
import { cn } from "~/lib/utils";

type Props = {
  displayAmount: string;
  rawAmount: string;
  className?: string;
};

export const CopyableAmount: FC<Props> = ({
  displayAmount,
  rawAmount,
  className,
}) => {
  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(rawAmount);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <CustomTooltip content="Copy full amount">
      <button
        type="button"
        className={cn("cursor-pointer hover:opacity-80", className)}
        onClick={() => {
          void handleCopy();
        }}
      >
        {displayAmount}
      </button>
    </CustomTooltip>
  );
};
