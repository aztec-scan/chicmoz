import {
  AZTEC_SCAN_MANUAL_SOURCE_CODE_URLS,
  AZTEC_SCAN_NOTES,
} from "./constants.js";
import { L2_NETWORK_ID } from "./environment.js";
import { subscribeHandlers } from "./events/received/index.js";
import { logger } from "./logger.js";
import { updateContractInstanceAztecScanNotes } from "./svcs/database/controllers/l2/aztec-scan-notes.js";
import { deleteAllTxs } from "./svcs/database/controllers/l2Tx/delete-all-txs.js";
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
  await subscribeHandlers();
};
