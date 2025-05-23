import { type ChicmozL2TxEffectDeluxe } from "@chicmoz-pkg/types";
import { type FC, useState } from "react";
import { ValueListDisplay } from "~/components/info-display/value-list-display";
import { OptionButtons } from "~/components/option-buttons";
import { PrivateLogs } from "./tabs/private-logs";
import { PublicDataWrites } from "./tabs/public-data-write";
import { PublicLogs } from "./tabs/public-logs";
import { type TabId, txEffectTabs } from "./types";
import { mapTxEffectsData } from "./utils";

interface PillSectionProps {
  txEffects: ChicmozL2TxEffectDeluxe;
}
export const TabsSection: FC<PillSectionProps> = ({ txEffects }) => {
  const [selectedTab, setSelectedTab] = useState<TabId>("nullifiers");
  const onSelectChange = (value: string) => {
    setSelectedTab(value as TabId);
  };

  const txEffectData = mapTxEffectsData(txEffects);

  const renderTabContent = () => {
    switch (selectedTab) {
      case "privateLogs":
        return <PrivateLogs logs={txEffects.privateLogs} />;
      case "publicLogs":
        return <PublicLogs logs={txEffects.publicLogs} />;
      case "contractClassLogs":
        return <PublicLogs logs={txEffects.contractClassLogs} />;
      case "nullifiers":
        return (
          <ValueListDisplay title="Nullifiers" values={txEffects.nullifiers} />
        );
      case "noteHashes":
        return (
          <ValueListDisplay title="Note hashes" values={txEffects.noteHashes} />
        );
      case "l2ToL1Msgs":
        return (
          <ValueListDisplay
            title="L2 to L1 messages"
            values={txEffects.l2ToL1Msgs}
          />
        );
      case "publicDataWrites":
        return <PublicDataWrites writes={txEffects.publicDataWrites} />;
      default:
        return null;
    }
  };

  return (
    <>
      <OptionButtons
        options={txEffectTabs}
        availableOptions={txEffectData}
        onOptionSelect={onSelectChange}
        selectedItem={selectedTab}
      />
      <div className="bg-white rounded-lg shadow-md p-4">
        {renderTabContent()}
      </div>
    </>
  );
};
