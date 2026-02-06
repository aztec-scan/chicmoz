import { L1Deployer } from "@aztec/ethereum/deploy-l1-contract";
import { createExtendedL1Client } from "@aztec/ethereum/client";
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
import { getAztecNodeClient, getPxe, getAccounts, getWallet } from "../pxe.js";
import {
  deployContract,
  logAndWaitForTx,
  publicDeployAccounts,
  registerContractClassArtifact,
  simulateThenSend,
} from "./utils/index.js";
import { DeploySentTx } from "@aztec/aztec.js/contracts";
import { AztecAddress, EthAddress } from "@aztec/aztec.js/addresses";
import { L1TokenPortalManager } from "@aztec/aztec.js/ethereum";
import { createLogger } from "@aztec/aztec.js/log";
import { Fr } from "@aztec/aztec.js/fields";
import { SiblingPath } from "@aztec/aztec.js/trees";

const MNEMONIC = "test test test test test test test test test test test junk";
const TOKEN_NAME = "TokenName";
const TOKEN_SYMBOL = "TokenSymbol";

export const run = async () => {
  logger.info("===== L1/L2 PUBLIC MESSAGING =====");
  const aztecNode = getAztecNodeClient();
  const pxe = getPxe();
  const wallet = getWallet();
  const namedAccounts = getAccounts();

  const accounts = await Promise.all([
    // NOTE: for similarity with tutorial
    namedAccounts.alice.getAccount(),
    namedAccounts.bob.getAccount(),
    namedAccounts.charlie.getAccount(),
  ]);
  const account = await namedAccounts.alice.getAccount(); // NOTE: for similarity with tutorial
  logger.info("🐰 Deploying accounts...");
  await publicDeployAccounts(account, accounts, wallet, pxe);

  const l1Client = createExtendedL1Client([ETHEREUM_RPC_URL], MNEMONIC);

  const l1Deployer = new L1Deployer(l1Client, undefined);

  const underlyingERC20Address = await l1Deployer.deploy(
    {
      name: "TestERC20",
      contractAbi: TestERC20Abi,
      contractBytecode: TestERC20Bytecode,
    },
    ["Test Token", "TEST", l1Client.account.address],
  );
  logger.info("🐰 Deploying contracts...");

  logger.info(
    `🐰 Underlying ERC20 deployed at ${underlyingERC20Address.address.toString()}`,
  );

  logger.info("🐰 Deploying TokenPortal contract...");
  const tokenPortalAddress = await l1Deployer.deploy(
    {
      name: "tokenPortal",
      contractAbi: TokenPortalAbi,
      contractBytecode: TokenPortalBytecode,
    },
    [],
  );
  logger.info(
    `🐰 TokenPortal deployed at ${tokenPortalAddress.address.toString()}`,
  );
  const tokenPortal = getContract({
    address: tokenPortalAddress.address.toString(),
    abi: TokenPortalAbi,
    client: l1Client,
  });

  const owner = account.getAddress();

  const tokenContractLoggingName = "Token Contract";
  const { contract: token, instance: tokenInstance } = await deployContract({
    contractLoggingName: tokenContractLoggingName,
    deployFn: (): DeploySentTx<TokenContract> => {
      return TokenContract.deploy(
        wallet,
        owner,
        TOKEN_NAME,
        TOKEN_SYMBOL,
        18,
      ).send({ from: account.getAddress() });
    },
    node: getAztecNodeClient(),
  });

  registerContractClassArtifact(
    tokenContractLoggingName,
    tokenContractArtifactJson,
    tokenInstance.currentContractClassId.toString(),
    tokenInstance.version,
  ).catch((err) => {
    logger.error(err);
  });

  const tokenBridgeContractLoggingName = "Token Bridge Contract";
  const { contract: bridge, instance: bridgeInstance } = await deployContract({
    contractLoggingName: tokenBridgeContractLoggingName,
    deployFn: (): DeploySentTx<TokenBridgeContract> => {
      return TokenBridgeContract.deploy(
        wallet,
        token.address,
        tokenPortalAddress,
      ).send({ from: account.getAddress() });
    },
    node: getAztecNodeClient(),
  });

  registerContractClassArtifact(
    tokenBridgeContractLoggingName,
    tokenBridgeContractArtifactJson,
    bridgeInstance.currentContractClassId.toString(),
    bridgeInstance.version,
  ).catch((err) => {
    logger.error(err);
  });

  if (
    (await token.methods
      .get_admin()
      .simulate({ from: account.getAddress() })) !== owner.toBigInt()
  ) {
    throw new Error(`Token admin is not ${owner.toString()}`);
  }

  if (
    !(
      (await bridge.methods
        .get_config()
        .simulate({ from: account.getAddress() })) as { token: AztecAddress }
    ).token.equals(token.address)
  ) {
    throw new Error(`Bridge token is not ${token.address.toString()}`);
  }

  await logAndWaitForTx(
    token.methods
      .set_minter(bridge.address, true)
      .send({ from: account.getAddress() }),
    "setting minter",
  );
  if (
    (await token.methods
      .is_minter(bridge.address)
      .simulate({ from: account.getAddress() })) === 1n
  ) {
    throw new Error(`Bridge is not a minter`);
  }

  const { l1ContractAddresses } = await aztecNode.getNodeInfo();

  await tokenPortal.write.initialize(
    [
      l1ContractAddresses.registryAddress.toString(),
      underlyingERC20Address.address.toString(),
      bridge.address.toString(),
    ],
    {},
  );

  const l1TokenPortalManager = new L1TokenPortalManager(
    tokenPortalAddress.address,
    underlyingERC20Address.address,
    undefined,
    l1ContractAddresses.outboxAddress,
    l1Client,
    createLogger("L1TokenPortalManager-public"),
  );
  const l1TokenManager = l1TokenPortalManager.getTokenManager();
  const ownerAddress = account.getAddress();
  logger.info("🐰 Initialization complete");

  const l1TokenBalance = 1000000n;
  const bridgeAmount = 100n;

  const ethAccount = EthAddress.fromString((await l1Client.getAddresses())[0]);

  const l2Token = token;
  const l2Bridge = bridge;
  logger.info("🐰 1. minting tokens on L1");

  // In this scenario we don't deploy a FeeAssetHandler (faucet), so
  // `l1TokenManager.mint()` would throw "Minting handler was not provided".
  await l1Client.waitForTransactionReceipt({
    hash: await l1Client.writeContract({
      address: underlyingERC20Address.address.toString(),
      abi: TestERC20Abi,
      functionName: "mint",
      args: [ethAccount.toString(), l1TokenBalance],
    }),
  });

  logger.info("🐰 2. depositing tokens to the TokenPortal");
  const shouldMint = false;
  const claim = await l1TokenPortalManager.bridgeTokensPublic(
    ownerAddress,
    bridgeAmount,
    shouldMint,
  );
  assert(
    (await l1TokenManager.getL1TokenBalance(ethAccount.toString())) ===
    l1TokenBalance - bridgeAmount,
  );
  const msgHash = Fr.fromString(claim.messageHash);

  await logAndWaitForTx(
    l2Token.methods
      .mint_to_public(ownerAddress, 0n)
      .send({ from: account.getAddress() }),
    "minting public tokens A",
  );
  await logAndWaitForTx(
    l2Token.methods
      .mint_to_public(ownerAddress, 0n)
      .send({ from: account.getAddress() }), // NOTE: copied from tutorial, perhaps typo?
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
    "🐰 3. consuming L1 -> L2 message and minting public tokens on L2",
  );
  const { claimAmount, claimSecret, messageLeafIndex } = claim;
  await logAndWaitForTx(
    l2Bridge.methods
      .claim_public(ownerAddress, claimAmount, claimSecret, messageLeafIndex)
      .send({ from: account.getAddress() }),
    "claiming public tokens",
  );

  const l2TokenBalance = (await l2Token.methods
    .balance_of_public(ownerAddress)
    .simulate({ from: account.getAddress() })) as bigint;

  assert(l2TokenBalance === bridgeAmount);

  logger.info("🐰 4. withdrawing funds from L2");
  const withdrawAmount = 9n;
  const nonce = Fr.random();

  const user1Wallet = wallet;
  await logAndWaitForTx(
    (
      await user1Wallet.setPublicAuthWit(
        account.getAddress(),
        {
          caller: account.getAddress(),
          action: l2Token.methods.burn_public(
            ownerAddress,
            withdrawAmount,
            nonce,
          ),
        },
        true,
      )
    ).send(),
    "setting public auth wit",
  );

  logger.info("🐰 5. withdrawing owner funds from L2 to L1");
  const l2ToL1Message = await l1TokenPortalManager.getL2ToL1MessageLeaf(
    9n,
    ethAccount,
    l2Bridge.address,
    EthAddress.ZERO,
  );
  const l2TxReceipt = await simulateThenSend({
    method: l2Bridge.methods.exit_to_l1_public(
      ethAccount,
      withdrawAmount,
      EthAddress.ZERO,
      nonce,
    ),
    from: account.getAddress(),
    additionalInfo: "exiting to L1",
  });
  assert(
    (await l2Token.methods
      .balance_of_public(ownerAddress)
      .simulate({ from: account.getAddress() })) ===
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
    `waiting ${wait / 1000
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
