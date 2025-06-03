import { NoirCompiledContract } from "@aztec/aztec.js";
import {
  ContractStandard,
  ContractStandardName,
  ContractStandardVersion,
} from "@chicmoz-pkg/types";
import TokenContractJson from "@defi-wonderland/aztec-standards/historical/0.0.0-73e84dcc/target/token_contract-Token.json" with { type: "json" };

const contracts: Record<
  ContractStandardVersion,
  Record<ContractStandardName<ContractStandardVersion>, NoirCompiledContract>
> = {
  "0.0.0-73e84dcc": {
    token: TokenContractJson as NoirCompiledContract,
  },
};

export const getContractJson = (
  args: ContractStandard,
): NoirCompiledContract => {
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    contracts: Object.keys(contracts[version as ContractStandardVersion]),
  }));
};
