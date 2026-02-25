import { ContractClassPublishedEvent } from "@aztec/protocol-contracts/class-registry";
import { publishContractClass } from "@aztec/aztec.js/deployment";
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
  type ContractInstanceWithAddress,
  type DeployTxReceipt,
  DeployMethod,
} from "@aztec/aztec.js/contracts";
import { FunctionType, NoirCompiledContract } from "@aztec/aztec.js/abi";
import { PXE } from "@aztec/pxe/server";
import { Fr } from "@aztec/aztec.js/fields";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { EmbeddedWallet } from "@aztec/wallets/embedded";
import { AztecNode } from "@aztec/aztec.js/node";
import { BlockNumber } from "@aztec/foundation/branded-types";
import { Wallet } from "@aztec/aztec.js/wallet";
import { Account } from "@aztec/aztec.js/account";
import { TxReceipt } from "@aztec/aztec.js/tx";

export const truncateHashString = (value: string) => {
  const startHash = value.substring(0, 6);
  const endHash = value.substring(value.length - 4, value.length);
  return `${startHash}...${endHash}`;
};

export const logAndWaitForTx = async (
  txReceiptPromise: Promise<TxReceipt>,
  additionalInfo: string,
) => {
  logger.info(`📫 TX (${additionalInfo}) waiting...`);
  const receipt = await txReceiptPromise;
  const hash = receipt.txHash.toString();
  logger.info(
    `⛏  TX ${hash} (${additionalInfo}) block ${receipt.blockNumber}`,
  );
  return receipt;
};

export const simulateThenSend = async ({
  method,
  from,
  additionalInfo,
}: {
  method: {
    simulate: (opts: { from: AztecAddress }) => Promise<unknown>;
    send: (opts: { from: AztecAddress }) => Promise<TxReceipt>;
  };
  from: AztecAddress;
  additionalInfo: string;
}) => {
  try {
    await method.simulate({ from });
  } catch (err) {
    logger.error(
      `simulate() failed (${additionalInfo}) from=${from.toString()}: ${
        (err as Error).stack ?? (err as Error).message
      }`,
    );

    throw err;
  }

  const receipt = await method.send({ from });
  const hash = receipt.txHash.toString();
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
  wallet: EmbeddedWallet;
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
  const deployReceipt = await deployFunction.send({
    from: feePayer,
    wait: { returnReceipt: true },
  });
  logger.info(
    `    Account deployed (${accountName}) block ${deployReceipt.blockNumber}`,
  );
  logger.info(`    Getting Schnorr account wallet... (${accountName})`);
  logger.info(
    `    🔐 Schnorr account created at: ${address.toString()} (${accountName})`,
  );
  return { schnorrAccount, address };
};

export const getNewAccount = async (
  wallet: EmbeddedWallet,
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
  const contractClassLogsStr = jsonStringify(contractClassLogs);
  const contractClassLogsPreview =
    contractClassLogsStr.length > 300
      ? `${contractClassLogsStr.slice(0, 300)}...`
      : contractClassLogsStr;
  logger.info(contractClassLogsPreview);
  return contractClasses[0]?.id.toString();
};

export const deployContract = async <T extends Contract>({
  contractLoggingName,
  deployFn,
  broadcastWithWallet,
  node,
  from,
}: {
  contractLoggingName: string;
  deployFn: () => DeployMethod<T>;
  broadcastWithWallet?: Wallet;
  node: AztecNode;
  from?: AztecAddress;
}): Promise<{ contract: T; instance: ContractInstanceWithAddress }> => {
  logger.info(`DEPLOYING ${contractLoggingName}`);

  const deployMethod = deployFn();
  const feePayer = from ?? getAccounts().alice.address;

  logger.info(`📫 ${contractLoggingName} (Deploying contract)`);
  const deployResult: DeployTxReceipt<T> = await deployMethod.send({
    from: feePayer,
    wait: { returnReceipt: true },
  });

  const { contract: deployedContract, instance } = deployResult;
  const addressString = deployedContract.address.toString();
  const newClassId = await getNewContractClassId(
    node,
    deployResult.blockNumber,
  );
  const classIdString = newClassId
    ? `(🍏 also, a new contract class was added: ${newClassId})`
    : `(🍎 attached currentclassId: ${instance.currentContractClassId.toString()})`;
  logger.info(
    `⛏  ${contractLoggingName} instance deployed at: ${addressString} block: ${deployResult.blockNumber} ${classIdString}`,
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
  logger.info("PUBLISHING CONTRACT CLASS");
  for (const fn of contract.artifact.functions) {
    logger.info(`${getFunctionSpacer(fn.functionType)}${fn.name}`);
  }
  const interaction = await publishContractClass(wallet, contract.artifact);

  try {
    await interaction.send({ from: getAccounts().alice.address });
    logger.info("CONTRACT CLASS PUBLISHED");
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    // When re-running against a chain/PXE with state, publishing can fail with
    // "Existing nullifier" (already published). This should be non-fatal.
    if (msg.includes("Existing nullifier")) {
      logger.warn(`Contract class publish skipped: ${msg}`);
      return;
    }
    throw err;
  }
};

export const publicDeployAccounts = async (
  sender: Account,
  accountsToDeploy: Account[],
  wallet: Wallet,
  _pxe: PXE,
) => {
  const notPubliclyDeployedAccounts = await Promise.all(
    accountsToDeploy.map(async (a) => {
      const address = a.getAddress();
      const contractMetadata = await wallet.getContractMetadata(address);
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
    if (!contractMetadata.instance) {
      logger.warn(
        `🚨 Contract instance not found for contract isIntialized: ${contractMetadata.isContractInitialized}`,
      );
      continue;
    }
    await wallet.registerContract(contractMetadata.instance);
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
    waitForIndexing: true,
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
    waitForIndexing: true,
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
      waitForIndexing: true,
    });
  } catch (err) {
    // Explorer is best-effort here; failures should not break scenarios.
    logger.warn(
      `verifyContractInstanceDeployment failed (${contractLoggingName}): ${(err as Error).message}`,
    );
  }
};
