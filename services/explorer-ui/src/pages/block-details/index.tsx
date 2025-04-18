import { useParams } from "@tanstack/react-router";
import { useState, type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { OptionButtons } from "~/components/option-buttons";
import { TxEffectsTable } from "~/components/tx-effects/tx-effects-table";
import {
  useGetBlockByIdentifier,
  useGetTxEffectsByBlockHeight,
  useSubTitle,
} from "~/hooks";
import { blockDetailsTabs, type TabId } from "./constants";
import { getBlockDetails, getTxEffects } from "./util";

export const BlockDetails: FC = () => {
  const { blockNumber } = useParams({
    from: "/blocks/$blockNumber",
  });
  useSubTitle(`Block ${blockNumber}`);
  const [selectedTab, setSelectedTab] = useState<TabId>("txEffects");
  const onOptionSelect = (value: string) => {
    setSelectedTab(value as TabId);
  };
  const {
    data: block,
    isLoading,
    error,
  } = useGetBlockByIdentifier(blockNumber);

  const height = block?.height;
  const {
    data: blockTxEffects,
    isLoading: txEffectsLoading,
    error: txEffectsError,
  } = useGetTxEffectsByBlockHeight(height);

  if (!block) {
    return <div> No block hash</div>;
  }

  const isTxLoading = isLoading || txEffectsLoading;
  const renderTabContent = () => {
    switch (selectedTab) {
      case "txEffects":
        return (
          <TxEffectsTable
            txEffects={getTxEffects(blockTxEffects, block)}
            isLoading={isTxLoading}
            error={error ?? txEffectsError}
          />
        );
      case "contracts":
        //TODO:Implement contract in a block
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto px-7 max-w-[1440px] md:px-[70px]">
      <div>
        <div className="flex flex-wrap m-5">
          <h2 className="mt-2 text-primary md:hidden">Block Details</h2>
          <h1 className="hidden md:block md:mt-8">Block Details</h1>
        </div>
        <div className="flex flex-col gap-4 mt-8 pb-4">
          {block.orphan && (
            <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <h3 className="text-lg font-medium text-red-700">
                  Orphaned Block
                </h3>
              </div>
              <p className="mt-2 text-sm text-red-600">
                This block has been orphaned and is no longer part of the
                canonical chain.
              </p>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md p-4">
            <KeyValueDisplay data={getBlockDetails(block)} />
          </div>
        </div>
        <OptionButtons
          options={blockDetailsTabs}
          availableOptions={{
            txEffects: !!blockTxEffects,
            contracts: false, // TODO
          }}
          onOptionSelect={onOptionSelect}
          selectedItem={selectedTab}
        />
        <div className="bg-white rounded-lg shadow-md p-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
