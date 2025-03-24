#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BlockAPI } from "./api.js";
import { jsonStringify } from "@chicmoz-pkg/types";

// Create the MCP server
const server = new McpServer({
  name: "chicmoz-explorer",
  version: "1.0.0",
});

// Tool to get the latest block
server.tool(
  "getLatestBlock",
  "Get the latest L2 block",
  {},
  async () => {
    try {
      const latestBlock = await BlockAPI.getLatestBlock();

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
      console.error("Error fetching latest block:", errorMessage);

      return {
        content: [
          {
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
      const latestBlock = await BlockAPI.getLatestHeight();

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
