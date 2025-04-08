import {
  ContractType,
  type ChicmozL2ContractClassRegisteredEvent,
} from "@chicmoz-pkg/types";
import { routes } from "~/routes/__root";
import { API_URL, aztecExplorer } from "~/service/constants";

export const getContractClassKeyValueData = (
  data: ChicmozL2ContractClassRegisteredEvent,
) => {
  return [
    {
      label: "BLOCK HASH",
      value: data.blockHash,
      link: `${routes.blocks.route}/${data.blockHash}`,
    },
    {
      label: "CLASS ID",
      value: data.contractClassId,
    },
    {
      label: "VERSION",
      value: data.version.toString(),
    },
    {
      label: "ARTIFACT HASH",
      value: data.artifactHash,
    },
    {
      label: "PRIVATE FUNCTIONS ROOT",
      value: data.privateFunctionsRoot,
    },
    {
      label: "API ENDPOINT",
      value: "View raw data",
      extLink: `${API_URL}/${aztecExplorer.getL2ContractClassByIdAndVersion(
        data.contractClassId,
        data.version.toString(),
      )}`,
    },
    {
      label: "CONTRACT TYPE",
      value: data.contractType ?? ContractType.Unknown,
    },
  ];
};

export type SimpleArtifactData = {
  functions: {
    name: string;
    abi: {
      parameters: {
        name: string;
        type: {
          kind: string;
        };
      }[];
    };
    custom_attributes: string[];
    is_utility: boolean;
  }[];
};

export type SimplifiedViewOfFunc = Map<string, Map<string, string>>;

export const getArtifactData = (
  selectedVersion: ChicmozL2ContractClassRegisteredEvent,
) => {
  let artifact: SimpleArtifactData = { functions: [] };
  const privFunc: SimplifiedViewOfFunc = new Map();
  const pubFunc: SimplifiedViewOfFunc = new Map();
  const uncFunc: SimplifiedViewOfFunc = new Map();

  if (selectedVersion.artifactJson) {
    try {
      artifact = JSON.parse(selectedVersion.artifactJson) as SimpleArtifactData;

      artifact.functions.forEach((func) => {
        if (!func.abi?.parameters) {
          return;
        }

        // Use String() to ensure we have primitive string keys
        const funcNameStr = String(func.name);

        func.abi.parameters.forEach((param) => {
          if (param.name === "inputs") {
            return;
          }
          const paramNameStr = String(param.name);
          const paramType = param.type?.kind || "unknown";

          if (func.is_utility) {
            if (!uncFunc.has(funcNameStr)) {
              uncFunc.set(funcNameStr, new Map());
            }
            uncFunc.get(funcNameStr)?.set(paramNameStr, paramType);
          }

          if (func.custom_attributes?.includes("public")) {
            if (!pubFunc.has(funcNameStr)) {
              pubFunc.set(funcNameStr, new Map());
            }
            pubFunc.get(funcNameStr)?.set(paramNameStr, paramType);
          }

          if (func.custom_attributes?.includes("private")) {
            if (!privFunc.has(funcNameStr)) {
              privFunc.set(funcNameStr, new Map());
            }
            privFunc.get(funcNameStr)?.set(paramNameStr, paramType);
          }
        });
      });
    } catch (error) {
      console.error("Error parsing artifact JSON:", error);
    }
  }

  return {
    artifact,
    privFunc,
    pubFunc,
    uncFunc,
  };
};
