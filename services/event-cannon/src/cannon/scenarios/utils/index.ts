import {
  broadcastPrivateFunction,
  broadcastUtilityFunction,
} from "@aztec/aztec.js/deployment";
import { ContractClassPublishedEvent } from "@aztec/protocol-contracts/class-registry";
import {
  generateVerifyArtifactPayload,
  generateVerifyArtifactUrl,
  generateVerifyInstancePayload,
  generateVerifyInstanceUrl,
} from "@chicmoz-pkg/contract-verification";
import {
  ChicmozL2ContractInstanceDeployerMetadata,
  jsonStringify,
} from "@chicmoz-pkg/types";
import { EXPLORER_API_URL } from "../../../environment.js";
import { logger } from "../../../logger.js";
import { getAccounts } from "../../pxe.js";
import { callExplorerApi } from "./explorer-api.js";
import {
  Contract,
  DeploySentTx,
  SentTx,
  type ContractInstanceWithAddress,
} from "@aztec/aztec.js/contracts";
import {
  FunctionSelector,
  FunctionType,
  NoirCompiledContract,
} from "@aztec/aztec.js/abi";
import { PXE } from "@aztec/pxe/server";
import { Fr } from "@aztec/aztec.js/fields";
import { TestWallet } from "@aztec/test-wallet/server";
import { AztecNode } from "@aztec/aztec.js/node";
import { BlockNumber } from "@aztec/foundation/branded-types";
import { Wallet } from "@aztec/aztec.js/wallet";
import { Account } from "@aztec/aztec.js/account";

export const truncateHashString = (value: string) => {
  const startHash = value.substring(0, 6);
  const endHash = value.substring(value.length - 4, value.length);
  return `${startHash}...${endHash}`;
};

export const logAndWaitForTx = async (tx: SentTx, additionalInfo: string) => {
  const hash = (await tx.getTxHash()).toString();
  logger.info(`📫 TX ${hash} (${additionalInfo})`);
  const receipt = await tx.wait();
  logger.info(
    `⛏  TX ${hash} (${additionalInfo}) block ${receipt.blockNumber}`,
  );
  return receipt;
};

export const getFunctionSpacer = (type: FunctionType) => {
  if (type === FunctionType.PRIVATE) {
    return type + "       ";
  }
  if (type === FunctionType.UTILITY) {
    return type + " ";
  }
  return type + "        ";
};

export const getNewSchnorrAccount = async ({
  wallet,
  secretKey,
  salt,
  accountName,
}: {
  wallet: TestWallet;
  secretKey: Fr;
  salt: Fr;
  accountName: string;
}) => {
  logger.info(`  Creating new Schnorr account... (${accountName})`);
  const schnorrAccount = await wallet.createSchnorrAccount(secretKey, salt);

  logger.info(
    `    Schnorr account created ${schnorrAccount.address.toString()} (${accountName})`,
  );
  const { address } = await schnorrAccount.getCompleteAddress();
  logger.info(`    Deploying Schnorr account to network... (${accountName})`);
  const deployFunction = await schnorrAccount.getDeployMethod();

  // In real networks the fee payer must be funded. `AztecAddress.ZERO` works in some local setups
  // but fails in devnet/testnet where it has no balance.
  const feePayer = getAccounts().alice.address;
  await logAndWaitForTx(
    deployFunction.send({ from: feePayer }),
    `Deploying account ${accountName}`,
  );
  logger.info(`    Getting Schnorr account wallet... (${accountName})`);
  logger.info(
    `    🔐 Schnorr account created at: ${address.toString()} (${accountName})`,
  );
  return { schnorrAccount, address };
};

export const getNewAccount = async (
  wallet: TestWallet,
  accountName: string,
) => {
  const secretKey = Fr.random();
  const salt = Fr.random();
  return getNewSchnorrAccount({
    wallet,
    secretKey,
    salt,
    accountName,
  });
};

const getNewContractClassId = async (
  node: AztecNode,
  blockNumber?: BlockNumber,
) => {
  if (!blockNumber) {
    return undefined;
  }
  const block = await node.getBlock(blockNumber);
  if (!block) {
    throw new Error(`Block ${blockNumber} not found`);
  }
  const contractClassLogs = block.body.txEffects
    .flatMap((txEffect) => (txEffect ? [txEffect.contractClassLogs] : []))
    .flatMap((txLog) => txLog.flat());

  const contractClasses = await Promise.all(
    contractClassLogs
      .filter((log) =>
        ContractClassPublishedEvent.isContractClassPublishedEvent(log),
      )
      .map((log) => ContractClassPublishedEvent.fromLog(log))
      .map((e) => e.toContractClassPublic()),
  );

  logger.info(`  Found ${contractClasses.length} contract classes`);
  logger.info(`${jsonStringify(contractClassLogs)}`);
  return contractClasses[0]?.id.toString();
};

export const deployContract = async <T extends Contract>({
  contractLoggingName,
  deployFn,
  broadcastWithWallet,
  node,
}: {
  contractLoggingName: string;
  deployFn: () => DeploySentTx<T>;
  broadcastWithWallet?: Wallet;
  node: AztecNode;
}): Promise<{ contract: T; instance: ContractInstanceWithAddress }> => {
  logger.info(`DEPLOYING ${contractLoggingName}`);

  const contractTx = deployFn();
  const hash = (await contractTx.getTxHash()).toString();

  // Get instance BEFORE calling deployed()
  const instance = await contractTx.getInstance();

  logger.info(`📫 ${contractLoggingName} txHash: ${hash} (Deploying contract)`);
  const deployedContract = await contractTx.deployed();
  const receipt = await contractTx.wait();
  const addressString = deployedContract.address.toString();
  const newClassId = await getNewContractClassId(node, receipt.blockNumber);
  const classIdString = newClassId
    ? `(🍏 also, a new contract class was added: ${newClassId})`
    : `(🍎 attached currentclassId: ${instance.currentContractClassId.toString()})`;
  logger.info(
    `⛏  ${contractLoggingName} instance deployed at: ${addressString} block: ${receipt.blockNumber} ${classIdString}`,
  );
  if (broadcastWithWallet) {
    await broadcastFunctions({
      wallet: broadcastWithWallet,
      contract: deployedContract,
    });
  }
  return { contract: deployedContract, instance };
};

export const broadcastFunctions = async ({
  wallet,
  contract,
}: {
  wallet: Wallet;
  contract: Contract;
}) => {
  logger.info("BROADCASTING FUNCTIONS");
  for (const fn of contract.artifact.functions) {
    logger.info(`${getFunctionSpacer(fn.functionType)}${fn.name}`);
    if (fn.functionType === FunctionType.PRIVATE) {
      const selector = await FunctionSelector.fromNameAndParameters(
        fn.name,
        fn.parameters,
      );
      await logAndWaitForTx(
        (
          await broadcastPrivateFunction(wallet, contract.artifact, selector)
        ).send({ from: getAccounts().alice.address }),
        `Broadcasting private function ${fn.name}`,
      );
    }
    if (fn.functionType === FunctionType.UTILITY) {
      const selector = await FunctionSelector.fromNameAndParameters(
        fn.name,
        fn.parameters,
      );
      await logAndWaitForTx(
        (
          await broadcastUtilityFunction(wallet, contract.artifact, selector)
        ).send({ from: getAccounts().alice.address }),
        `Broadcasting utility function ${fn.name}`,
      );
    }
  }
};

export const publicDeployAccounts = async (
  sender: Account,
  accountsToDeploy: Account[],
  wallet: Wallet,
  pxe: PXE,
) => {
  const notPubliclyDeployedAccounts = await Promise.all(
    accountsToDeploy.map(async (a) => {
      const address = a.getAddress();
      const contractMetadata = await pxe.getContractMetadata(address);
      return contractMetadata;
    }),
  ).then((results) =>
    results.filter((result) => !result.isContractInitialized),
  );
  if (notPubliclyDeployedAccounts.length === 0) {
    return;
  }

  // Register contract class first
  await wallet.registerSender(sender.getAddress());

  // Register each contract instance individually
  for (const contractMetadata of notPubliclyDeployedAccounts) {
    if (!contractMetadata.contractInstance) {
      logger.warn(
        `🚨 Contract instance not found for contract isIntialized: ${contractMetadata.isContractInitialized}`,
      );
      continue;
    }
    await wallet.registerContract(contractMetadata.contractInstance);
  }
};

export const registerContractClassArtifact = async (
  contractLoggingName: string,
  artifactObj: { default: NoirCompiledContract } | NoirCompiledContract,
  contractClassId: string,
  version: number,
) => {
  const url = generateVerifyArtifactUrl(
    EXPLORER_API_URL,
    contractClassId,
    version,
  );
  const postData = JSON.stringify(generateVerifyArtifactPayload(artifactObj));
  await callExplorerApi({
    loggingString: `📜 registerContractClassArtifact ${contractLoggingName}`,
    urlStr: url,
    postData,
    method: "POST",
    waitForIndexing: false,
  });
};

export const registerStandardContractArtifact = async (
  contractLoggingName: string,
  contractClassId: string,
  version: number,
  standardName: string,
  standardVersion: string,
) => {
  const url = `${EXPLORER_API_URL}/l2/contract-classes/${contractClassId}/versions/${version}/standard-artifact`;
  const postData = JSON.stringify({
    name: standardName,
    version: standardVersion,
  });
  await callExplorerApi({
    loggingString: `🏗 registerStandardContractArtifact ${contractLoggingName}`,
    urlStr: url,
    postData,
    method: "POST",
    waitForIndexing: false,
  });
};

export const verifyContractInstanceDeployment = async ({
  contractLoggingName,
  contractInstanceAddress,
  verifyArgs,
  deployerMetadata,
}: {
  contractLoggingName: string;
  contractInstanceAddress: string;
  verifyArgs: Parameters<typeof generateVerifyInstancePayload>[0];
  deployerMetadata?: Omit<
    ChicmozL2ContractInstanceDeployerMetadata,
    "address" | "uploadedAt"
  >;
}) => {
  const url = generateVerifyInstanceUrl(
    EXPLORER_API_URL,
    contractInstanceAddress,
  );

  const postData = JSON.stringify({
    verifiedDeploymentArguments: generateVerifyInstancePayload(verifyArgs),
    deployerMetadata,
  });

  try {
    await callExplorerApi({
      loggingString: `🧐 verifyContractInstanceDeployment ${contractLoggingName}`,
      urlStr: url,
      postData,
      method: "POST",
      waitForIndexing: false,
    });
  } catch (err) {
    // Explorer is best-effort here; failures should not break scenarios.
    logger.warn(
      `verifyContractInstanceDeployment failed (${contractLoggingName}): ${(err as Error).message}`,
    );
  }
};
