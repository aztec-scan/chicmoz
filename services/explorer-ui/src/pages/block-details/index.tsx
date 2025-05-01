import { useNavigate, useParams } from "@tanstack/react-router";
import { useState, type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { OptionButtons } from "~/components/option-buttons";
import { OrphanedBanner } from "~/components/orphaned-banner";
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
  const navigate = useNavigate();

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

  const navigateToBlock = (blockNum: number) => {
    void navigate({
      to: "/blocks/$blockNumber",
      params: { blockNumber: blockNum.toString() },
    });
  };
  const isTxLoading = isLoading || txEffectsLoading;
  const renderTabContent = () => {
    switch (selectedTab) {
      case "txEffects":
        return (
          <TxEffectsTable
            txEffects={getTxEffects(blockTxEffects, block)}
            isLoading={isTxLoading}
            error={error ?? txEffectsError}
            showPending={false}
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
          {block.orphan ? <OrphanedBanner type="block" /> : null}
          <div className="flex justify-between ml-2 mr-2">
            <button
              onClick={() => navigateToBlock(parseInt(blockNumber) - 1)}
              className="text-sm text-primary underline hover:text-primary/70 transition-colors"
            >
              Previous Block
            </button>
            <button
              onClick={() => navigateToBlock(parseInt(blockNumber) + 1)}
              className="text-sm text-primary underline hover:text-primary/70 transition-colors"
            >
              Next Block
            </button>
          </div>
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
