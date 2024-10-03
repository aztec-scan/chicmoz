import { PUBLIC_API_KEY } from "../environment.js";
import { openApiPaths } from "./routes/index.js";

export const genereateOpenApiSpec = () => ({
  openapi: "3.1.0",
  info: {
    title: "Aztec Scan API",
    version: "0.2.0",
    description:
      "API for exploring Aztec Network. Please note that this is a work in progress and the API is subject to change.",
  },
  servers: [
    {
      url: "https://api.chicmoz.info/v1/{apiKey}",
      variables: {
        apiKey: {
          default: PUBLIC_API_KEY,
          description: "The project ID",
        },
      },
    },
    {
      url: "http://explorer-api.localhost/v1/{apiKey}",
      variables: {
        apiKey: {
          default: PUBLIC_API_KEY,
          description: "The project ID",
        },
      },
    },
  ],
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  paths: openApiPaths,
});
