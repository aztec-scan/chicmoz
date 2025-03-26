#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AztecScanApi } from "./api.js";
import { jsonStringify } from "@chicmoz-pkg/types";
import { z } from "zod";

// Create the MCP server
const server = new McpServer({
  name: "chicmoz-explorer",
  version: "1.0.0",
});

// Tool to get the latest block
server.resource(
  "getLatestBlock",
  "blockchain://blocks/latest",
  async (uri) => {
    try {
      const latestBlock = await AztecScanApi.getLatestBlock();

      // Convert BigInt values to strings for JSON serialization
      const blockStr = jsonStringify(latestBlock)

      return {
        contents: [
          {
            uri: uri.href,
            type: "text",
            text: blockStr
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error fetching latest block:", errorMessage);

      return {
        contents: [
          {
            uri: uri.href,
            type: "text",
            text: `Error fetching latest block: ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  "getLatestHeight",
  "Get the latest L2 block Height",
  {},
  async () => {
    try {
      // const latestBlock = await AztecScanApi.getLatestHeight();
      const latestBlock = "Hello Boys"

      // Convert BigInt values to strings for JSON serialization
      const blockStr = jsonStringify(latestBlock)

      return {
        content: [
          {
            type: "text",
            text: blockStr
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error fetching latest height:", errorMessage);

      return {
        content: [
          {
            type: "text",
            text: `Error fetching latest height: ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  "search",
  "Search what a hash",
  { query: z.string().describe("Hash, address, or other identifier to search for") },
  async ({ query }) => {
    try {
      const searchResults = await AztecScanApi.search(query);

      // convert BigInt values to strings for JSON serialization
      const searchResultsStr = jsonStringify(searchResults)

      return {
        content: [
          {
            type: "text",
            text: searchResultsStr
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);


      return {
        content: [
          {
            type: "text",
            text: `Error fetching latest height: ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  }
);

// Function to start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main()
