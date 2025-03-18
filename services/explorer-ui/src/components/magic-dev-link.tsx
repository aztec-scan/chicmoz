import { Link } from "@tanstack/react-router";
import { HealthStatus, useSystemHealth } from "~/hooks";
import { routes } from "~/routes/__root.tsx";
import { L2_NETWORK_ID } from "~/service/constants";
import { CustomTooltip } from "./custom-tooltip";

export const MagicDevLink = ({ className = "", textClasses = "" }) => {
  const { systemHealth } = useSystemHealth();

  let healthColor = "text-red";
  switch (systemHealth.health) {
    case HealthStatus.UP:
      healthColor = "text-green";
      break;
    case HealthStatus.UNHEALTHY:
      healthColor = "text-yellow";
      break;
  }
  const tooltipContent = (
    <pre className="bg-white p-4 rounded-lg shadow-md text-black">
      {`Health: ${systemHealth.health}
Reason: ${systemHealth.reason}`}
    </pre>
  );
  return (
    <div className={className}>
      <Link to={routes.dev.route} className="flex flex-row items-center">
        <p className={`${textClasses} font-space-grotesk text-white`}>
          {L2_NETWORK_ID}
        </p>
        <CustomTooltip content={tooltipContent}>
          <p className={`text-2xl ${healthColor} ${textClasses}`}>*</p>
        </CustomTooltip>
      </Link>
    </div>
  );
};
