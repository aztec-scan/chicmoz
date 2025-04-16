import { type FC } from "react";
import { InfoBadge } from "~/components/info-badge";
import { useSubTitle, useSystemHealth } from "~/hooks";

export const SystemHealth: FC = () => {
  const { components, systemHealth } = useSystemHealth();

  useSubTitle("System Health");

  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
      <div className="flex flex-wrap justify-center my-14 md:my-20">
        <h1 className="hidden md:block md:text-primary md:dark:text-white">
          System Health Status
        </h1>
        <h5 className="text-primary dark:text-white md:hidden">
          System Health Status
        </h5>
      </div>

      <div className="mb-10">
        <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800">
          <h2 className="mb-4">Overall Status: {systemHealth.health}</h2>
          <p>{systemHealth.reason}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 my-14 md:my-20 md:grid-cols-3 md:gap-5">
        {components.map((component) => (
          <InfoBadge
            key={component.componentId}
            title={component.componentId}
            isLoading={false}
            error={null}
            data={component.health}
          />
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
        <h2 className="mb-4">Component Details</h2>
        {components.map((component) => (
          <div
            key={component.componentId}
            className="mb-4 p-4 border rounded dark:border-gray-700"
          >
            <h3 className="mb-2">
              {component.componentId}: {component.health}
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
