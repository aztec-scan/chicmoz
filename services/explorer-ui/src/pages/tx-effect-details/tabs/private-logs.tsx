import { type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";

interface PrivateLogsArgs {
  logs: {
    fields: string[];
    emittedLength: number;
  }[];
}

export const PrivateLogs: FC<PrivateLogsArgs> = ({ logs }) => (
  <div>
    {logs.map(({ fields, emittedLength }, index) => (
      <div key={index}>
        <h4>Log {index + 1}</h4>
        <KeyValueDisplay
          data={[
            {
              label: "data",
              value: fields.toString(),
            },
            {
              label: "emittedLength",
              value: emittedLength.toString(),
            },
          ]}
        />
      </div>
    ))}
  </div>
);
