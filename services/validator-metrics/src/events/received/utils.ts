import { logger } from "../../logger.js";

export type PartialDbError = {
  code: string;
  detail: string;
};

export const handleDuplicateBlockError = async (
  e: Error | PartialDbError,
  additionalInfo: string,
  deleteBlockCallback: () => Promise<void>
): Promise<boolean> => {
  if ((e as PartialDbError).code === "23505") {
    if ((e as PartialDbError).detail.includes("hash")) {
      logger.warn(`DB duplicate for "${additionalInfo}" skipping... [${(e as PartialDbError).detail}]`); // TODO: can it be that the hash gets 1. registered on one height, then 2. reorged out and then 3. regisered later on another height?
    } else if ((e as PartialDbError).detail.includes("height")) {
      await deleteBlockCallback();
      return true;
    }
  } else {
    handleOtherError(e as Error, additionalInfo);
  }
  return false;
};

export const handleDuplicateError = (
  e: Error | PartialDbError,
  additionalInfo: string
) => {
  if ((e as PartialDbError).code === "23505") {
    logger.warn(`DB Duplicate: ${additionalInfo}`);
    return;
  }
  handleOtherError(e as Error, additionalInfo);
};

const handleOtherError = (e: Error, additionalInfo: string) => {
  if (e.stack) {
    logger.error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Failed to store ${additionalInfo}: ${e?.stack}`
    );
    return;
  }
  logger.warn(JSON.stringify(e));
  logger.error(new Error(`Failed to store ${additionalInfo}`).stack);
};
