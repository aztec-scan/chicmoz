import { useParams } from "@tanstack/react-router";
import { type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { Loader } from "~/components/loader";
import { OrphanedBanner } from "~/components/orphaned-banner";
import { useContractClass, useContractClasses, useSubTitle } from "~/hooks";
import { TabSection } from "./tabs-section";
import { getContractClassKeyValueData } from "./util";

export const ContractClassDetails: FC = () => {
  const { id, version } = useParams({
    from: "/contracts/classes/$id/versions/$version",
  });
  useSubTitle(`Ctrct cls ${id}`);

  const contractClassesRes = useContractClasses(id);

  const selectedVersionWithArtifactRes = useContractClass({
    classId: id,
    version: version,
    includeArtifactJson: true,
  });

  if (!id) {
    return <div>No classId</div>;
  }
  if (!version) {
    return <div>No version provided</div>;
  }

  const selectedVersion = selectedVersionWithArtifactRes?.data
    ? selectedVersionWithArtifactRes.data
    : contractClassesRes.data?.find(
        (contract) => contract.version === Number(version),
      );

  const headerStr = `Contract class details${
    selectedVersion?.artifactContractName
      ? ` - "${selectedVersion?.artifactContractName}"`
      : ""
  }`;

  return (
    <div className="mx-auto px-[70px] max-w-[1440px]">
      <div className="flex flex-wrap m-3">
        <h3 className="mt-2 text-primary md:hidden">{headerStr}</h3>
        <h2 className="hidden md:block md:mt-6 md:text-primary">{headerStr}</h2>
      </div>

      <div className="flex flex-col gap-4 mt-8">
        {selectedVersion &&
        "isOrphaned" in selectedVersion &&
        selectedVersion.isOrphaned ? (
          <OrphanedBanner type="contract-class" />
        ) : null}
        <div className="bg-white rounded-lg shadow-md p-4">
          {contractClassesRes.isLoading && <Loader amount={1} />}
          {contractClassesRes.error && <div>error</div>}
          {selectedVersion && (
            <KeyValueDisplay
              data={getContractClassKeyValueData(selectedVersion)}
            />
          )}
        </div>
      </div>
      <div className="mt-5">
        <TabSection
          contractClasses={contractClassesRes}
          contractClassId={id}
          selectedVersion={selectedVersion}
          isContractArtifactLoading={selectedVersionWithArtifactRes.isLoading}
          contractArtifactError={selectedVersionWithArtifactRes.error}
        />
      </div>
    </div>
  );
};
