import { useParams } from "@tanstack/react-router";
import { useState, type FC } from "react";
import { CURRENT_ROLLUP_VERSION } from "~/constants/versions";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { LoadingDetails } from "~/components/loading/loading-details";
import { getEmptyBlockData } from "~/components/loading/util";
import { OlderVersionBanner } from "~/components/older-version-banner";
import { OptionButtons } from "~/components/option-buttons";
import { OrphanedBanner } from "~/components/orphaned-banner";
import { TxEffectsTable } from "~/components/tx-effects/tx-effects-table";
import {
  useGetBlockByIdentifier,
  useGetTableTxEffectsByBlockHeight,
  useSubTitle,
} from "~/hooks";
import { BaseLayout } from "~/layout/base-layout";
import { AdjecentBlockButtons } from "./adjacent-block-buttons";
import { blockDetailsTabs, type TabId } from "./constants";
import { getBlockDetails } from "./util";

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
  } = useGetTableTxEffectsByBlockHeight(height);

  if (error) {
    return (
      <LoadingDetails
        title="Error loading block details"
        description="Please refresh the page"
      />
    );
  }
  if (isLoading) {
    return (
      <LoadingDetails
        title="Loading block details"
        emptyData={getEmptyBlockData()}
      />
    );
  }

  const renderTabContent = () => {
    switch (selectedTab) {
      case "txEffects":
        return (
          <TxEffectsTable
            txEffects={blockTxEffects}
            isLoading={txEffectsLoading}
            error={txEffectsError}
          />
        );
      case "contracts":
        //TODO:Implement contract in a block
        return null;
      default:
        return null;
    }
  };

  if (!block) {
    return (
      <LoadingDetails
        title="No Block found"
        description={`Please check if the block height ${blockNumber} is correct`}
      />
    );
  }
  return (
    <BaseLayout>
      <div>
        <div className="flex flex-wrap m-5">
          <h3 className="text-primary md:hidden">Block Details</h3>
          <h2 className="hidden md:block md:mt-8 md:text-primary">
            Block Details
          </h2>
        </div>
        <div className="flex flex-col gap-4 mt-8 pb-4">
          {block.orphan ? <OrphanedBanner type="block" /> : null}
          {!block.orphan &&
          block?.header.globalVariables.version &&
          block.header.globalVariables.version !== CURRENT_ROLLUP_VERSION ? (
            <OlderVersionBanner
              blockVersion={block.header.globalVariables.version}
              chainVersion={BigInt(CURRENT_ROLLUP_VERSION)}
            />
          ) : null}
          {!block.orphan && block.height > 0n && (
            <AdjecentBlockButtons blockNumber={Number(block.height)} />
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
    </BaseLayout>
  );
};
