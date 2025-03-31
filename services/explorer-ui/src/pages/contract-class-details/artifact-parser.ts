import { type ChicmozL2ContractClassRegisteredEvent } from "@chicmoz-pkg/types";

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
    is_unconstrained: boolean;
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
        if (!func.abi?.parameters) { return; }

        // Use String() to ensure we have primitive string keys
        const funcNameStr = String(func.name);

        func.abi.parameters.forEach((param) => {
          if (param.name === "inputs") { return; }
          const paramNameStr = String(param.name);
          const paramType = param.type?.kind || "unknown";

          if (func.is_unconstrained) {
            if (!uncFunc.has(funcNameStr)) { uncFunc.set(funcNameStr, new Map()); }
            uncFunc.get(funcNameStr)?.set(paramNameStr, paramType);
          }

          if (func.custom_attributes?.includes("public")) {
            if (!pubFunc.has(funcNameStr)) { pubFunc.set(funcNameStr, new Map()); }
            pubFunc.get(funcNameStr)?.set(paramNameStr, paramType);
          }

          if (func.custom_attributes?.includes("private")) {
            if (!privFunc.has(funcNameStr)) { privFunc.set(funcNameStr, new Map()); }
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
