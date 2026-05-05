import { type FC } from "react";
import { useSubTitle, useSystemHealth } from "~/hooks";
import { BaseLayout } from "~/layout/base-layout";
import { RpcNodeHealthSection } from "./rpc-node-health-section";
import { SystemHealthOverview } from "./system-health-overview";

const RPC_NODE_MAX_AGE_DAYS = 30;

export const AztecscanHealth: FC = () => {
  const systemHealth = useSystemHealth();

  useSubTitle(`Aztecscan: ${systemHealth.systemHealth.health}`);

  return (
    <BaseLayout>
      {/* Main Header */}
      <div className="flex flex-wrap justify-center my-14 md:my-20">
        <h1 className="text-primary dark:text-white">
          Aztecscan is {systemHealth.systemHealth.health}
        </h1>
      </div>

      {/* Floating InfoBadges under title */}
      <SystemHealthOverview systemHealth={systemHealth} />

      <RpcNodeHealthSection maxAgeDays={RPC_NODE_MAX_AGE_DAYS} />
    </BaseLayout>
  );
};
