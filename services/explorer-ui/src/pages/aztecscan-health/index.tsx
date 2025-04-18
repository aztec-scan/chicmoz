import { type FC } from "react";
import { CustomTooltip } from "~/components/custom-tooltip";
import { HealthStatus, useSubTitle, useSystemHealth } from "~/hooks";

// Helper function to map health status to icons
const getHealthIcon = (status: HealthStatus) => {
  switch (status) {
    case HealthStatus.UP:
      return "✅";
    case HealthStatus.UNHEALTHY:
      return "⚠️";
    case HealthStatus.DOWN:
      return "🛑";
    default:
      return "❓";
  }
};

export const AztecscanHealth: FC = () => {
  const { components, systemHealth } = useSystemHealth();

  useSubTitle(`Aztecscan: ${systemHealth.health}`);

  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
      <div className="flex flex-wrap justify-center my-14 md:my-20">
        <h1 className="text-primary dark:text-white">
          Aztecscan is {systemHealth.health}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
        <h2 className="mb-4">Component Details</h2>
        {components.map((component) => (
          <div
            key={component.componentId}
            className="mb-4 p-4 border rounded dark:border-gray-700"
          >
            <h3 className="mb-2">
              <CustomTooltip content={component.health}>
                <span className="cursor-help">
                  {getHealthIcon(component.health)}
                </span>
              </CustomTooltip>
              <span className="ml-2">{component.componentId}</span>
            </h3>
            <p className="mb-2">{component.description}</p>
            <pre className="text-sm text-gray-600 dark:text-gray-400 border-none dark:border-none whitespace-pre-wrap">
              {component.evaluationDetails}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
