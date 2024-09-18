import { createLazyFileRoute } from "@tanstack/react-router";
import { useLatestBlock } from "~/hooks/useLatestBlock";

export const Route = createLazyFileRoute("/blocks/$blockNumber")({
  component: Block,
});
function Block() {
  const { latestBlockData, loading, error, timeSince } = useLatestBlock();
  const { blockNumber } = Route.useParams();

  // TODO: these messages should perhaps be diplayed?
  // console.log("Extracted messages:");
  // const txEffects = latestBlockData?.body.txEffects;
  // if (txEffects && txEffects.length > 0) {
  //   for (let i = 0; i < txEffects.length; i++) {
  //     const functionLogs = txEffects[i]?.unencryptedLogs.functionLogs;
  //     if (functionLogs && functionLogs.length > 0) {
  //       for (let j = 0; j < functionLogs.length; j++) {
  //         const logs = functionLogs[j]?.logs;
  //         if (logs && logs.length > 0) {
  //           for (let k = 0; k < logs.length; k++) {
  //             const cleanedMessage = Buffer.from(logs[k].data, "hex")
  //               .toString("utf8")
  //               .split("")
  //               .filter((char) => char.charCodeAt(0) > 31)
  //               .join("");
  //             console.log(`[${i}][${j}][${k}]: ${cleanedMessage}`);
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  let bn;
  if (blockNumber === "latest") bn = "latest";
  else if (parseInt(blockNumber)) bn = parseInt(blockNumber);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderList = (items: any[], maxItems = 10) => {
    const displayItems = items.slice(0, maxItems);
    return (
      <ul className="list-disc list-inside pl-4">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {displayItems.map((item: any, index: number) => (
          <li key={index}>
            {typeof item === "object" ? (
              <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto max-h-40">
                <code>{JSON.stringify(item, null, 2)}</code>
              </pre>
            ) : (
              item
            )}
          </li>
        ))}
        {items.length > maxItems && (
          <li>...and {items.length - maxItems} more</li>
        )}
      </ul>
    );
  };

  return (
    <div className="bg-card p-4">
      {bn ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Block Data</h2>
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {latestBlockData && (
            <>
              <div className="mb-4">
                <p>
                  <strong>Block Number:</strong>{" "}
                  {parseInt(
                    latestBlockData.header.globalVariables.blockNumber,
                    16
                  )}
                </p>
                <p>
                  <strong>Time since:</strong> {timeSince}
                </p>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Transaction Effects
              </h3>
              {latestBlockData.body.txEffects.map((txEffect, index) => (
                <details
                  key={index}
                  className="mb-4 p-2 border border-gray-200 rounded"
                >
                  <summary className="font-semibold cursor-pointer">
                    Transaction {index + 1}
                  </summary>
                  <div className="mt-2">
                    <ul className="space-y-1">
                      <li>
                        <strong>Transaction Fee:</strong>{" "}
                        {parseInt(txEffect.transactionFee, 16)} (wei)
                      </li>
                      <li>
                        <details>
                          <summary>
                            <strong>Note Hashes:</strong>{" "}
                            {txEffect.noteHashes.length}
                          </summary>
                          {renderList(txEffect.noteHashes)}
                        </details>
                      </li>
                      <li>
                        <details>
                          <summary>
                            <strong>Nullifiers:</strong>{" "}
                            {txEffect.nullifiers.length}
                          </summary>
                          {renderList(txEffect.nullifiers)}
                        </details>
                      </li>
                      <li>
                        <details>
                          <summary>
                            <strong>L2 to L1 Messages:</strong>{" "}
                            {txEffect.l2ToL1Msgs.length}
                          </summary>
                          {renderList(txEffect.l2ToL1Msgs)}
                        </details>
                      </li>
                      <li>
                        <details>
                          <summary>
                            <strong>Public Data Writes:</strong>{" "}
                            {txEffect.publicDataWrites.length}
                          </summary>
                          {renderList(txEffect.publicDataWrites)}
                        </details>
                      </li>
                      <li>
                        <details>
                          <summary>
                            <strong>Note Encrypted Logs:</strong>{" "}
                            {txEffect.noteEncryptedLogs.functionLogs.length}
                          </summary>
                          {renderList(txEffect.noteEncryptedLogs.functionLogs)}
                        </details>
                      </li>
                      <li>
                        <details>
                          <summary>
                            <strong>Encrypted Logs:</strong>{" "}
                            {txEffect.encryptedLogs.functionLogs.length}
                          </summary>
                          {renderList(txEffect.encryptedLogs.functionLogs)}
                        </details>
                      </li>
                      <li>
                        <details>
                          <summary>
                            <strong>Unencrypted Logs:</strong>{" "}
                            {txEffect.unencryptedLogs.functionLogs.length}
                          </summary>
                          {renderList(txEffect.unencryptedLogs.functionLogs)}
                        </details>
                      </li>
                    </ul>
                  </div>
                </details>
              ))}
            </>
          )}
        </div>
      ) : (
        <div>
          <h2>Invalid Block Number</h2>
          <p>Block {blockNumber} not found</p>
        </div>
      )}
    </div>
  );
}
