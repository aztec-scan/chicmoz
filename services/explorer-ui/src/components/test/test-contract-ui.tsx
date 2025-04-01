import { type FC } from "react";
import { type QueryObserverResult } from "@tanstack/react-query";
import tokenBridgeContractArtifactJson from "@aztec/noir-contracts.js/artifacts/token_bridge_contract-TokenBridge?raw";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { TabSection } from "~/pages/contract-class-details/tabs-section";
import { getContractClassKeyValueData } from "~/pages/contract-class-details/util";
import { ChicmozL2ContractClassRegisteredEvent } from "@chicmoz-pkg/types";

export const TestContractUI: FC = () => {
  // Create mock contract class data
  const MOCK_CONTRACT_CLASS: ChicmozL2ContractClassRegisteredEvent = {
    version: 1,
    blockHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    contractClassId: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    artifactHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    privateFunctionsRoot: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    // @ts-ignore - Using Uint8Array since Buffer is not available in browser
    packedBytecode: new Uint8Array([109, 111, 99, 107, 32, 98, 121, 116, 101, 99, 111, 100, 101]), // "mock bytecode" as bytes
    artifactContractName: "EasyPrivateVoting"
  };

  // Mock artifact JSON string
  //const mockArtifactJson = JSON.stringify({
  //  name: "EasyPrivateVoting",
  //  version: "0.1.0",
  //  functions: [
  //    {
  //      name: "constructor",
  //      abi: {
  //        parameters: []
  //      },
  //      custom_attributes: ["public"],
  //      is_unconstrained: false
  //    },
  //    {
  //      name: "vote",
  //      abi: {
  //        parameters: [
  //          { 
  //            name: "option", 
  //            type: { 
  //              kind: "field" 
  //            } 
  //          }
  //        ]
  //      },
  //      custom_attributes: ["private"],
  //      is_unconstrained: false
  //    },
  //    {
  //      name: "get_results",
  //      abi: {
  //        parameters: []
  //      },
  //      custom_attributes: [],
  //      is_unconstrained: true
  //    }
  //  ],
  //  constants: {},
  //  types: {},
  //  events: []
  //});

  // Create mock data with artifact JSON
  const mockContractWithArtifact = {
    ...MOCK_CONTRACT_CLASS,
    artifactJson: tokenBridgeContractArtifactJson,
  };

  // Create mock query results to pass to TabSection
  const mockContractClassesResult = {
    data: [mockContractWithArtifact],
    isLoading: false,
    error: null,
    isError: false
  } as QueryObserverResult<ChicmozL2ContractClassRegisteredEvent[], Error>;

  const headerStr = `Test Contract UI - "${mockContractWithArtifact.artifactContractName}"`;

  return (
    <div>
      <div className="flex flex-wrap m-3">
        <h3 className="mt-2 text-primary md:hidden">{headerStr}</h3>
        <h2 className="hidden md:block md:mt-6 md:text-primary">{headerStr}</h2>
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <KeyValueDisplay
            data={getContractClassKeyValueData(mockContractWithArtifact)}
          />
        </div>
      </div>
      <div className="mt-5">
        <TabSection
          contractClasses={mockContractClassesResult}
          contractClassId={mockContractWithArtifact.contractClassId}
          selectedVersion={mockContractWithArtifact}
          isContractArtifactLoading={false}
          contractArtifactError={null}
        />
      </div>
    </div>
  );
};
