import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerSaveConversation } from "./tools/save-conversation.js";
import { registerListConversations } from "./tools/list-conversations.js";
import { registerSearchConversations } from "./tools/search-conversations.js";
import { registerGetConversation } from "./tools/get-conversation.js";
import { registerDeleteConversations } from "./tools/delete-conversations.js";
import { registerExportConversation } from "./tools/export-conversation.js";

const server = new McpServer({
  name: "session-vault",
  version: "0.1.0",
});

// Register all MCP tools
registerSaveConversation(server);
registerListConversations(server);
registerSearchConversations(server);
registerGetConversation(server);
registerDeleteConversations(server);
registerExportConversation(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start session-vault MCP server:", error);
  process.exit(1);
});
