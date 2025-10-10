/* eslint-disable import/no-default-export */

import baseConfig from "../../.lintstagedrc.mjs";

const config = {
  ...baseConfig,
  "*.{ts,tsx,js,jsx}": ["yarn run lint-base"],
};

export default config;
