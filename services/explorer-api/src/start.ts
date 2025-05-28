import { NoirCompiledContract } from "@aztec/aztec.js";
import {
  generateVerifyArtifactPayload,
  verifyArtifactPayload,
} from "@chicmoz-pkg/contract-verification";
import { chicmozL2ContractClassRegisteredEventSchema } from "@chicmoz-pkg/types";
import DripperContractJson from "@defi-wonderland/aztec-standards/current/target/dripper-Dripper.json" with { type: "json" };
import {
  AZTEC_SCAN_MANUAL_SOURCE_CODE_URLS,
  AZTEC_SCAN_NOTES,
} from "./constants.js";
import { L2_NETWORK_ID } from "./environment.js";
import { subscribeHandlers } from "./events/received/index.js";
import { logger } from "./logger.js";
import { updateContractInstanceAztecScanNotes } from "./svcs/database/controllers/l2/aztec-scan-notes.js";
import { deleteAllTxs } from "./svcs/database/controllers/l2Tx/delete-all-txs.js";
import { getL2RegisteredContractClass } from "./svcs/database/controllers/l2contract/get-registered-contract-class.js";
import { updateContractClassManualSourceCodeUrl } from "./svcs/database/controllers/l2contract/update.js";

export const start = async () => {
  await deleteAllTxs(); // TODO: perhaps a more specific deleteAllTxs should be created, also some logs could be good.
  const aztecScanNotes = AZTEC_SCAN_NOTES[L2_NETWORK_ID];
  if (aztecScanNotes) {
    for (const [contractInstanceAddress, notes] of Object.entries(
      aztecScanNotes,
    )) {
      logger.info(`Updating with hardcoded aztec scan notes for contract: ${contractInstanceAddress}
ORIGIN: ${notes.origin}`);
      await updateContractInstanceAztecScanNotes({
        contractInstanceAddress,
        aztecScanNotes: notes,
      });
    }
  }
  const aztecScanManualSourceCodeUrls =
    AZTEC_SCAN_MANUAL_SOURCE_CODE_URLS[L2_NETWORK_ID];
  if (aztecScanManualSourceCodeUrls) {
    for (const [contractClassId, sourceCodeUrl] of Object.entries(
      aztecScanManualSourceCodeUrls,
    )) {
      logger.info(`Updating with hardcoded aztec scan manual source code urls for contract: ${contractClassId}
URL: ${sourceCodeUrl}`);
      await updateContractClassManualSourceCodeUrl({
        contractClassId,
        sourceCodeUrl,
      });
    }
  }

  const contractClass = await getL2RegisteredContractClass(
    "0x09279d61f44903d83c83989c44ef2e8b9df590338306ecef6437073090e7d051", // Dripper contract class id
    1,
  );

  const res = await verifyArtifactPayload(
    generateVerifyArtifactPayload(DripperContractJson as NoirCompiledContract),
    chicmozL2ContractClassRegisteredEventSchema.parse(contractClass),
  );
  logger.info(
    `

    Verification result for Dripper contract: ${JSON.stringify(res)}


    `,
  );
  await subscribeHandlers();
};
