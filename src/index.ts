#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 导入我们的思维模型服务器逻辑
import "./thinking_models_server.js";

console.error("思维模型 MCP 服务器启动中...");