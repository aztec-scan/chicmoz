import { TokenContract as TokenContractUntyped } from "@defi-wonderland/aztec-standards-v420/artifacts/src/artifacts/Token.js";
import type { Contract, DeployMethod } from "@aztec/aztec.js/contracts";
import type { Wallet } from "@aztec/aztec.js/wallet";
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

const STANDARD_TOKEN_VERSION = "4.2.0-aztecnr-rc.2";
const STANDARD_TOKEN_ORIGIN = `Standard token · v${STANDARD_TOKEN_VERSION}`;
const TOKEN_DECIMALS = 9;
const TOKEN_MAX_SUPPLY = 1_000_000;

const TOKENS = [
  { name: "mockEUR", symbol: "mockEUR" },
  { name: "mockUSD", symbol: "mockUSD" },
  { name: "mockGBP", symbol: "mockGBP" },
] as const;

export async function run() {
  logger.info("===== DEPLOY CURRENT STANDARD TOKEN CONTRACTS =====");
  getPxe();
  const namedWallets = getAccounts();
  const wallet = getWallet();

  const deployerWallet = namedWallets.alice;

  for (const token of TOKENS) {
    const contractLoggingName = token.name;
    logger.info(`===== DEPLOY ${contractLoggingName} =====`);

    const { instance: contractInstance } = await deployContract({
      contractLoggingName,
      deployFn: (): DeployMethod<Contract> =>
        TokenContract.deploy(
          wallet,
          token.name,
          token.symbol,
          TOKEN_DECIMALS,
          TOKEN_MAX_SUPPLY,
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
      STANDARD_TOKEN_VERSION,
      { throwOnError: true },
    );

    await verifyContractInstanceDeployment({
      contractLoggingName,
      contractInstanceAddress: contractInstance.address.toString(),
      verifyArgs: {
        publicKeysString: contractInstance.publicKeys.toString(),
        deployer: contractInstance.deployer.toString(),
        salt: contractInstance.salt.toString(),
        constructorArgs: [
          token.name,
          token.symbol,
          TOKEN_DECIMALS.toString(),
          TOKEN_MAX_SUPPLY.toString(),
          deployerWallet.address.toString(),
        ],
      },
      deployerMetadata: {
        contractIdentifier: contractLoggingName,
        details: STANDARD_TOKEN_ORIGIN,
        creatorName: "Event Cannon",
        creatorContact:
          "email: test@test.com, discord: test#1234, telegram: @test",
        appUrl: "https://aztec.network",
        repoUrl: "https://github.com/defi-wonderland/aztec-standards",
        reviewedAt: new Date(),
        contractType: "token",
        aztecScanNotes: {
          name: token.name,
          origin: STANDARD_TOKEN_ORIGIN,
          comment: `${token.name} deployed by event-cannon from @defi-wonderland/aztec-standards ${STANDARD_TOKEN_VERSION}.`,
          category: "defi",
          relatedL1ContractAddresses: [],
        },
      },
      throwOnError: true,
    });

    logger.info(
      `✅ ${contractLoggingName} deployed and validated at ${contractInstance.address.toString()}`,
    );
  }
}
