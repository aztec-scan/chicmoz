import { l2NetworkIdSchema, type L2NetworkId } from "@chicmoz-pkg/types";
import { z } from "zod";

export const BLOCK_POLL_INTERVAL_MS = z.coerce
  .number()
  .default(3000)
  .parse(process.env.BLOCK_POLL_INTERVAL_MS);
export const TX_POLL_INTERVAL_MS = z.coerce
  .number()
  .default(500)
  .parse(process.env.TX_POLL_INTERVAL_MS);
export const CHAIN_INFO_POLL_INTERVAL_MS = z.coerce
  .number()
  .default(30000)
  .parse(process.env.CHAIN_INFO_POLL_INTERVAL_MS);
export const MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS = z.coerce
  .number()
  .default(50)
  .parse(process.env.MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS);
export const AZTEC_LISTEN_FOR_PROPOSED_BLOCKS =
  process.env.AZTEC_LISTEN_FOR_PROPOSED_BLOCKS === "true";
export const AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT =
  z.coerce
    .number()
    .gt(0)
    .parse(
      process.env.AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT
    );
export const AZTEC_LISTEN_FOR_PROVEN_BLOCKS =
  process.env.AZTEC_LISTEN_FOR_PROVEN_BLOCKS === "true";
export const AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT = z.coerce
  .number()
  .gt(0)
  .parse(process.env.AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT);
export const AZTEC_LISTEN_FOR_PENDING_TXS =
  process.env.AZTEC_LISTEN_FOR_PENDING_TXS === "true";
export const AZTEC_LISTEN_FOR_CHAIN_INFO =
  process.env.AZTEC_LISTEN_FOR_CHAIN_INFO === "true";
export const AZTEC_DISABLED = process.env.AZTEC_DISABLED === "true";

export const AZTEC_RPC_URL =
  process.env.AZTEC_RPC_URL ?? "http://localhost:8080";

export const IGNORE_PROCESSED_HEIGHT =
  process.env.IGNORE_PROCESSED_HEIGHT === "true";

export const L2_NETWORK_ID: L2NetworkId = l2NetworkIdSchema.parse(
  process.env.L2_NETWORK_ID
);

export const getConfigStr = () => `POLLER
AZTEC_DISABLED:                                            ${
  AZTEC_DISABLED ? "✅" : "❌"
}
L2_NETWORK_ID:                                             ${L2_NETWORK_ID}
AZTEC_RPC_URL:                                             ${AZTEC_RPC_URL}
=======================
AZTEC_LISTEN_FOR_PROPOSED_BLOCKS:                          ${
  AZTEC_LISTEN_FOR_PROPOSED_BLOCKS ? "✅" : "❌"
}
AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT: ${
  AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT
    ? AZTEC_LISTEN_FOR_PROPOSED_BLOCKS_FORCED_START_FROM_HEIGHT + "⚠️"
    : "❌"
}

AZTEC_LISTEN_FOR_PROVEN_BLOCKS:                            ${
  AZTEC_LISTEN_FOR_PROVEN_BLOCKS ? "✅" : "❌"
}
AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT:   ${
  AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT
    ? AZTEC_LISTEN_FOR_PROVEN_BLOCKS_FORCED_START_FROM_HEIGHT + "⚠️"
    : "❌"
}


AZTEC_LISTEN_FOR_PENDING_TXS:                              ${
  AZTEC_LISTEN_FOR_PENDING_TXS ? "✅" : "❌"
}
TX_POLL_INTERVAL_MS:                                       ${
  TX_POLL_INTERVAL_MS / 1000
}s

AZTEC_LISTEN_FOR_CHAIN_INFO:                               ${
  AZTEC_LISTEN_FOR_CHAIN_INFO ? "✅" : "❌"
}
CHAIN_INFO_POLL_INTERVAL_MS:                               ${
  CHAIN_INFO_POLL_INTERVAL_MS / 1000
}s

IGNORE_PROCESSED_HEIGHT:                                   ${
  IGNORE_PROCESSED_HEIGHT ? "✅" : "❌"
}

MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS:                        ${MAX_BATCH_SIZE_FETCH_MISSED_BLOCKS}
})}`;
