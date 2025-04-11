import { ApiKey } from "@chicmoz-pkg/types";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { PUBLIC_API_KEY } from "../../environment.js";
import { openApiPaths } from "./routes/index.js";

export const genereateOpenApiSpec = (): OpenAPIObject => ({
  openapi: "3.1.0",
  info: {
    title: "Aztec Scan API",
    version: process.env.VERSION_STRING ?? "VERSION NOT SET",
    description: `API for exploring Aztec Network. Please note that this is a work in progress and the API is subject to change.

Currently there is no sign-up process for an API key. There will however be rate limits in place.

This is also subject to change, and the latest updates on this will always be available here.`,
    contact: {
      name: "Github",
      url: "https://github.com/aztec-scan/chicmoz",
    },
  },
  servers: [
    // TODO: parameterize URLs
    {
      url: "https://api.testnet.aztecscan.xyz/v1/{apiKey}",
      description: "Testnet Aztecscan API",
      variables: {
        apiKey: {
          default: PUBLIC_API_KEY,
          description: "Aztecscan API key",
        },
      },
    },
    {
      url: "https://api.devnet.aztecscan.xyz/v1/{apiKey}",
      description: "Devnet Aztecscan API",
      variables: {
        apiKey: {
          default: PUBLIC_API_KEY,
          description: "Aztecscan API key",
        },
      },
    },
    {
      url: "http://api.sandbox.chicmoz.localhost/v1/{apiKey}",
      description: "LOCAL sandbox Aztecscan API",
      variables: {
        apiKey: {
          default: ApiKey.DEV,
          description: "Aztecscan API key",
        },
      },
    },
    {
      url: "http://api.testnet.chicmoz.localhost/v1/{apiKey}",
      description: "LOCAL Testnet Aztecscan API",
      variables: {
        apiKey: {
          default: ApiKey.DEV,
          description: "Aztecscan API key",
        },
      },
    },
  ],
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  paths: openApiPaths,
});
