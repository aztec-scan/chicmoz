import { FC, useState } from "react";
import {
  DetailItem,
  KeyValueDisplay,
} from "~/components/info-display/key-value-display";
import { OptionButtons } from "~/components/option-buttons";
import { TabId, verifiedDeploymentTabs } from "./types";

interface PillSectionProps {
  verifiedDeploymentData?: DetailItem[];
  contactDetailsData?: DetailItem[];
}
export const TabsSection: FC<PillSectionProps> = ({
  verifiedDeploymentData,
  contactDetailsData,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabId>("verifiedDeployment");
  const onOptionSelect = (value: string) => {
    setSelectedTab(value as TabId);
  };

  const isAvailable = {
    verifiedDeployment: !!verifiedDeploymentData,
    contactDetails: !!contactDetailsData,
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "contactDetails":
        return <KeyValueDisplay data={contactDetailsData ?? []} />;
      case "verifiedDeployment":
        return <KeyValueDisplay data={verifiedDeploymentData ?? []} />;
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
