import { L2_NETWORK_ID } from "../environment.js";

// Rollup version constants
export const v2_1_x = "845231713";
export const v2_0_x = "1714840162";
export const v1_1_x = "3924331020";
export const v0_8_x = "4189337207"; // This should not be used anywhere

export const mainnet_workaround = "0";

// Current active version to use for fetching blocks
export const CURRENT_ROLLUP_VERSION = L2_NETWORK_ID === "MAINNET" ? mainnet_workaround : v2_1_x;
