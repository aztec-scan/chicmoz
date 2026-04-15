/** @type {import("eslint").Linter.Config} */
const config = {
  env: {
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    project: true,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/no-misused-promises": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    curly: ["warn", "all"],
    "import/no-cycle": "error",
    "import/no-default-export": "error",
    "import/no-unresolved": "off",
    "no-console": "error",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-param-reassign": "error",
    "no-unneeded-ternary": "error",
  },
};
module.exports = config;
