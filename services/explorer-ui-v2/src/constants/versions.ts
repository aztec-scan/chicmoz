// Rollup version constants — mirrored from explorer-ui so that
// ChicmozL2BlockLight.version comparisons behave the same way.
export const v4_1_3 = 2934756905;
export const sandbox_v4_1_3 = 231905116;

export const CURRENT_ROLLUP_VERSION =
  import.meta.env.VITE_L2_NETWORK_ID === "SANDBOX"
    ? sandbox_v4_1_3
    : v4_1_3;
