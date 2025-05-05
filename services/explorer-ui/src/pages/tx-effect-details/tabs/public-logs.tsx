import { type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { routes } from "~/routes/__root";

interface PublicLogsProps {
  logs: string[][];
}

export const PublicLogs: FC<PublicLogsProps> = ({ logs }) => (
  <div>
    {logs.map(([contractAddress, ...logData], index) => (
      <div key={index}>
        <h4>Index {index}</h4>
        <KeyValueDisplay
          data={[
            {
              label: "Contract Address",
              value: contractAddress,
              link: `${routes.contracts.route}/${routes.contracts.children.instances.route}/${contractAddress}`,
            },
            {
              label: "data",
              value: logData.toString(),
            },
          ]}
        />
      </div>
    ))}
  </div>
);
