import { ChicmozL2BlockFinalizationUpdateEvent } from "@chicmoz-pkg/message-registry";
import { publishMessage } from "../../svcs/message-bus/index.js";

export const l2BlockFinalizationUpdate = async (
  update: ChicmozL2BlockFinalizationUpdateEvent | null
) => {
  if (update)
    {await publishMessage("L2_BLOCK_FINALIZATION_UPDATE_EVENT", update);}
};
