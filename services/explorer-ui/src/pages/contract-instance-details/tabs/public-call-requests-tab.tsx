import { type PublicCallRequest } from "@chicmoz-pkg/types";
import { type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";

type Props = {
  publicCallRequests: PublicCallRequest[];
};

export const PublicCallRequestsTab: FC<Props> = ({ publicCallRequests }) => {
  if (publicCallRequests.length === 0) {
    return <p className="text-gray-500">No public call requests found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {publicCallRequests.map((req, i) => (
        <div key={i} className=" rounded ">
          <KeyValueDisplay
            data={[
              {
                label: "Msg Sender",
                value: req.msgSender,
                link: `/contracts/instances/${req.msgSender}`,
              },
              {
                label: "Contract Address",
                value: req.contractAddress,
                link: `/contracts/instances/${req.contractAddress}`,
              },
              ...(req.functionSelector
                ? [{ label: "Function Selector", value: req.functionSelector }]
                : []),
              { label: "Call Type", value: req.callType },
              {
                label: "Is Static Call",
                value: req.isStaticCall ? "Yes" : "No",
              },
            ]}
          />
        </div>
      ))}
    </div>
  );
};
