import {
  SchnorrAccountContractArtifact,
  getSchnorrAccount,
} from "@aztec/accounts/schnorr";
import {
  AztecNode,
  BatchCall,
  Contract,
  DeploySentTx,
  Fr,
  FunctionCall,
  FunctionSelector,
  FunctionType,
  NoirCompiledContract,
  PXE,
  SentTx,
  Wallet,
} from "@aztec/aztec.js";
import {
  broadcastPrivateFunction,
  broadcastUnconstrainedFunction,
  deployInstance,
  registerContractClass,
} from "@aztec/aztec.js/deployment";
import { ContractClassRegisteredEvent } from "@aztec/protocol-contracts/class-registerer";
import { deriveSigningKey } from "@aztec/stdlib/keys"
import {
  generateVerifyArtifactPayload,
  generateVerifyArtifactUrl,
  generateVerifyInstancePayload,
  generateVerifyInstanceUrl,
} from "@chicmoz-pkg/contract-verification";
import { ChicmozL2ContractInstanceDeployerMetadata } from "@chicmoz-pkg/types";
import { EXPLORER_API_URL } from "../../../environment.js";
import { logger } from "../../../logger.js";
import { callExplorerApi } from "./explorer-api.js";

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
  if (type === FunctionType.UNCONSTRAINED) {
    return type + " ";
  }
  return type + "        ";
};

export const getNewSchnorrAccount = async ({
  pxe,
  secretKey,
  salt,
  accountName,
}: {
  pxe: PXE;
  secretKey: Fr;
  salt: Fr;
  accountName: string;
}) => {
  logger.info(`  Creating new Schnorr account... (${accountName})`);
  const schnorrAccount = await getSchnorrAccount(
    pxe,
    secretKey,
    deriveSigningKey(secretKey),
    salt,
  );
  logger.info(
    `    Schnorr account created ${schnorrAccount
      .getAddress()
      .toString()} (${accountName})`,
  );
  const { address } = await schnorrAccount.getCompleteAddress();
  logger.info(`    Deploying Schnorr account to network... (${accountName})`);
  await logAndWaitForTx(
    schnorrAccount.deploy(),
    `Deploying account ${accountName}`,
  );
  logger.info(`    Getting Schnorr account wallet... (${accountName})`);
  const wallet = await schnorrAccount.getWallet();
  logger.info(
    `    🔐 Schnorr account created at: ${address.toString()} (${accountName})`,
  );
  return { schnorrAccount, wallet, address };
};

export const getNewAccount = async (pxe: PXE, accountName: string) => {
  const secretKey = Fr.random();
  const salt = Fr.random();
  return getNewSchnorrAccount({
    pxe,
    secretKey,
    salt,
    accountName,
  });
};

const getNewContractClassId = async (node: AztecNode, blockNumber?: number) => {
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
        ContractClassRegisteredEvent.isContractClassRegisteredEvent(log),
      )
      .map((log) => ContractClassRegisteredEvent.fromLog(log))
      .map((e) => e.toContractClassPublic()),
  );

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
}): Promise<T> => {
  logger.info(`DEPLOYING ${contractLoggingName}`);
  const contractTx = deployFn();
  const hash = (await contractTx.getTxHash()).toString();
  logger.info(`📫 ${contractLoggingName} txHash: ${hash} (Deploying contract)`);
  const deployedContract = await contractTx.deployed();
  const receipt = await contractTx.wait();
  const addressString = deployedContract.address.toString();
  const newClassId = await getNewContractClassId(node, receipt.blockNumber);
  const classIdString = newClassId
    ? `(🍏 also, a new contract class was added: ${newClassId})`
    : `(🍎 attached classId: ${deployedContract.instance.currentContractClassId.toString()})`;
  logger.info(
    `⛏  ${contractLoggingName} instance deployed at: ${addressString} block: ${receipt.blockNumber} ${classIdString}`,
  );
  if (broadcastWithWallet) {
    await broadcastFunctions({
      wallet: broadcastWithWallet,
      contract: deployedContract,
    });
  }
  return deployedContract;
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
        ).send(),
        `Broadcasting private function ${fn.name}`,
      );
    }
    if (fn.functionType === FunctionType.UNCONSTRAINED) {
      const selector = await FunctionSelector.fromNameAndParameters(
        fn.name,
        fn.parameters,
      );
      await logAndWaitForTx(
        (
          await broadcastUnconstrainedFunction(
            wallet,
            contract.artifact,
            selector,
          )
        ).send(),
        `Broadcasting unconstrained function ${fn.name}`,
      );
    }
  }
};

export const publicDeployAccounts = async (
  sender: Wallet,
  accountsToDeploy: Wallet[],
  pxe: PXE,
) => {
  const notPubliclyDeployedAccounts = await Promise.all(
    accountsToDeploy.map(async (a) => {
      const address = a.getAddress();
      const contractMetadata = await pxe.getContractMetadata(address);
      return contractMetadata;
    }),
  ).then((results) =>
    results.filter((result) => !result.isContractPubliclyDeployed),
  );
  if (notPubliclyDeployedAccounts.length === 0) {
    return;
  }
  const deployCalls: FunctionCall[] = [
    await (
      await registerContractClass(sender, SchnorrAccountContractArtifact)
    ).request(),
    ...((
      await Promise.all(
        notPubliclyDeployedAccounts.map(async (contractMetadata) => {
          if (!contractMetadata.contractInstance) {
            logger.warn(
              `🚨 Contract instance not found for contract isIntialized: ${contractMetadata.isContractInitialized}`,
            );
            return undefined;
          }
          return (
            await deployInstance(sender, contractMetadata.contractInstance)
          ).request();
        }),
      )
    ).filter((call) => call !== undefined) as FunctionCall[]),
  ];
  const batch = new BatchCall(sender, deployCalls);
  await batch.send().wait();
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
    verifiedDeploymentArguments: generateVerifyInstancePayload(
      verifyArgs,
    ),
    deployerMetadata,
  });
  await callExplorerApi({
    loggingString: `🧐 verifyContractInstanceDeployment ${contractLoggingName}`,
    urlStr: url,
    postData,
    method: "POST",
  });
};
