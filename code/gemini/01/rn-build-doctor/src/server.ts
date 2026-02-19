import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerDiagnoseTool } from './tools/diagnose.js';
import { registerDoctorTool } from './tools/doctor.js';
import { registerEnvInfoTool } from './tools/env-info.js';
import { registerFixTool } from './tools/fix.js';
import { registerRecommendTool } from './tools/recommend.js';
import { registerBestPracticeTool } from './tools/bestpractice.js';
import { registerPublishTool } from './tools/publish.js';
import { registerTemplateTool } from './tools/template.js';
import { registerUpgradeTool } from './tools/upgrade.js';
import { registerNativeModuleTool } from './tools/nativemodule.js';
import { registerCompatibilityTool } from './tools/compatibility.js';
import { registerTroubleshootTool } from './tools/troubleshoot.js';
import { registerPerformanceTool } from './tools/performance.js';
import { registerMigrationTool } from './tools/migration.js';
import { registerDeeplinkTool } from './tools/deeplink.js';
import { registerMonorepoTool } from './tools/monorepo.js';
import { registerReleaseChecklistTool } from './tools/release-checklist.js';
import { registerEnvSetupTool } from './tools/env-setup.js';
import { registerStateManagementTool } from './tools/state-management.js';
import { registerSnippetTool } from './tools/snippet.js';

const server = new McpServer({
  name: 'rn-build-doctor',
  version: '1.0.0',
});

registerDiagnoseTool(server);
registerDoctorTool(server);
registerEnvInfoTool(server);
registerFixTool(server);
registerRecommendTool(server);
registerBestPracticeTool(server);
registerPublishTool(server);
registerTemplateTool(server);
registerUpgradeTool(server);
registerNativeModuleTool(server);
registerCompatibilityTool(server);
registerTroubleshootTool(server);
registerPerformanceTool(server);
registerMigrationTool(server);
registerDeeplinkTool(server);
registerMonorepoTool(server);
registerReleaseChecklistTool(server);
registerEnvSetupTool(server);
registerStateManagementTool(server);
registerSnippetTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error('[rn-build-doctor] MCP server started');
