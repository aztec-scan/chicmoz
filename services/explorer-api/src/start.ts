import {
  AZTEC_SCAN_MANUAL_SOURCE_CODE_URLS,
  AZTEC_SCAN_NOTES,
} from "./constants.js";
import { L2_BLOCK_RECONCILIATION_ENABLED, L2_NETWORK_ID } from "./environment.js";
import { subscribeHandlers } from "./events/received/index.js";
import { l2BlockRangeRequest } from "./events/emitted/index.js";
import { logger } from "./logger.js";
import { removeDroppedThatHaveTxEffects } from "./svcs/database/controllers/dropped-tx/remove.js";
import { updateContractInstanceAztecScanNotes } from "./svcs/database/controllers/l2/aztec-scan-notes.js";
import { initializeRollupVersionCache } from "./svcs/database/controllers/l2/chain-info/rollup-version-cache.js";
import { deleteAllTxs } from "./svcs/database/controllers/l2Tx/delete-all-txs.js";
import { updateContractClassManualSourceCodeUrl } from "./svcs/database/controllers/l2contract/update.js";
import { initializeProtocolContracts } from "./utils/protocol-contracts.js";
import { buildStartupMissingBlockRangeRequest } from "./svcs/database/controllers/l2block/missing-ranges.js";
import { startL2BlockReconciliation } from "./svcs/reconciliation/l2-block-reconciliation.js";

export const start = async () => {
  await deleteAllTxs(); // TODO: perhaps a more specific deleteAllTxs should be created, also some logs could be good.
  await removeDroppedThatHaveTxEffects();
  await initializeRollupVersionCache();
  await initializeProtocolContracts();
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
  await l2BlockRangeRequest(await buildStartupMissingBlockRangeRequest());
  if (L2_BLOCK_RECONCILIATION_ENABLED) {
    startL2BlockReconciliation();
  } else {
    logger.info("Cadenced L2 block reconciliation is disabled");
  }
};
