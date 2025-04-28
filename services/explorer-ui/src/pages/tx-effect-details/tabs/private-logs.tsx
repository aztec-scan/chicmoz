import { type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";

interface PrivateLogsArgs {
  logs: string[][]
}

export const PrivateLogs: FC<PrivateLogsArgs> = ({ logs }) => (
  <div>
    {logs.map((log, index) => (
      <div key={index}>
        <h4>Log {index + 1}</h4>
        <KeyValueDisplay
          data={[
            {
              label: "data",
              value: log.toString(),
            },
          ]}
        />
      </div>
    ))}
  </div>
);
