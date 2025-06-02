import { NoirCompiledContract } from "@aztec/aztec.js";
import TokenContractJson from "@defi-wonderland/aztec-standards/historical/0.0.0-73e84dcc/target/token_contract-Token.json" with { type: "json" };
import { z } from "zod";

export const getContractJsonSchema = z.object({
  name: z.string(),
  version: z.string(),
});

export type GetContractJsonSchema = z.infer<typeof getContractJsonSchema>;

const contracts: Record<string, Record<string, NoirCompiledContract>> = {
  "0.0.0-73e84dcc": {
    token: TokenContractJson as NoirCompiledContract,
  },
};

export const getContractJson = (args: GetContractJsonSchema) => {
  const { name, version } = args;
  const contract = contracts[version]?.[name];
  if (!contract) {
    throw new Error(`Contract ${name} version ${version} not found`);
  }
  return contract;
};

export const getVersions = () => {
  return Object.keys(contracts).map((version) => ({
    version,
    contracts: Object.keys(contracts[version]),
  }));
}
