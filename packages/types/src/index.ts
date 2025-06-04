export * from "./api/index.js";
export * from "./aztec/index.js";
export * from "./config.js";
export * from "./ethereum/index.js";
export * from "./events.js";
export * from "./general.js";
export * from "./network-ids.js";

// TODO: move this to some appropriate place
export const jsonStringify = (param: unknown): string => {
  return JSON.stringify(
    param,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
  );
};
