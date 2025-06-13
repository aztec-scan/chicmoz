import { type FC } from "react";
import { useSubTitle, useSystemHealth } from "~/hooks";
import { SystemHealthOverview } from "./system-health-overview";
import { SequencerHealthSection } from "./sequencer-health-section";

export const AztecscanHealth: FC = () => {
  const systemHealth = useSystemHealth();

  useSubTitle(`Aztecscan: ${systemHealth.systemHealth.health}`);

  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
      {/* Main Header */}
      <div className="flex flex-wrap justify-center my-14 md:my-20">
        <h1 className="text-primary dark:text-white">
          Aztecscan is {systemHealth.systemHealth.health}
        </h1>
      </div>

      {/* Floating InfoBadges under title */}
      <SystemHealthOverview systemHealth={systemHealth} />

      {/* Sequencer Health Section */}
      <SequencerHealthSection />
    </div>
  );
};
