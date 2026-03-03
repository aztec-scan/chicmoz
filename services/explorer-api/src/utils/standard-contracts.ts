import {
  ContractStandard,
  ContractStandardName,
  ContractStandardVersion,
} from "@chicmoz-pkg/types";
import DripperContractJson from "@defi-wonderland/aztec-standards/target/dripper-Dripper.json" with { type: "json" };
import TokenContractJson from "@defi-wonderland/aztec-standards/target/token_contract-Token.json" with { type: "json" };
import EscrowContractJson from "@defi-wonderland/aztec-standards/target/escrow_contract-Escrow.json" with { type: "json" };
import NftContractJson from "@defi-wonderland/aztec-standards/target/nft_contract-NFT.json" with { type: "json" };
import GenericProxyContractJson from "@defi-wonderland/aztec-standards/target/generic_proxy-GenericProxy.json" with { type: "json" };
import TestLogicContractJson from "@defi-wonderland/aztec-standards/target/test_logic_contract-TestLogic.json" with { type: "json" };
import { NoirCompiledContract } from "@aztec/aztec.js/abi";

const contracts: Record<
  ContractStandardVersion,
  Record<ContractStandardName<ContractStandardVersion>, NoirCompiledContract>
> = {
  "4.0.3": {
    // TODO: these types are not actually checked
    token: TokenContractJson as NoirCompiledContract,
    dripper: DripperContractJson as NoirCompiledContract,
    escrow: EscrowContractJson as NoirCompiledContract,
    nft: NftContractJson as NoirCompiledContract,
    generic_proxy: GenericProxyContractJson as NoirCompiledContract,
    test_logic: TestLogicContractJson as NoirCompiledContract,
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
