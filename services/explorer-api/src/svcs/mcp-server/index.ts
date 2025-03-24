import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { sql } from "drizzle-orm";
import { getLatestBlock, getLatestHeight } from "../database/controllers/l2block/get-latest.js";
import { getBlock } from "../database/controllers/l2block/get-block.js";
import { search } from "../database/controllers/l2/search.js";
import { z } from "zod";
import { getBlockByHeightOrHashSchema, getSearchSchema } from "../http-server/routes/paths_and_validation.js";
import { logger } from "../../logger.js";
import { jsonStringify } from "@chicmoz-pkg/types";
import { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";

// Create an MCP server for the Block Explorer
const server = new McpServer({
  name: "BlockExplorer",
  version: "1.0.0"
});

// Tool to get the latest block
server.tool(
  "get-latest-block",
  {}, // No parameters needed
  async () => {
    try {
      const latestBlock = await getLatestBlock();

      if (!latestBlock) {
        return {
          content: [{ type: "text", text: "No blocks found in the database." }],
          isError: true
        };
      }

      // Convert BigInt values to strings for JSON serialization
      return {
        content: [{
          type: "text",
          text: jsonStringify(latestBlock)
        }]
      };
    } catch (error) {
      logger.error("Error fetching latest block:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error fetching latest block: ${errorMessage}` }],
        isError: true
      };
    }
  }
);

// Tool to get the latest block height
server.tool(
  "get-latest-height",
  {}, // No parameters needed
  async () => {
    try {
      const height = await getLatestHeight();

      if (height === null) {
        return {
          content: [{ type: "text", text: "No blocks found in the database." }],
          isError: true
        };
      }

      return {
        content: [{ type: "text", text: height.toString() }]
      };
    } catch (error) {
      logger.error("Error fetching latest height:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error fetching latest height: ${errorMessage}` }],
        isError: true
      };
    }
  }
);

// Tool to get block by height or hash
server.tool(
  "get-block",
  {
    identifier: z.string().describe("Block height (number) or block hash (hex string)")
  },
  async ({ identifier }) => {
    try {
      const { heightOrHash } = getBlockByHeightOrHashSchema.parse(identifier).params;

      const block = await getBlock(heightOrHash);

      if (!block) {
        return {
          content: [{ type: "text", text: `Block not found with identifier: ${identifier}` }],
          isError: true
        };
      }

      return {
        content: [{
          type: "text",
          text: jsonStringify(block)
        }]
      };
    } catch (error) {
      logger.error("Error fetching block:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error fetching block: ${errorMessage}` }],
        isError: true
      };
    }
  }
);

// Tool to search across blocks, transactions, and contracts
server.tool(
  "search",
  {
    query: z.string().describe("Search query - can be block hash, tx hash, contract ID, or numeric block height")
  },
  async ({ query }) => {
    try {
      // If query is numeric, convert to BigInt for block height search
      const { q } = getSearchSchema.parse(query).query;

      const results = await search(q);

      if (!results || (
        !results.results.blocks.length &&
        !results.results.txEffects.length &&
        !results.results.registeredContractClasses.length &&
        !results.results.contractInstances.length
      )) {
        return {
          content: [{ type: "text", text: `No results found for: ${query}` }],
          isError: false
        };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2)
        }]
      };
    } catch (error) {
      logger.error("Error during search:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error during search: ${errorMessage}` }],
        isError: true
      };
    }
  }
);

// Tool to run a custom read-only SQL query
server.tool(
  "run-query",
  {
    query: z.string().describe("SQL query to execute (read-only)"),
  },
  async ({ query }) => {
    // Validate the query is read-only
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery.startsWith('select')) {
      return {
        content: [{ type: "text", text: "Only SELECT queries are allowed for security reasons." }],
        isError: true
      };
    }

    try {
      // Execute the query
      const result = await db().execute(sql.raw(query));

      return {
        content: [{
          type: "text",
          text: jsonStringify(result)
        }]
      };
    } catch (error) {
      logger.error("Error executing query:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error executing query: ${errorMessage}` }],
        isError: true
      };
    }
  }
);

// Resource to list all tables in the database
server.resource(
  "tables-list",
  "db://tables",
  async (uri) => {
    try {
      // Get table information from PostgreSQL system catalog
      const tables = await db().execute(sql`
        SELECT 
          table_name 
        FROM 
          information_schema.tables 
        WHERE 
          table_schema = 'public'
      `);

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(tables, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      logger.error("failed to get tables", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to fetch table list: ${errorMessage}`);
    }
  }
);

// Resource to get schema for a specific table
server.resource(
  "table-schema",
  new ResourceTemplate("db://tables/{table}/schema", { list: undefined }),
  async (uri, { table }) => {
    try {
      // Get column information for the specified table
      const columns = await db().execute(sql`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM 
          information_schema.columns 
        WHERE 
          table_name = ${table} AND
          table_schema = 'public'
        ORDER BY 
          ordinal_position
      `);

      // Get constraint information
      const constraints = await db().execute(sql`
        SELECT
          con.conname as constraint_name,
          con.contype as constraint_type,
          array_to_string(array_agg(col.attname), ', ') as column_names
        FROM
          pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
          JOIN pg_attribute col ON col.attrelid = rel.oid AND col.attnum = ANY(con.conkey)
        WHERE
          rel.relname = ${table} AND
          nsp.nspname = 'public'
        GROUP BY
          con.conname,
          con.contype
      `);

      const schemaInfo = {
        table,
        columns,
        constraints
      };

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(schemaInfo, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      logger.error("failed to run query", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to fetch schema for table ${table.toString()}: ${errorMessage}`);
    }
  }
);


export const init = async () => {
  let resolveInit: () => void;
  const initPromise = new Promise<void>((resolve) => {
    resolveInit = resolve;
  });

  logger.info(`Initializing MCP server...`);

  // Start the server
  const transport = new StdioServerTransport();
  server.connect(transport)
    .then(() => { logger.info("Block Explorer MCP Server running"); resolveInit() })
    .catch(error => logger.error("Failed to start server:", error));

  await initPromise;
}

export const mcpServerService: MicroserviceBaseSvc = {
  svcId: "MCP_SERVER",
  init,
  getConfigStr: () => `NON availible`,
  health: () => true,
  shutdown: async () => {
    await new Promise<void>((resolve) => {
      server.close().then(() => {
        resolve()
      }).catch(error => logger.error("Failed to shutdown server:", error));
    });
  },
};
