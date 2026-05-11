import { Fr } from "@aztec/aztec.js/fields";
import { DeployMethod } from "@aztec/aztec.js/contracts";
import { NoirCompiledContract } from "@aztec/aztec.js/abi";
import { ExplorerShowcaseContract } from "../../artifacts/ExplorerShowcase.js";
import artifactJson from "../../contract-projects/ExplorerShowcase/target/explorer_showcase-ExplorerShowcase.json" with { type: "json" };
import { logger } from "../../logger.js";
import { getAztecNodeClient, getPxe, getAccounts, getWallet } from "../pxe.js";
import {
  deployContract,
  logAndWaitForTx,
  registerContractClassArtifact,
} from "./utils/index.js";

export async function run() {
  logger.info("===== EXPLORER SHOWCASE CONTRACT =====");
  getPxe();
  const namedWallets = getAccounts();
  const wallet = getWallet();

  const deployerWallet = namedWallets.alice;
  const contractName = "ExplorerShowcase Contract";

  const { contract, instance: contractInstance } = await deployContract({
    contractLoggingName: contractName,
    deployFn: (): DeployMethod<ExplorerShowcaseContract> =>
      ExplorerShowcaseContract.deploy(wallet, deployerWallet.address),
    from: deployerWallet.address,
    node: getAztecNodeClient(),
  });

  registerContractClassArtifact(
    contractName,
    artifactJson as unknown as NoirCompiledContract,
    contractInstance.currentContractClassId.toString(),
    contractInstance.version,
  ).catch((err) => {
    logger.error(err);
  });

  // Public: increment counter for alice
  await logAndWaitForTx(
    contract.methods
      .increment_public(deployerWallet.address)
      .send({ from: deployerWallet.address }),
    "Increment public counter (alice)",
  );

  // Public: emit a tagged message log
  await logAndWaitForTx(
    contract.methods
      .emit_message(Fr.fromString("0x1234"), Fr.fromString("0xdeadbeef"))
      .send({ from: deployerWallet.address }),
    "Emit public message log",
  );

  // Private: add balance note for alice
  await logAndWaitForTx(
    contract.methods
      .add_private_balance(100n)
      .send({ from: deployerWallet.address }),
    "Add private balance (alice, 100)",
  );

  // Private: transfer note from alice to bob
  await logAndWaitForTx(
    contract.methods
      .transfer_private(namedWallets.bob.address, 40n)
      .send({ from: deployerWallet.address }),
    "Transfer private balance (alice -> bob, 40)",
  );

  // Private->Public: unshield (consume private note, credit public counter)
  await logAndWaitForTx(
    contract.methods.unshield(10n).send({ from: deployerWallet.address }),
    "Unshield (private note -> public counter, 10)",
  );

  // Public->Private: shield (debit public counter, create private note)
  await logAndWaitForTx(
    contract.methods.shield(5n).send({ from: deployerWallet.address }),
    "Shield (public counter -> private note, 5)",
  );

  logger.info("===== EXPLORER SHOWCASE COMPLETE =====");
}
