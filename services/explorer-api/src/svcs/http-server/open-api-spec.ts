import { ApiKey } from "@chicmoz-pkg/types";
import { PUBLIC_API_KEY } from "../../environment.js";
import { openApiPaths } from "./routes/index.js";

export const genereateOpenApiSpec = () => ({
  openapi: "3.1.0",
  info: {
    title: "Aztec Scan API",
    version: process.env.VERSION_STRING ?? "VERSION NOT SET",
    description:
      "API for exploring Aztec Network. Please note that this is a work in progress and the API is subject to change.",
  },
  servers: [
    {
      // TODO: parameterize URLs
      url: "https://api.sandbox.aztecscan.xyz/v1/{apiKey}",
      variables: {
        apiKey: {
          default: PUBLIC_API_KEY,
          description: "Aztecscan API key",
        },
      },
    },
    {
      url: "https://api.sp.aztecscan.xyz/v1/{apiKey}",
      variables: {
        apiKey: {
          default: PUBLIC_API_KEY,
          description: "Aztecscan API key",
        },
      },
    },
    {
      url: "http://api.sandbox.chicmoz.localhost/v1/{apiKey}",
      variables: {
        apiKey: {
          default: ApiKey.DEV,
          description: "Aztecscan API key",
        },
      },
    },
    {
      url: "http://api.sp.chicmoz.localhost/v1/{apiKey}",
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
