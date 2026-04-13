import { TokenContract } from "@aztec/noir-contracts.js/Token";
import * as tokenContractArtifactJson from "@aztec/noir-contracts.js/artifacts/token_contract-Token" with { type: "json" };
import { logger } from "../../logger.js";
import { getAccounts, getAztecNodeClient, getWallet } from "../pxe.js";
import {
  deployContract,
  logAndWaitForTx,
  registerContractClassArtifact,
  simulateThenSend,
  verifyContractInstanceDeployment,
} from "./utils/index.js";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { Contract, DeployMethod } from "@aztec/aztec.js/contracts";

export async function run() {
  logger.info("===== TOKEN CONTRACT =====");
  const namedAccounts = getAccounts();
  const wallet = getWallet();

  const deployerWallet = await namedAccounts.alice.getAccount();
  const tokenAdmin = namedAccounts.alice.address;

  const contractLoggingName = "Token Contract";
  const constructorArgs: [AztecAddress, string, string, number] = [
    tokenAdmin,
    "lol",
    "LOL",
    9,
  ];
  const { contract: tokenContract, instance: tokenInstance } =
    await deployContract({
      contractLoggingName,
      deployFn: (): DeployMethod<TokenContract> => {
        return TokenContract.deploy(
          wallet,
          constructorArgs[0],
          constructorArgs[1],
          constructorArgs[2],
          constructorArgs[3],
        );
      },
      from: deployerWallet.getAddress(),
      node: getAztecNodeClient(),
    });

  // Register the artifact first, then verify the instance.
  // The verify endpoint requires the artifact to exist, so we must await this.
  await registerContractClassArtifact(
    contractLoggingName,
    tokenContractArtifactJson,
    tokenInstance.currentContractClassId.toString(),
    tokenInstance.version,
  );

  // Fire-and-forget verification; do not block scenario execution.
  void verifyContractInstanceDeployment({
    contractLoggingName,
    contractInstanceAddress: tokenContract.address.toString(),
    verifyArgs: {
      publicKeysString: tokenInstance.publicKeys.toString(),
      deployer: tokenInstance.deployer.toString(),
      salt: tokenInstance.salt.toString(),
      constructorArgs: constructorArgs.map((arg) => arg.toString()),
    },
    deployerMetadata: {
      contractIdentifier: contractLoggingName,
      details: "Token contract",
      creatorName: "Event Cannon",
      creatorContact:
        "email: test@test.com, discord: test#1234, telegram: @test",
      appUrl: "https://aztec.network",
      repoUrl: "https://github.com/AztecProtocol/aztec-packages",
      reviewedAt: new Date(),
    },
  });

  // Run sequentially: PXE does not support concurrent job processing.
  await logAndWaitForTx(
    tokenContract.methods
      .mint_to_public(namedAccounts.alice.address, 1000)
      .send({ from: deployerWallet.getAddress() }),
    "Mint to Alice",
  );
  await logAndWaitForTx(
    tokenContract.methods
      .mint_to_public(namedAccounts.bob.address, 1000)
      .send({ from: deployerWallet.getAddress() }),
    "Mint to Bob",
  );
  await logAndWaitForTx(
    tokenContract.methods
      .mint_to_public(namedAccounts.charlie.address, 1000)
      .send({ from: deployerWallet.getAddress() }),
    "Mint to Charlie",
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [balanceAlice, balanceBob, balanceCharlie] = await Promise.all([
    tokenContract.methods
      .balance_of_public(namedAccounts.alice.address)
      .simulate({ from: deployerWallet.getAddress() }),
    tokenContract.methods
      .balance_of_public(namedAccounts.bob.address)
      .simulate({ from: deployerWallet.getAddress() }),
    tokenContract.methods
      .balance_of_public(namedAccounts.charlie.address)
      .simulate({ from: deployerWallet.getAddress() }),
  ]);
  const [balanceAliceResult, balanceBobResult, balanceCharlieResult] = [
    balanceAlice.result as bigint,
    balanceBob.result as bigint,
    balanceCharlie.result as bigint,
  ];
  logger.info(`Alice balance: ${balanceAliceResult}`);
  logger.info(`Bob balance: ${balanceBobResult}`);
  logger.info(`Charlie balance: ${balanceCharlieResult}`);

  const aliceContract = Contract.at(
    tokenContract.address,
    TokenContract.artifact,
    wallet,
  ) as TokenContract;

  const bobsTokenContract = Contract.at(
    tokenContract.address,
    TokenContract.artifact,
    wallet,
  ) as TokenContract;

  const charliesTokenContract = Contract.at(
    tokenContract.address,
    TokenContract.artifact,
    wallet,
  ) as TokenContract;

  // IMPORTANT: `transfer_in_public(from, to, amount, nonce)` must be sent by `from`.
  // The previous code was sending from Alice while specifying Bob as the sender,
  // which causes `app_logic_reverted`.
  let bobNonce = 0;
  await simulateThenSend({
    method: bobsTokenContract.methods.transfer_in_public(
      namedAccounts.bob.address,
      namedAccounts.alice.address,
      100,
      bobNonce,
    ),
    from: namedAccounts.bob.address,
    additionalInfo: "Public transfer from Bob to Alice",
  });
  bobNonce++;

  const [balanceAliceAfter, balanceBobAfter] = await Promise.all([
    tokenContract.methods
      .balance_of_public(namedAccounts.alice.address)
      .simulate({ from: deployerWallet.getAddress() })
      .then((balance) => balance.result as bigint),
    tokenContract.methods
      .balance_of_public(namedAccounts.bob.address)
      .simulate({ from: deployerWallet.getAddress() })
      .then((balance) => balance.result as bigint),
  ]);

  logger.info(`Alice balance after: ${balanceAliceAfter}`);
  logger.info(`Bob balance after: ${balanceBobAfter}`);

  await logAndWaitForTx(
    charliesTokenContract.methods
      .transfer_to_private(namedAccounts.alice.address, 100)
      .send({ from: deployerWallet.getAddress() }),
    "Public to private transfer from Charlie to Alice",
  );

  // `transfer_in_private(from, to, amount, nonce)` must also be sent by `from`.
  let aliceNonce = 0;
  await simulateThenSend({
    method: aliceContract.methods.transfer_in_private(
      namedAccounts.alice.address,
      namedAccounts.bob.address,
      100,
      aliceNonce,
    ),
    from: namedAccounts.alice.address,
    additionalInfo: "Private transfer from Alice to Bob",
  });
  aliceNonce++;

  const [
    balancePrivateAlice,
    balancePublicAlice,
    balancePrivateBob,
    balancePublicBob,
    balancePrivateCharlie,
    balancePublicCharlie,
  ] = await Promise.all([
    tokenContract.methods
      .balance_of_private(namedAccounts.alice.address)
      .simulate({ from: deployerWallet.getAddress() })
      .then((balance) => balance.result as bigint),
    tokenContract.methods
      .balance_of_public(namedAccounts.alice.address)
      .simulate({ from: deployerWallet.getAddress() })
      .then((balance) => balance.result as bigint),
    tokenContract.methods
      .balance_of_private(namedAccounts.bob.address)
      .simulate({ from: deployerWallet.getAddress() })
      .then((balance) => balance.result as bigint),
    tokenContract.methods
      .balance_of_public(namedAccounts.bob.address)
      .simulate({ from: deployerWallet.getAddress() })
      .then((balance) => balance.result as bigint),
    tokenContract.methods
      .balance_of_private(namedAccounts.charlie.address)
      .simulate({ from: deployerWallet.getAddress() })
      .then((balance) => balance.result as bigint),
    tokenContract.methods
      .balance_of_public(namedAccounts.charlie.address)
      .simulate({ from: deployerWallet.getAddress() })
      .then((balance) => balance.result as bigint),
  ]);
  logger.info(`Alice private balance: ${balancePrivateAlice}`);
  logger.info(`Alice public balance: ${balancePublicAlice}`);
  logger.info(`Bob private balance: ${balancePrivateBob}`);
  logger.info(`Bob public balance: ${balancePublicBob}`);
  logger.info(`Charlie private balance: ${balancePrivateCharlie}`);
  logger.info(`Charlie public balance: ${balancePublicCharlie}`);
}
