import { type FC } from "react";
import { useSubTitle } from "~/hooks";
import { BlockProductionSection } from "./block-production-section";
import { FinalizationStatusSection } from "./finalization-status-section";
import { ValidatorStatusSection } from "./validator-status-section";

export const NetworkHealth: FC = () => {
  useSubTitle("Network Health");

  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
      <div className="flex flex-wrap justify-center my-14 md:my-20">
        <h1 className="text-primary dark:text-white">Network Health</h1>
      </div>

      <BlockProductionSection />
      <ValidatorStatusSection />
      <FinalizationStatusSection />
    </div>
  );
};
