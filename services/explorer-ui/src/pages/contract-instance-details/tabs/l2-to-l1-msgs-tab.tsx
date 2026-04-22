import { type ChicmozL2PendingL2ToL1Msg } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { createElement, type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";

type Props = {
  messages: ChicmozL2PendingL2ToL1Msg[];
};

export const L2ToL1MsgsTab: FC<Props> = ({ messages }) => {
  if (messages.length === 0) {
    return <p className="text-gray-500">No L2→L1 messages found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.map((msg, i) => (
        <div key={i} className="rounded">
          <KeyValueDisplay
            data={[
              {
                label: "Tx Hash",
                value: msg.txHash,
                link: `/tx-effects/${msg.txHash}`,
              },
              { label: "Index", value: msg.index.toString() },
              {
                label: "Contract Address",
                value: msg.contractAddress,
                link: `/contracts/instances/${msg.contractAddress}`,
              },
              {
                label: "Recipient",
                value: "CUSTOM",
                customValue: createElement(
                  Link,
                  {
                    to: "/l1/address/$address",
                    params: { address: msg.recipient },
                    className: "text-purple-light font-mono hover:underline",
                  },
                  msg.recipient,
                ),
              },
              { label: "Content", value: msg.content },
            ]}
          />
        </div>
      ))}
    </div>
  );
};
