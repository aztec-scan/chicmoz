import { TokenContract } from "@defi-wonderland/aztec-standards-v410/artifacts/src/artifacts/Token.js";
import { DeployMethod } from "@aztec/aztec.js/contracts";
import { logger } from "../../logger.js";
import { getAccounts, getAztecNodeClient, getPxe, getWallet } from "../pxe.js";
import {
  deployContract,
  registerStandardContractArtifact,
  verifyContractInstanceDeployment,
} from "./utils/index.js";

export async function run() {
  logger.info("===== DEPLOY LEGACY STANDARD CONTRACT =====");
  getPxe();
  const namedWallets = getAccounts();
  const wallet = getWallet();

  const deployerWallet = namedWallets.alice;
  const contractLoggingName = "Legacy Standard Token";

  const { instance: contractInstance } = await deployContract({
    contractLoggingName,
    deployFn: (): DeployMethod<TokenContract> =>
      TokenContract.deploy(
        wallet,
        "Legacy Test Token",
        "LTST",
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
    "4.1.0-rc.4",
  );

  void verifyContractInstanceDeployment({
    contractLoggingName,
    contractInstanceAddress: contractInstance.address.toString(),
    verifyArgs: {
      publicKeysString: contractInstance.publicKeys.toString(),
      deployer: contractInstance.deployer.toString(),
      salt: contractInstance.salt.toString(),
      constructorArgs: [
        "Legacy Test Token",
        "LTST",
        "9",
        "1000000",
        deployerWallet.address.toString(),
      ],
    },
    deployerMetadata: {
      contractIdentifier: contractLoggingName,
      details: "Legacy Aztec standard token contract",
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
          "Legacy standard token contract registered through the override method only available in dev",
        relatedL1ContractAddresses: [],
      },
    },
  });
}
