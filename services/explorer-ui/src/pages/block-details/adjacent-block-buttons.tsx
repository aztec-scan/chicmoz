import { useNavigate } from "@tanstack/react-router";
import { startTransition } from "react";

interface AdjacentBlockButtonsProps {
  blockNumber: number;
}

export const AdjecentBlockButtons: React.FC<AdjacentBlockButtonsProps> = ({
  blockNumber,
}) => {
  const navigate = useNavigate();

  const navigateToBlock = (blockNum: number) => {
    startTransition(() => {
      void navigate({
        to: "/blocks/$blockNumber",
        params: { blockNumber: blockNum.toString() },
      });
    });
  };
  return (
    <div className="flex justify-between ml-2 mr-2">
      <button
        onClick={() => navigateToBlock(blockNumber - 1)}
        className="text-sm text-primary underline hover:text-primary/70 transition-colors"
      >
        Previous Block
      </button>
      <button
        onClick={() => navigateToBlock(blockNumber + 1)}
        className="text-sm text-primary underline hover:text-primary/70 transition-colors"
      >
        Next Block
      </button>
    </div>
  );
};
