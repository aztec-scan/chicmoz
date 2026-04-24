import { TokenContract as TokenContractUntyped } from "@defi-wonderland/aztec-standards-v420/artifacts/src/artifacts/Token.js";
import { Contract, DeployMethod } from "@aztec/aztec.js/contracts";
import { Wallet } from "@aztec/aztec.js/wallet";
import { logger } from "../../logger.js";

type TokenContractStatic = {
  deploy: (
    wallet: Wallet,
    name: string,
    symbol: string,
    decimals: number,
    maxSupply: number,
    admin: unknown,
  ) => DeployMethod<Contract>;
};
const TokenContract = TokenContractUntyped as unknown as TokenContractStatic;
import { getAccounts, getAztecNodeClient, getPxe, getWallet } from "../pxe.js";
import {
  deployContract,
  registerStandardContractArtifact,
  verifyContractInstanceDeployment,
} from "./utils/index.js";

export async function run() {
  logger.info("===== DEPLOY CURRENT STANDARD CONTRACT =====");
  getPxe();
  const namedWallets = getAccounts();
  const wallet = getWallet();

  const deployerWallet = namedWallets.alice;
  const contractLoggingName = "Current Standard Token";

  const { instance: contractInstance } = await deployContract({
    contractLoggingName,
    deployFn: (): DeployMethod<Contract> =>
      TokenContract.deploy(
        wallet,
        "Current Test Token",
        "CTST",
        9,
        1_000_000,
        deployerWallet.address,
      ),
    from: deployerWallet.address,
    node: getAztecNodeClient(),
  });

  await registerStandardContractArtifact(
    contractLoggingName,
    contractInstance.currentContractClassId.toString(),
    contractInstance.version,
    "token",
    "4.2.0-aztecnr-rc.2",
  );

  void verifyContractInstanceDeployment({
    contractLoggingName,
    contractInstanceAddress: contractInstance.address.toString(),
    verifyArgs: {
      publicKeysString: contractInstance.publicKeys.toString(),
      deployer: contractInstance.deployer.toString(),
      salt: contractInstance.salt.toString(),
      constructorArgs: [
        "Current Test Token",
        "CTST",
        "9",
        "1000000",
        deployerWallet.address.toString(),
      ],
    },
    deployerMetadata: {
      contractIdentifier: contractLoggingName,
      details: "Current Aztec standard token contract",
      creatorName: "Event Cannon",
      creatorContact:
        "email: test@test.com, discord: test#1234, telegram: @test",
      appUrl: "https://aztec.network",
      repoUrl: "https://github.com/AztecProtocol/aztec-packages",
      reviewedAt: new Date(),
      aztecScanNotes: {
        name: contractLoggingName,
        origin: "This contract was deployed by the event-cannon",
        comment:
          "Current standard token contract registered through the override method only available in dev",
        relatedL1ContractAddresses: [],
      },
    },
  });
}
