# Thinking Models MCP Server

> A toolkit for intelligent thinking: Integrating systematic thinking methods into your problem-solving process

## What is the Thinking Models MCP Server?

The Thinking Models MCP Server is a powerful tool that integrates hundreds of thinking models, frameworks, and methodologies to help users think about problems more systematically and comprehensively. Through the MCP (Model Context Protocol) interface, AI assistants can access these thinking tools and seamlessly apply structured thinking methods to conversations.

## Core Features

- **Rich Thinking Model Library**: Contains classic thinking models from various domains including decision theory, systems thinking, and probabilistic thinking
- **Intelligent Model Recommendations**: Automatically recommends the most appropriate thinking models based on problem characteristics
- **Interactive Reasoning Process**: Guides users through structured thinking, step by step analyzing problems in depth
- **Learning and Adaptation System**: Continuously improves recommendation algorithms through user feedback
- **Model Creation and Combination**: Allows creating new models or combining existing models to produce innovative thinking frameworks

## Quick Start

### Installation (Local Development)

If you want to run and develop this project locally:

```bash
git clone https://github.com/yourusername/thinking-models-mcp.git # Replace with your repository address
cd thinking_models_mcp
npm install
npm run build
```

### Starting the Server (Local Development)

1.  **Standard Start (stdio mode)**
    Run in the project root directory:
    ```bash
    node dist/thinking_models_server.js
    ```
    Or use the npm script (if configured in package.json):
    ```bash
    npm run start
    ```

2.  **REST API Mode Start**
    Run in the project root directory:
    ```bash
    node dist/thinking_models_server.js --rest
    ```
    Or use the npm script (if configured in package.json):
    ```bash
    npm run start:rest
    ```
    You can also configure the port and endpoint using environment variables:
    ```bash
    # PowerShell
    $env:MODE="rest"
    $env:PORT="9593" # Default port
    $env:ENDPOINT="/rest" # Default endpoint
    node dist/thinking_models_server.js

    # Bash
    MODE="rest" PORT="9593" ENDPOINT="/rest" node dist/thinking_models_server.js
    ```

### Basic Usage

After the server starts, you can send requests to access thinking model tools through an MCP client. For example:

```json
{
  "tool": "recommend-models-for-problem",
  "tool_params": {
    "problem_keywords": ["decision", "uncertainty", "risk"],
    "lang": "en",
    "limit": 3
  }
}
```

## Client Configuration Guide

You can configure the Thinking Models MCP server in MCP-supporting clients such as Cursor, Claude Desktop, or VS Code's Claude extension.

### 1. Cursor Configuration

Open Cursor's `settings.json` file (typically accessed via `Ctrl+,` or `Cmd+,`, then search for "Open User Settings (JSON)"), and add the following configuration:

**Option 1: Run the server with local Node.js**

```json
{
  // ... other settings ...
  "mcpServers": {
    "thinking-models": { // You can customize this server name
      "command": "node",
      "args": [
        "e:\\thinking_models_mcp\\dist\\thinking_models_server.js" // Replace with your actual path
      ]
    }
  }
}
```

**Option 2: Use NPX to start the server from a remote npm package**

If the server has been published to npm (e.g., package name `@thinking-models/mcp-server`):

```json
{
  // ... other settings ...
  "mcpServers": {
    "thinking-models": {
      "command": "npx",
      "args": [
        "--yes", // Automatically confirm installation
        "@thinking-models/mcp-server" // Replace with the actual npm package name
        // To specify a version: "@thinking-models/mcp-server@1.3.1"
        // If the server package supports parameters, you can add them here, e.g.: "--rest", "--port", "9594"
      ]
    }
  }
}
```

### 2. Claude Desktop Configuration

Open Claude Desktop's configuration file `claude_desktop_config.json` (typically located at `C:\Users\<YourUserName>\AppData\Roaming\Claude\claude_desktop_config.json`), and add the following configuration:

**Option 1: Run the server with local Node.js**

```json
// filepath: c:\Users\<YourUserName>\AppData\Roaming\Claude\claude_desktop_config.json
{
  "mcpServers": {
    "thinking-models": { // You can customize this server name
      "command": "node",
      "args": [
        "e:\\thinking_models_mcp\\dist\\thinking_models_server.js" // Replace with your actual path
      ]
    }
  }
  // ... other settings ...
}
```

**Option 2: Use NPX to start the server from a remote npm package**

```json
// filepath: c:\Users\<YourUserName>\AppData\Roaming\Claude\claude_desktop_config.json
{
  "mcpServers": {
    "thinking-models": {
      "command": "npx",
      "args": [
        "--yes",
        "@thinking-models/mcp-server" // Replace with the actual npm package name
        // To specify a version: "@thinking-models/mcp-server@1.3.1"
      ]
    }
  }
  // ... other settings ...
}
```

### 3. VS Code + Claude Extension Configuration

Open VS Code's `settings.json` file (typically accessed via `Ctrl+,` or `Cmd+,`, then search for "Open User Settings (JSON)"), and add the following configuration:

**Option 1: Run the server with local Node.js**

```json
{
  // ... other settings ...
  "claude.tools.additionalToolServers": [
    {
      "name": "Thinking Models Server", // You can customize this server name
      "command": "node",
      "args": ["e:\\thinking_models_mcp\\dist\\thinking_models_server.js"] // Replace with your actual path
    }
  ]
}
```

**Option 2: Use NPX to start the server from a remote npm package**

```json
{
  // ... other settings ...
  "claude.tools.additionalToolServers": [
    {
      "name": "Thinking Models Server",
      "command": "npx",
      "args": [
        "--yes",
        "@thinking-models/mcp-server" // Replace with the actual npm package name
        // To specify a version: "@thinking-models/mcp-server@1.3.1"
      ]
    }
  ]
}
```

**About the `npx` and `--yes` parameters:**
`npx` is an npm package runner that allows you to execute commands from npm packages without installing them globally or locally.
The `--yes` parameter is used to automatically answer "yes" to any installation prompts that `npx` might present, which is important in configuration files where there is no user interaction to confirm installations.

### 4. Claude Web Interface Configuration (Using REST API)

If you want to use this server in the Claude Web interface, you need to:
1.  Start the server in REST API mode (see "Starting the Server" section above).
2.  Install a browser extension that supports custom MCP servers (e.g., "Claude Tools Browser Extension" or similar tools).
3.  Add the server in the browser extension settings:
    *   **URL**: `http://localhost:9593/rest` (adjust according to your server port and endpoint)
    *   **Name**: Thinking Models Server (or any name you prefer)

### Testing the Connection

After configuration, you can try calling tools on the server from the respective client (Cursor, Claude Desktop, Claude chat in VS Code), for example:

```
Please use the get-server-version tool from the Thinking Models Server to query the current version.
```

If configured correctly, the client should be able to call the server and return results.

## Tools Overview

### Exploration Tools

- **list-models**: List all thinking models or filter by category
- **search-models**: Search thinking models by keywords
- **get-categories**: Get all thinking model categories
- **get-model-info**: Get detailed information about a thinking model
- **get-related-models**: Get other models related to a specific model

### Problem-Solving Tools

- **recommend-models-for-problem**: Recommend suitable thinking models based on problem keywords
- **interactive-reasoning**: Interactive reasoning process guidance
- **generate-validate-hypotheses**: Generate multiple hypotheses for a problem and provide validation methods
- **explain-reasoning-process**: Explain the reasoning process of a model and the thinking patterns applied

### Creation Tools

- **create-thinking-model**: Create a new thinking model
- **emergent-model-design**: Create a new thinking model by combining existing thinking models
- **delete-thinking-model**: Delete unnecessary thinking models

### System and Learning Tools

- **get-started-guide**: Beginner's guide
- **get-server-version**: Get server version information
- **count-models**: Count the total number of current thinking models
- **record-user-feedback**: Record user feedback on thinking model usage experiences
- **detect-knowledge-gap**: Detect knowledge gaps in user queries
- **get-model-usage-stats**: Get usage statistics for thinking models
- **analyze-learning-system**: Analyze the status of the thinking model learning system

## Use Cases

### Solving Complex Problems

When facing complex problems, the system can recommend multiple thinking models to help you analyze the problem from different angles and avoid thinking blind spots.

### Improving Thinking Quality

Through structured thinking processes, avoid common cognitive biases and make more rational decisions.

### Learning Thinking Models

The system not only provides definitions of thinking models but also includes detailed teaching content, application examples, and notes to help you master various thinking tools.

### Creating Custom Models

When existing models cannot meet your needs, you can create new thinking models or combine existing models to create innovative thinking frameworks.

## System Architecture

```
┌─────────────────────┐     ┌──────────────────┐
│                     │     │                  │
│  Thinking Models DB │◄────┤  MCP Server Core │
│  (JSON files)       │     │                  │
└─────────────────────┘     └──────┬───────────┘
                                  │
                                  ▼
┌─────────────────────┐     ┌──────────────────┐
│                     │     │                  │
│  Similarity Engine  │◄────┤  Tool            │
│                     │     │  Implementation  │
└─────────────────────┘     └──────┬───────────┘
                                  │
                                  ▼
┌─────────────────────┐     ┌──────────────────┐
│                     │     │                  │
│  Learning System    │◄────┤  API Interface   │
│                     │     │  (REST/stdio)    │
└─────────────────────┘     └──────────────────┘
```

### Key Modules

- **MCP Server Core**: Handles requests and responses, manages tool registration
- **Thinking Models Database**: Stores and manages thinking model data
- **Semantic Similarity Engine**: Calculates the match between queries and models
- **Learning System**: Collects feedback, optimizes recommendation algorithms
- **Tool Implementation Module**: Implements specific functionality for various thinking model tools
- **API Interface Layer**: Provides both REST and stdio access methods

## Developer Documentation

This section is for developers who want to understand, customize, or extend the Thinking Models MCP Server.

### Development Environment Setup

#### Environment Requirements

- Node.js >= 18.0.0
- npm >= 8.0.0 (or compatible package managers like yarn, pnpm)
- TypeScript 5.x

#### Installing Dependencies (Local Development)

```bash
# Assuming you have cloned the repository and entered the project directory
npm install
```

#### Development Mode (Local Development)

```bash
# Watch mode, automatically recompiles TypeScript files when changes are detected
npm run watch

# Start the development server in another terminal (usually runs the compiled files from the dist directory)
# You might need a tool like nodemon to automatically restart the server
npm run start:dev # (assuming you have configured this script in package.json)
```

### Code Architecture

#### File Structure (Example)

```
thinking_models_mcp/
├── dist/                     # Compiled JavaScript files
├── src/                      # TypeScript source code
│   ├── thinking_models_server.ts  # Main server logic and tool registration
│   ├── types.ts              # TypeScript type definitions
│   ├── utils.ts              # Common utility functions
│   ├── similarity_engine.ts  # Similarity calculation logic
│   ├── reasoning_process.ts  # Reasoning process management
│   ├── learning_capability.ts # Learning system functionality
│   ├── recommendations.ts    # Model recommendation logic
│   └── response_types.ts     # API response type definitions
├── thinking_models_db/       # Thinking models database
│   ├── zh/                   # Chinese models (JSON files)
│   └── en/                   # English models (JSON files)
├── package.json              # Project dependencies and scripts
├── tsconfig.json             # TypeScript compiler configuration
└── README.md                 # This document
```

#### Core Modules

1.  **Server Core (thinking_models_server.ts)**
    *   Initializes the MCP server instance (`McpServer` from `@modelcontextprotocol/sdk`)
    *   Registers all available tools, defines their parameter schemas (using `zod`) and handler functions
    *   Loads and manages thinking model data
    *   Handles client requests and routes to the appropriate tools

2.  **Thinking Model Types (`types.ts`)**
    *   Defines the core `ThinkingModel` interface, describing the data structure of models
    *   Other TypeScript types and interfaces related to models

3.  **Similarity Calculation Engine (`similarity_engine.ts`)**
    *   `calculateQueryMatch`: Calculates the match between user queries and thinking models
    *   `calculateKeywordRelevance`: Calculates the relevance of a list of keywords to thinking models

4.  **Reasoning Process Management (`reasoning_process.ts`)**
    *   Used for building, managing, and visualizing structured reasoning paths

5.  **Learning System (`learning_capability.ts`)**
    *   `recordUserFeedback`: Records user feedback on model usage
    *   `detectKnowledgeGap`: Detects knowledge gaps based on user queries and feedback
    *   `adjustModelRecommendations`: Adjusts model recommendations based on learning data

### API Documentation

#### Server API

The server supports two communication modes:

1.  **stdio API (default)**
    *   Communicates with clients through standard input/output.
    *   Follows the MCP protocol specification.
    *   Usually automatically managed by clients (like Cursor, Claude Desktop).

2.  **REST API (requires starting with the `--rest` parameter or `MODE=rest` environment variable)**
    *   **Endpoint**: Default is `/rest` (can be configured via the `ENDPOINT` environment variable)
    *   **Port**: Default is `9593` (can be configured via the `PORT` environment variable)
    *   **Method**: `POST`
    *   **Request Body**: JSON object containing `tool` (tool name string) and `tool_params` (tool parameters object) fields.
        ```json
        {
          "tool": "list-models",
          "tool_params": {
            "lang": "en",
            "category": "Decision Theory"
          }
        }
        ```
    *   **Response Body**: JSON object, usually containing a `content` array where each element is a content block (e.g., `type: "text"` and `text: "..."`).

#### Tool API

Each tool is registered through the `server.tool()` method, including:
1.  **Tool Name** (string): Name used by clients when calling the tool.
2.  **Tool Description** (string): Brief explanation of the tool's functionality.
3.  **Parameter Schema** (Zod object): Uses the `zod` library to define the parameters the tool accepts and their types, descriptions, and constraints.
4.  **Handler Function** (async function): Receives the validated parameter object, executes the tool logic, and returns a response conforming to the MCP protocol.

##### Example Tool Registration

```typescript
// filepath: src/thinking_models_server.ts
// ... imports ...

server.tool(
  "get-model-count-by-category", // Tool name
  "Get the number of thinking models in a specified category", // Tool description
  { // Parameter schema (Zod schema)
    category: z.string().describe("The main category of thinking models to query"),
    lang: z.enum(["zh", "en"] as const).default("en").describe("Language code ('zh' or 'en')")
  },
  async ({ category, lang }) => { // Handler function
    try {
      const modelsInBuffer = MODELS[lang] || []; // MODELS is a cache of loaded models
      const count = modelsInBuffer.filter(m => m.category === category).length;
      log(`Tool 'get-model-count-by-category' called: category=${category}, lang=${lang}, count=${count}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ category, lang, count }, null, 2)
        }]
      };
    } catch (error: any) {
      log(`Error executing tool 'get-model-count-by-category': ${error.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "Failed to get model count", message: error.message }, null, 2)
        }]
      };
    }
  }
);
```

### Extension Guide

#### Adding New Tools

1.  In thinking_models_server.ts (or related module files), register your new tool using the `server.tool()` method, as shown in the example above.
2.  Define clear parameter schemas and descriptions.
3.  Implement the tool's handler function, ensuring it includes error handling and logging.
4.  Recompile the project (`npm run build`).

#### Creating New Thinking Models

1.  Create a new `.json` file in the zh (Chinese) or en (English) directory.
2.  The filename is typically the model's ID (e.g., `new_decision_matrix.json`).
3.  The file content should conform to the structure of the `ThinkingModel` interface (defined in types.ts). Example:
    ```json
    {
      "id": "new_decision_matrix",
      "name": "New Decision Matrix Model",
      "definition": "A structured method for evaluating options across multiple criteria.",
      "purpose": "Help make rational choices among complex options.",
      "category": "Decision Making",
      "subcategories": ["Multi-Criteria Decision"],
      "tags": ["decision", "matrix", "evaluation", "choice"],
      "use_cases": ["Product feature prioritization", "Vendor selection"],
      // ... other fields like popular_science_teaching, limitations, common_pitfalls, visualizations, etc.
    }
    ```
4.  The server will automatically load the new model when it starts, or if file monitoring is enabled, it will reload when the file is saved.

#### Modifying the Recommendation Algorithm

The recommendation logic is primarily located in similarity_engine.ts and recommendations.ts.
-   **`similarity_engine.ts`**: Contains the core algorithms for calculating text similarity and keyword relevance. You can adjust the weights of these algorithms, the techniques used (such as TF-IDF, embedding vectors, etc.) to improve matching precision.
-   **`recommendations.ts`**: Contains functions like `getModelRecommendations` that use the results of the similarity engine to generate the final list of model recommendations. You can modify the logic here, such as how to combine scores from different sources or how to adjust recommendations based on context.

### Testing

The project typically uses a testing framework like Jest.

#### Writing Tests

Create test files for your modules or functions in the `tests` directory (e.g., `tests/my_tool.test.ts`).

```typescript
// tests/example_tool.test.ts
import { server, loadModels } from '../src/thinking_models_server'; // Assuming the server instance is exported
import { ThinkingModel } from '../src/types';

// Mock MCP client request
async function callTool(toolName: string, params: any) {
  const toolDefinition = server.capabilities.tools[toolName];
  if (!toolDefinition || !toolDefinition.execute) {
    throw new Error(`Tool ${toolName} not found or not executable`);
  }
  // In actual testing, a more complex mock may be needed to match the MCP SDK context
  return toolDefinition.execute(params, {} as any);
}

describe('My Custom Tool Tests', () => {
  beforeAll(async () => {
    // Load test model data (if needed)
    await loadModels('en'); // Load English models
  });

  test('get-model-count-by-category should return correct count', async () => {
    const response = await callTool('get-model-count-by-category', { category: 'Decision Making', lang: 'en' });
    const result = JSON.parse(response.content[0].text);
    expect(result.category).toBe('Decision Making');
    expect(result.count).toBeGreaterThanOrEqual(0); // Specific count depends on your test data
  });
});
```

#### Running Tests

Configure the test script in package.json:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```
Then run:
```bash
npm test
```

### Building and Deployment

#### Building the Project

```bash
npm run build
```
This will use `tsc` (TypeScript compiler) to compile the `.ts` files in the src directory into JavaScript files in the `dist` directory.

#### Deployment Options

1.  **Deploy as a standalone Node.js server**
    *   Copy the entire project (or at least the `dist` directory, node_modules, package.json, and thinking_models_db) to the server.
    *   Run the server:
        ```bash
        # stdio mode
        node dist/thinking_models_server.js

        # REST mode
        PORT=9593 ENDPOINT=/api node dist/thinking_models_server.js --rest
        ```
    *   Consider using a process manager like `pm2` to keep the server running.

2.  **Deploy as a Docker container**
    *   Create a Dockerfile:
        ```dockerfile
        FROM node:18-alpine

        WORKDIR /usr/src/app

        COPY package*.json ./
        RUN npm install --omit=dev # Only install production dependencies

        COPY . .
        RUN npm run build

        ENV MODE=stdio
        ENV PORT=9593
        ENV ENDPOINT=/rest

        EXPOSE ${PORT}

        CMD [ "node", "dist/thinking_models_server.js" ]
        # Or CMD npm start (if the start script in package.json points to the compiled file)
        ```
    *   Build the Docker image:
        ```bash
        docker build -t thinking-models-mcp .
        ```
    *   Run the container:
        ```bash
        # stdio mode (typically used for direct interaction with another process)
        # docker run --rm -i thinking-models-mcp

        # REST mode
        docker run -d -p 9593:9593 -e MODE=rest thinking-models-mcp
        ```

### Code Standards

#### Coding Style

-   Follow a consistent coding style (e.g., using Prettier and ESLint).
-   Use TypeScript's strong typing features and avoid using `any` unless absolutely necessary.
-   Write clear, self-explanatory code and add comments for complex logic.

#### Naming Conventions

-   **Functions and variables**: `camelCase` (e.g., `calculateSimilarity`)
-   **Classes and interfaces**: `PascalCase` (e.g., `ThinkingModel`, `McpServer`)
-   **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_PORT`)
-   **Filenames**: `snake_case.ts` or `kebab-case.ts` (maintain consistency within the project)

#### Documentation Standards

-   Write JSDoc/TSDoc comments for all public APIs (functions, classes, interfaces).
-   Clearly explain the project's functionality and usage in README and other documentation.
-   Keep documentation in sync with code.

### Common Development Issues and Troubleshooting

#### 1. Models Not Loading or Loading Incorrectly
-   **Check paths**: Ensure that the paths defined in `SUPPORTED_LANGUAGES` are correct relative to the compiled `thinking_models_server.js` file.
-   **JSON format**: Make sure all model `.json` files are valid JSON and conform to the structure of the `ThinkingModel` interface.
-   **File permissions**: Ensure the server process has permission to read the model directory and files.
-   **Logs**: Check the server startup logs, which typically include error information when loading models.

#### 2. API Requests Failing or Tools Not Found
-   **Server running status**: Confirm that the server has successfully started and has no errors.
-   **Endpoint and port**: If using REST mode, check if the URL, port, and endpoint configured in the client match the server.
-   **Tool names**: Confirm that the tool names called by the client exactly match those registered on the server (case-sensitive).
-   **Parameter format**: Ensure the parameters sent to the tools conform to their Zod schema definitions.

#### 3. Similarity Calculation or Recommendations Not Accurate
-   **Model data quality**: Fields like `definition`, `purpose`, `tags`, `keywords` in the models are critical for similarity calculations. Ensure these fields are rich and accurate.
-   **Algorithm adjustment**: You may need to adjust algorithm parameters or weights in `similarity_engine.ts`.
-   **Learning system**: If the learning system is enabled, check if feedback data is correctly recorded and applied.

#### Best Practices
-   **Logging**: Use the `log()` function (or a more sophisticated logging library) to record key operations, errors, and debug information.
-   **Error handling**: Implement robust error handling in all tool functions and asynchronous operations, and return meaningful error information to clients.
-   **Modularity**: Organize different functionalities (such as similarity calculation, learning system, tool implementation) into independent modules.
-   **Configuration management**: Use environment variables or configuration files for configurable items such as ports, paths, etc.

## Open Source License

This project is open source under the MIT license.