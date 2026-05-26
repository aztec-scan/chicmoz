import {
  ContractStandard,
  ContractStandardName,
  ContractStandardVersion,
} from "@chicmoz-pkg/types";
import { NoirCompiledContract } from "@aztec/aztec.js/abi";
import DripperContractJsonLegacy from "@defi-wonderland/aztec-standards-v410/target/dripper-Dripper.json" with { type: "json" };
import EscrowContractJsonLegacy from "@defi-wonderland/aztec-standards-v410/target/escrow_contract-Escrow.json" with { type: "json" };
import GenericProxyContractJsonLegacy from "@defi-wonderland/aztec-standards-v410/target/generic_proxy-GenericProxy.json" with { type: "json" };
import NftContractJsonLegacy from "@defi-wonderland/aztec-standards-v410/target/nft_contract-NFT.json" with { type: "json" };
import TestLogicContractJsonLegacy from "@defi-wonderland/aztec-standards-v410/target/test_logic_contract-TestLogic.json" with { type: "json" };
import TokenContractJsonLegacy from "@defi-wonderland/aztec-standards-v410/target/token_contract-Token.json" with { type: "json" };
import DripperContractJsonCurrent from "@defi-wonderland/aztec-standards-v420/target/dripper-Dripper.json" with { type: "json" };
import EscrowContractJsonCurrent from "@defi-wonderland/aztec-standards-v420/target/escrow_contract-Escrow.json" with { type: "json" };
import GenericProxyContractJsonCurrent from "@defi-wonderland/aztec-standards-v420/target/generic_proxy-GenericProxy.json" with { type: "json" };
import NftContractJsonCurrent from "@defi-wonderland/aztec-standards-v420/target/nft_contract-NFT.json" with { type: "json" };
import TestLogicContractJsonCurrent from "@defi-wonderland/aztec-standards-v420/target/test_logic_contract-TestLogic.json" with { type: "json" };
import TokenContractJsonCurrent from "@defi-wonderland/aztec-standards-v420/target/token_contract-Token.json" with { type: "json" };

const contracts: Record<
  ContractStandardVersion,
  Record<ContractStandardName<ContractStandardVersion>, NoirCompiledContract>
> = {
  "4.1.0-rc.4": {
    // TODO: these types are not actually checked
    token: TokenContractJsonLegacy as unknown as NoirCompiledContract,
    dripper: DripperContractJsonLegacy as unknown as NoirCompiledContract,
    escrow: EscrowContractJsonLegacy as unknown as NoirCompiledContract,
    nft: NftContractJsonLegacy as unknown as NoirCompiledContract,
    generic_proxy:
      GenericProxyContractJsonLegacy as unknown as NoirCompiledContract,
    test_logic: TestLogicContractJsonLegacy as unknown as NoirCompiledContract,
  },
  "4.2.0-aztecnr-rc.2": {
    // TODO: these types are not actually checked
    token: TokenContractJsonCurrent as unknown as NoirCompiledContract,
    dripper: DripperContractJsonCurrent as unknown as NoirCompiledContract,
    escrow: EscrowContractJsonCurrent as unknown as NoirCompiledContract,
    nft: NftContractJsonCurrent as unknown as NoirCompiledContract,
    generic_proxy:
      GenericProxyContractJsonCurrent as unknown as NoirCompiledContract,
    test_logic: TestLogicContractJsonCurrent as unknown as NoirCompiledContract,
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
