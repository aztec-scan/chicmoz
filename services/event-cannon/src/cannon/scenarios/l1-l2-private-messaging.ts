import {
  AztecAddress,
  DeploySentTx,
  EthAddress,
  Fr,
  L1TokenPortalManager,
  SiblingPath,
  createLogger,
  retryUntil,
  waitForPXE,
} from "@aztec/aztec.js";
import { L1Deployer, createExtendedL1Client } from "@aztec/ethereum";
import {
  TestERC20Abi,
  TestERC20Bytecode,
  TokenPortalAbi,
  TokenPortalBytecode,
} from "@aztec/l1-artifacts";
import { TokenContract } from "@aztec/noir-contracts.js/Token";
import { TokenBridgeContract } from "@aztec/noir-contracts.js/TokenBridge";
import * as tokenBridgeContractArtifactJson from "@aztec/noir-contracts.js/artifacts/token_bridge_contract-TokenBridge" with { type: "json" };
import * as tokenContractArtifactJson from "@aztec/noir-contracts.js/artifacts/token_contract-Token" with { type: "json" };
import assert from "assert";
import { getContract } from "viem";
import { ETHEREUM_RPC_URL } from "../../environment.js";
import { logger } from "../../logger.js";
import { getAztecNodeClient, getPxe, getWallets } from "../pxe.js";
import {
  deployContract,
  logAndWaitForTx,
  publicDeployAccounts,
  registerContractClassArtifact,
  verifyContractInstanceDeployment,
} from "./utils/index.js";

const MNEMONIC = "test test test test test test test test test test test junk";
const TOKEN_NAME = "TokenName";
const TOKEN_SYMBOL = "TokenSymbol";

export const run = async () => {
  logger.info("===== L1/L2 PRIVATE MESSAGING =====");
  const aztecNode = getAztecNodeClient();
  const pxe = getPxe();
  await waitForPXE(pxe);
  const namedWallets = getWallets();

  const wallets = [namedWallets.alice, namedWallets.bob, namedWallets.charlie];
  const wallet = namedWallets.alice;
  logger.info("🐰 Deploying accounts...");
  await publicDeployAccounts(wallet, wallets, pxe);

  const l1Client = createExtendedL1Client([ETHEREUM_RPC_URL], MNEMONIC);

  const l1Deployer = new L1Deployer(l1Client, undefined);

  const underlyingERC20Address = await l1Deployer.deploy(
    {
      contractAbi: TestERC20Abi,
      contractBytecode: TestERC20Bytecode,
    },
    ["Test Token", "TEST", l1Client.account.address],
  );
  logger.info("🐰 Deploying contracts...");

  logger.info(
    `🐰 Underlying ERC20 deployed at ${underlyingERC20Address.toString()}`,
  );

  logger.info("🐰 Deploying TokenPortal contract...");
  const tokenPortalAddress = await l1Deployer.deploy(
    {
      contractAbi: TokenPortalAbi,
      contractBytecode: TokenPortalBytecode,
    },
    [],
  );

  logger.info(`🐰 TokenPortal deployed at ${tokenPortalAddress.toString()}`);
  const tokenPortal = getContract({
    address: tokenPortalAddress.toString(),
    abi: TokenPortalAbi,
    client: l1Client,
  });

  const owner = wallet.getAddress();

  const tokenContractLoggingName = "Token Contract";
  const token = await deployContract({
    contractLoggingName: tokenContractLoggingName,
    deployFn: (): DeploySentTx<TokenContract> => {
      return TokenContract.deploy(
        wallet,
        owner,
        TOKEN_NAME,
        TOKEN_SYMBOL,
        18,
      ).send();
    },
    node: getAztecNodeClient(),
  });

  registerContractClassArtifact(
    tokenContractLoggingName,
    tokenContractArtifactJson,
    token.instance.currentContractClassId.toString(),
    token.instance.version,
  ).catch((err) => {
    logger.error(err);
  });
  verifyContractInstanceDeployment({
    contractLoggingName: tokenContractLoggingName,
    contractInstanceAddress: token.address.toString(),
    verifyArgs: {
      artifactObj: tokenContractArtifactJson,
      publicKeysString: token.instance.publicKeys.toString(),
      deployer: token.instance.deployer.toString(),
      salt: token.instance.salt.toString(),
      constructorArgs: [owner.toString(), TOKEN_NAME, TOKEN_SYMBOL, "18"],
    },
    deployerMetadata: {
      contractIdentifier: tokenContractLoggingName,
      details: "Standard Token contract for L1-L2 messaging",
      creatorName: "Event Cannon",
      creatorContact:
        "email: test@test.com, discord: test#1234, telegram: @test",
      appUrl: "https://aztec.network",
      repoUrl: "https://github.com/AztecProtocol/aztec-packages",
      reviewedAt: new Date(),
      aztecScanNotes: {
        name: "Token contract",
        origin: "This contract was deployed by the event-cannon",
        comment: "IT'S USING THE OVERRIDE METHOD ONLY AVAILABLE IN DEV",
        relatedL1ContractAddresses: [
          {
            address: underlyingERC20Address.toString(),
            note: "L1 ERC20 contract",
          },
        ],
      },
    },
  }).catch((err) => {
    logger.error(`Failed to verify token contract instance deployment: ${err}`);
  });

  const tokenBridgeContractLoggingName = "Token Bridge Contract";
  const bridge = await deployContract({
    contractLoggingName: tokenBridgeContractLoggingName,
    deployFn: (): DeploySentTx<TokenBridgeContract> => {
      return TokenBridgeContract.deploy(
        wallet,
        token.address,
        tokenPortalAddress,
      ).send();
    },
    node: getAztecNodeClient(),
  });

  registerContractClassArtifact(
    tokenBridgeContractLoggingName,
    tokenBridgeContractArtifactJson,
    bridge.instance.currentContractClassId.toString(),
    bridge.instance.version,
  ).catch((err) => {
    logger.error(err);
  });

  verifyContractInstanceDeployment({
    contractLoggingName: tokenBridgeContractLoggingName,
    contractInstanceAddress: bridge.address.toString(),
    verifyArgs: {
      artifactObj: tokenBridgeContractArtifactJson,
      publicKeysString: bridge.instance.publicKeys.toString(),
      deployer: bridge.instance.deployer.toString(),
      salt: bridge.instance.salt.toString(),
      constructorArgs: [
        token.address.toString(),
        tokenPortalAddress.toString(),
      ],
    },
    deployerMetadata: {
      contractIdentifier: tokenBridgeContractLoggingName,
      details: "Token Bridge contract for L1-L2 token transfers",
      creatorName: "Event Cannon",
      creatorContact:
        "email: test@test.com, discord: test#1234, telegram: @test",
      appUrl: "https://aztec.network",
      repoUrl: "https://github.com/AztecProtocol/aztec-packages",
      reviewedAt: new Date(),
      aztecScanNotes: {
        name: "Token Bridge contract",
        origin: "This contract was deployed by the event-cannon",
        comment: "IT'S USING THE OVERRIDE METHOD ONLY AVAILABLE IN DEV",
        relatedL1ContractAddresses: [
          {
            address: underlyingERC20Address.toString(),
            note: "L1 ERC20 contract",
          },
          {
            address: tokenPortalAddress.toString(),
            note: "Token Portal contract",
          },
        ],
      },
    },
  }).catch((err) => {
    logger.error(
      `Failed to verify bridge contract instance deployment: ${err}`,
    );
  });

  if ((await token.methods.get_admin().simulate()) !== owner.toBigInt()) {
    throw new Error(`Token admin is not ${owner.toString()}`);
  }

  if (
    !(
      (await bridge.methods.get_config().simulate()) as { token: AztecAddress }
    ).token.equals(token.address)
  ) {
    throw new Error(`Bridge token is not ${token.address.toString()}`);
  }

  await logAndWaitForTx(
    token.methods.set_minter(bridge.address, true).send(),
    "setting minter",
  );
  if ((await token.methods.is_minter(bridge.address).simulate()) === 1n) {
    throw new Error(`Bridge is not a minter`);
  }

  const { l1ContractAddresses } = await pxe.getNodeInfo();

  await tokenPortal.write.initialize(
    [
      l1ContractAddresses.registryAddress.toString(),
      underlyingERC20Address.toString(),
      bridge.address.toString(),
    ],
    {},
  );

  const l1TokenPortalManager = new L1TokenPortalManager(
    tokenPortalAddress,
    underlyingERC20Address,
    undefined,
    l1ContractAddresses.outboxAddress,
    l1Client,
    createLogger("L1TokenPortalManager-private"),
  );
  const l1TokenManager = l1TokenPortalManager.getTokenManager();
  const ownerAddress = wallet.getAddress();
  logger.info("🐰 Initialization complete");

  const l1TokenBalance = 1000000n;
  const bridgeAmount = 100n;

  const ethAccount = EthAddress.fromString((await l1Client.getAddresses())[0]);

  const l2Token = token;
  const l2Bridge = bridge;

  logger.info("🐰 1. minting tokens on L1");
  await l1TokenManager.mint(ethAccount.toString(), "Test address");

  logger.info("🐰 2. depositing tokens to the TokenPortal privately");
  const shouldMint = false;
  const claim = await l1TokenPortalManager.bridgeTokensPrivate(
    ownerAddress,
    bridgeAmount,
    shouldMint,
  );
  assert(
    (await l1TokenManager.getL1TokenBalance(ethAccount.toString())) ===
      l1TokenBalance - bridgeAmount,
  );
  const msgHash = Fr.fromString(claim.messageHash);

  logger.info("waiting for the message to be available for consumption...");
  await retryUntil(
    async () => await aztecNode.isL1ToL2MessageSynced(msgHash),
    "message sync",
    10,
  );

  await logAndWaitForTx(
    l2Token.methods.mint_to_public(ownerAddress, 0n).send(),
    "minting public tokens A",
  );
  await logAndWaitForTx(
    l2Token.methods.mint_to_public(ownerAddress, 0n).send(),
    "minting public tokens B",
  );

  logger.info("checking message leaf index matches...");
  const maybeIndexAndPath = await aztecNode.getL1ToL2MessageMembershipWitness(
    "latest",
    msgHash,
  );
  assert(maybeIndexAndPath !== undefined);
  assert(maybeIndexAndPath[0] === claim.messageLeafIndex);

  logger.info(
    "🐰 3. consuming L1 -> L2 message and minting private tokens on L2",
  );
  const { claimAmount, claimSecret, messageLeafIndex } = claim;
  await logAndWaitForTx(
    l2Bridge.methods
      .claim_private(ownerAddress, claimAmount, claimSecret, messageLeafIndex)
      .send(),
    "claiming private tokens",
  );

  const l2TokenBalance = (await l2Token.methods
    .balance_of_private(ownerAddress)
    .simulate()) as bigint;
  assert(l2TokenBalance === bridgeAmount);

  logger.info("🐰 4. withdrawing funds from L2");
  const withdrawAmount = 9n;
  const nonce = Fr.random();

  const user1Wallet = wallet;
  await user1Wallet.createAuthWit({
    caller: l2Bridge.address,
    action: l2Token.methods.burn_private(ownerAddress, withdrawAmount, nonce),
  });

  logger.info("🐰 5. withdrawing owner funds from L2 to L1");
  const l2ToL1Message = await l1TokenPortalManager.getL2ToL1MessageLeaf(
    withdrawAmount,
    ethAccount,
    l2Bridge.address,
    EthAddress.ZERO,
  );
  const l2TxReceipt = await logAndWaitForTx(
    l2Bridge.methods
      .exit_to_l1_private(
        l2Token.address,
        ethAccount,
        withdrawAmount,
        EthAddress.ZERO,
        nonce,
      )
      .send(),
    "exiting to L1",
  );

  assert(
    (await l2Token.methods.balance_of_private(ownerAddress).simulate()) ===
      bridgeAmount - withdrawAmount,
  );
  assert(
    (await l1TokenManager.getL1TokenBalance(ethAccount.toString())) ===
      l1TokenBalance - bridgeAmount,
  );

  const l2ToL1MessageWitness =
    await aztecNode.getL1ToL2MessageMembershipWitness(
      l2TxReceipt.blockNumber!,
      l2ToL1Message,
    );
  assert(l2ToL1MessageWitness !== undefined);
  const [l2ToL1MessageIndex, siblingPath] = l2ToL1MessageWitness;

  const wait = 10000;
  logger.info(
    `waiting ${
      wait / 1000
    } seconds for the message to be available for consumption...`,
  );
  await new Promise((resolve) => setTimeout(resolve, wait));

  await l1TokenPortalManager.withdrawFunds(
    withdrawAmount,
    ethAccount,
    BigInt(l2TxReceipt.blockNumber!),
    l2ToL1MessageIndex,
    siblingPath as SiblingPath<number>,
  );

  assert(
    (await l1TokenManager.getL1TokenBalance(ethAccount.toString())) ===
      l1TokenBalance - bridgeAmount + withdrawAmount,
  );
};
