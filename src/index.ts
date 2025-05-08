#!/usr/bin/env node
import { getParamValue } from "@chatmcp/sdk/utils/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RestServerTransport } from "@chatmcp/sdk/server/rest.js";

// 导入我们的思维模型服务器逻辑
import "./thinking_models_server.js";

// 此文件作为MCP服务器的入口点，用于MCP.so托管
console.error("思维模型 MCP 服务器启动中...");