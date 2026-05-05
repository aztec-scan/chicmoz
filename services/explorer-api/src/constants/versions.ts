// Rollup version constants
export const v2_0_x = "1714840162";
export const v1_1_x = "3924331020";
export const v0_8_x = "4189337207"; // This should not be used anywhere
export const v3_0_0_devnet_2 = "1667575857";
export const v3_0_0_devnet_20251212 = "1647720761";
export const v3_0_1_rc_1 = "3468522156";
export const v3_0_3 = "2500495677";
export const v4_0_3 = "4181870535";
export const v4_0_0_devnet_2_patch_0 = "615022430";
export const sandbox_v4_0_0_devnet_2_patch_1 = "126353417";
export const v4_1_0_testnet_rc_2 = "4127419662";
export const mainnet_v4_1_3 = "2934756905";
export const testnet_v4_1_3 = "4127419662";
export const sandbox_v4_1_3 = "344372055";

// Current active version to use for fetching blocks.
// NOTE: must match the aztec version running in the environment. Operators
// can override at runtime with `OVERRIDE_ROLLUP_VERSION=<numeric_version>`
// without a code change — useful when the testnet rollup gets bumped.
const networkDefaultRollupVersion = (() => {
  switch (process.env.L2_NETWORK_ID) {
    case "SANDBOX":
      return sandbox_v4_1_3;
    case "TESTNET":
      return v4_1_0_testnet_rc_2;
    default:
      return testnet_v4_1_3;
  }
})();

export const CURRENT_ROLLUP_VERSION =
  process.env.OVERRIDE_ROLLUP_VERSION ?? networkDefaultRollupVersion;

export const CURRENT_ROLLUP_VERSION_NUMBER = Number(CURRENT_ROLLUP_VERSION);
export const CURRENT_ROLLUP_VERSION_BIGINT = BigInt(CURRENT_ROLLUP_VERSION);
