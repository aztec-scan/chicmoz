import { type FC } from "react";
import { BlockCountdownProgress } from "~/components/block-countdown-progress";
import { useAvarageBlockTime, useLatestTableBlocks } from "~/hooks";

export const BlockProductionSection: FC = () => {
  const { data: latestBlocks } = useLatestTableBlocks();
  const { data: avgBlockTime } = useAvarageBlockTime();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
      <h2 className="mb-4">Block Production</h2>
      <div className="flex justify-center mb-4">
        <BlockCountdownProgress
          latestBlocks={latestBlocks}
          averageBlockTime={avgBlockTime}
        />
      </div>
    </div>
  );
};
