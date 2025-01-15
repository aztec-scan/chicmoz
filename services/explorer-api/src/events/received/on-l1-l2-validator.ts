import { L1L2ValidatorEvent } from "@chicmoz-pkg/message-registry";
import { chicmozL1L2ValidatorSchema } from "@chicmoz-pkg/types";
import { logger } from "../../logger.js";
import { l1 } from "../../svcs/database/controllers/index.js";

export const onL1L2Validator = async (event: L1L2ValidatorEvent) => {
  logger.info(`🤖 L1L2 validator event ${JSON.stringify(event)}`);
  await l1.storeL1L2Validator(
    chicmozL1L2ValidatorSchema.parse(event.validator)
  );
};
