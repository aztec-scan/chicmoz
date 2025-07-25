import { parseTimeStamp } from "@chicmoz-pkg/backend-utils";

// NOTE: all comments here is to test if this issue is resolved: https://github.com/AztecProtocol/aztec-packages/issues/8339
export const getEventL1Timestamp = (
  log: { blockTimestamp: `0x${string}` }
  //id: string
) => {
  const timestampStr = log.blockTimestamp;
  const l1BlockTimestamp = new Date(parseTimeStamp(Number.parseInt(timestampStr, 16)));
  //logger.info(`${id} | TS date: ${l1BlockTimestamp.toLocaleString()}`);
  //logger.info(`${id} | TS  nbr: ${l1BlockTimestamp.getTime()}`);
  //const now = Date.now();
  //logger.info(`${id} | now date: ${new Date(now).toLocaleString()}`);
  //logger.info(`${id} | now nbr: ${now}`);

  //logger.info(
  //  `${id} | diff: ${(now - l1BlockTimestamp.getTime()) / 1000} seconds (${
  //    (now - l1BlockTimestamp.getTime()) / 60 / 1000
  //  } minutes)`
  //);
  return l1BlockTimestamp;
};
