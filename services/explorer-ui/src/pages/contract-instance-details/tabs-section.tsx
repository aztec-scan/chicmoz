import { useState, type FC } from "react";
import {
  KeyValueDisplay,
  type DetailItem,
} from "~/components/info-display/key-value-display";
import { OptionButtons } from "~/components/option-buttons";
import { verifiedDeploymentTabs, type TabId } from "./types";

interface PillSectionProps {
  verifiedDeploymentData?: DetailItem[];
  deployerMetadata?: DetailItem[];
  aztecScanNotes?: DetailItem[];
}
export const TabsSection: FC<PillSectionProps> = ({
  verifiedDeploymentData,
  deployerMetadata,
  aztecScanNotes,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabId>("verifiedDeployment");
  const onOptionSelect = (value: string) => {
    setSelectedTab(value as TabId);
  };

  const isAvailable = {
    verifiedDeployment: !!verifiedDeploymentData,
    contactDetails: !!deployerMetadata,
    aztecScanNotes: !!aztecScanNotes,
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "contactDetails":
        return <KeyValueDisplay data={deployerMetadata ?? []} />;
      case "verifiedDeployment":
        return <KeyValueDisplay data={verifiedDeploymentData ?? []} />;
      case "aztecScanNotes":
        return <KeyValueDisplay data={aztecScanNotes ?? []} />;
      default:
        return null;
    }
  };
  return (
    <>
      <OptionButtons
        options={verifiedDeploymentTabs}
        availableOptions={isAvailable}
        onOptionSelect={onOptionSelect}
        selectedItem={selectedTab}
      />
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col gap-4 md:flex-row ">
          <div className="bg-white w-full rounded-lg">{renderTabContent()}</div>
        </div>
      </div>
    </>
  );
};
