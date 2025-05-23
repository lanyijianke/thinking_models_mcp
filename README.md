# "Tianji" — Thinking Models MCP Server
![alt text](image/tianji.png)

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)
[![MCP Protocol](https://img.shields.io/badge/MCP_Protocol-1.11+-brightgreen.svg)](https://github.com/modelcontextprotocol)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-2.2.0-orange.svg)](https://github.com/yourusername/thinking-models-mcp)
[![Zod](https://img.shields.io/badge/Zod-3.24+-purple.svg)](https://github.com/colinhacks/zod)

> Toolbox for intelligent thinking: Integrating systematic thinking methods into your problem-solving process

## Table of Contents

- [What is "Tianji"?](#what-is-tianji)
- [Core Features](#core-features)
- [Tools Overview](#tools-overview)
  - [Exploration Tools](#exploration-tools)
  - [Problem-Solving Tools](#problem-solving-tools)
  - [Creation Tools](#creation-tools)
  - [System and Learning Tools](#system-and-learning-tools)
- [Tool Function Parameters and Return Values](#tool-function-parameters-and-return-values)
  - [Exploration Tools](#exploration-tools-1)
  - [Problem-Solving Tools](#problem-solving-tools-1)
  - [Creation Tools](#creation-tools-1)
  - [System and Learning Tools](#system-and-learning-tools-1)
- [Use Cases](#use-cases)
- [Quick Start](#quick-start)
- [Configuration Guide](#configuration-guide)
- [Developer Documentation](#developer-documentation)
  - [Development Environment Setup](#development-environment-setup)
  - [Code Architecture](#code-architecture)
  - [API Documentation](#api-documentation)
  - [Extension Guidelines](#extension-guidelines)
  - [Testing](#testing)
  - [Build and Deployment](#build-and-deployment)
  - [Coding Standards](#coding-standards)
  - [Common Development Issues and Troubleshooting](#common-development-issues-and-troubleshooting)
- [License](#license)

## What is "Tianji"?

"Tianji" is a powerful thinking model MCP server that integrates hundreds of thinking models, frameworks, and methodologies to help users think more systematically and comprehensively about problems. Through the MCP (Model Context Protocol) interface, AI assistants can access these thinking tools and seamlessly apply structured thinking methods to conversations. The name "Tianji" originates from the ancient Chinese saying "Heaven's secrets must not be revealed," implying that it helps users uncover deeper patterns of thinking and wisdom.

## Core Features

- **Rich Library of Thinking Models**: Contains classic thinking models across multiple domains including decision theory, systems thinking, and probabilistic thinking
- **Intelligent Model Recommendations**: Automatically recommends the most suitable thinking models based on problem characteristics
- **Interactive Reasoning Process**: Guides users through structured thinking, analyzing problems step by step
- **Learning and Adaptation System**: Continuously improves recommendation algorithms through user feedback
- **Model Creation and Combination**: Allows creation of new models or combination of existing models to generate innovative thinking frameworks

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
- **update-thinking-model**: Update any field of an existing thinking model, including basic information and visualization data, without recreating the entire model
- **emergent-model-design**: Create new thinking models by combining existing ones
- **delete-thinking-model**: Delete unwanted thinking models

### System and Learning Tools

- **get-started-guide**: Beginner's guide
- **get-server-version**: Get server version information
- **count-models**: Count the total number of current thinking models
- **record-user-feedback**: Record user feedback on thinking model experiences
- **detect-knowledge-gap**: Detect knowledge gaps in user queries
- **get-model-usage-stats**: Get usage statistics for thinking models
- **analyze-learning-system**: Analyze the status of the thinking model learning system

## Tool Function Parameters and Return Values

Below are the detailed parameters and return values for all tool functions:

### Exploration Tools

#### `list-models`

Lists all thinking models or filters by category.

**Parameters:**
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]
- `category` (optional): Main category name
- `subcategory` (optional): Subcategory name (requires main category to be provided)
- `limit` (optional, default 100): Limit on the number of results returned

**Return Value:**
```json
{
  "models": [
    {
      "id": "modelID",
      "name": "model name",
      "definition": "model definition",
      "category": "model category"
    }
    // ... more models
  ],
  "total": total number of models queried,
  "filter": "applied filter conditions"
}
```

#### `search-models`

Search thinking models by keywords.

**Parameters:**
- `query` (required): Search keywords
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]
- `limit` (optional, default 10): Limit on the number of results returned

**Return Value:**
```json
{
  "results": [
    {
      "id": "modelID",
      "name": "model name",
      "definition": "model definition",
      "purpose": "model purpose",
      "match_score": match score,
      "match_reasons": ["match reason 1", "match reason 2"]
    }
    // ... more matching results
  ],
  "total": total number of matching models,
  "query": "search keywords"
}
```

#### `get-categories`

Get all thinking model categories.

**Parameters:**
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]

**Return Value:**
```json
{
  "categories": [
    {
      "name": "category name",
      "count": number of models in this category,
      "subcategories": [
        {
          "name": "subcategory name",
          "count": number of models in this subcategory
        }
        // ... more subcategories
      ]
    }
    // ... more categories
  ],
  "total_categories": total number of categories,
  "total_models": total number of all models
}
```

#### `get-model-info`

Get detailed information about a thinking model.

**Parameters:**
- `model_id` (required): Unique ID of the thinking model
- `fields` (optional, default ["basic"]): Fields to return, options: ["all", "basic", "detail", "teaching", "warnings", "visualizations"]
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]

**Return Value:**
```json
{
  "id": "modelID",
  "name": "model name",
  "definition": "model definition",
  "purpose": "model purpose",
  // Different levels of detailed information based on the fields parameter
  "category": "model category",
  "subcategories": ["subcategory 1", "subcategory 2"],
  "application_steps": ["application step 1", "application step 2"],
  "popular_science_teaching": [
    {
      "concept_name": "concept name",
      "explanation": "popular explanation"
    }
  ],
  "limitations": [
    {
      "limitation_name": "limitation name",
      "description": "limitation description"
    }
  ],
  "common_pitfalls": [
    {
      "pitfall_name": "common pitfall name",
      "description": "pitfall description"
    }
  ],
  // Visualization-related fields (if requested)
  "visualizations": {
    "flowcharts": [...],
    "tables": [...],
    "bar_charts": [...],
    "lists": [...]
  }
}
```

#### `get-related-models`

Get models related to a specific model.

**Parameters:**
- `model_id` (required): Unique ID of the thinking model
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]
- `limit` (optional, default 5): Limit on the number of results returned
- `use_enhanced_similarity` (optional, default true): Whether to use enhanced similarity assessment

**Return Value:**
```json
{
  "related_models": [
    {
      "id": "related model ID",
      "name": "related model name",
      "similarity_score": similarity score,
      "relationship_type": "relationship type",
      "definition": "model definition"
    }
    // ... more related models
  ],
  "source_model": {
    "id": "source model ID",
    "name": "source model name"
  }
}
```

### Problem-Solving Tools

#### `recommend-models-for-problem`

Recommend suitable thinking models based on problem keywords.

**Parameters:**
- `problem_keywords` (required): Array of problem keywords
- `problem_context` (optional): Complete context description of the problem
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]
- `limit` (optional, default 10): Limit on the number of results returned
- `use_learning_adjustment` (optional, default true): Whether to use the learning system to adjust recommendations

**Return Value:**
```json
{
  "models": [
    {
      "id": "model ID",
      "name": "model name",
      "match_score": match score,
      "match_reasons": ["match reason 1", "match reason 2"],
      "definition": "model definition",
      "purpose": "model purpose",
      "adjustment_reason": "adjustment reason (if learning adjustment is used)"
    }
    // ... more recommended models
  ],
  "learning_adjusted": whether learning adjustment was applied,
  "total_models_matched": total number of matching models
}
```

#### `interactive-reasoning`

Provide interactive reasoning process guidance.

**Parameters:**
- `initialContext` (required): Initial problem or situation description
- `reasoningStage` (required): Current reasoning stage, options: ["information_gathering", "hypothesis_generation", "hypothesis_testing", "conclusion"]
- `currentPathId` (optional): Current reasoning path ID (if in an existing reasoning)
- `requiredInformation` (optional): Array of additional information needed
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]

**Return Value:**
```json
{
  "pathId": "reasoning path ID",
  "currentStage": "current stage",
  "suggestedActions": [
    "suggested action 1",
    "suggested action 2"
  ],
  "relevantModels": [
    {
      "id": "related model ID",
      "name": "related model name",
      "relevance_reason": "relevance reason"
    }
    // ... more related models
  ],
  "nextStep": {
    "action": "next action",
    "description": "next step description"
    // May contain other stage-specific data
  }
}
```

#### `generate-validate-hypotheses`

Generate multiple hypotheses for a problem and provide validation methods.

**Parameters:**
- `problem` (required): Problem to solve
- `context` (required): Background information related to the problem
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]

**Return Value:**
```json
{
  "problem_statement": "problem statement",
  "hypotheses": [
    {
      "hypothesis": "hypothesis content",
      "rationale": "formation rationale",
      "validation_methods": [
        {
          "method": "validation method",
          "expected_outcome": "expected result",
          "resources_needed": "resources needed"
        }
        // ... more validation methods
      ],
      "potential_biases": ["potential bias 1", "potential bias 2"]
    }
    // ... more hypotheses
  ],
  "applicable_thinking_models": [
    {
      "id": "applicable model ID",
      "name": "applicable model name",
      "relevance": "relevance description"
    }
    // ... more applicable models
  ]
}
```

#### `explain-reasoning-process`

Explain the reasoning process of a model and the thinking patterns applied.

**Parameters:**
- `problemDescription` (required): Problem or situation description
- `reasoningSteps` (required): Array of reasoning step details, each step includes:
  - `description` (required): Reasoning step description
  - `modelIds` (optional): Array of thinking model IDs used
  - `evidence` (optional): Array of supporting evidence
  - `confidence` (optional, default 0.8): Confidence level (0-1)
- `conclusion` (required): Reasoning conclusion
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]

**Return Value:**
```json
{
  "reasoning_path": {
    "problem": "problem description",
    "steps": [
      {
        "description": "step description",
        "models_applied": [
          {
            "id": "applied model ID",
            "name": "applied model name",
            "explanation": "model application explanation"
          }
        ],
        "cognitive_biases_avoided": ["avoided cognitive bias 1", "avoided cognitive bias 2"],
        "confidence": confidence value
      }
      // ... more reasoning steps
    ],
    "conclusion": "conclusion",
    "meta_cognition_insights": ["meta-cognition insight 1", "meta-cognition insight 2"]
  },
  "visualization": "reasoning path visualization (e.g., flowchart)"
}
```

### Creation Tools

#### `create-thinking-model`

Create a new thinking model.

**Parameters:**
- `id` (required): Unique identifier for the model
- `name` (required): Name of the model
- `definition` (required): Concise definition of the model
- `purpose` (required): Main purpose and usage scenarios of the model
- `category` (required): Main category of the model
- `lang` (required, default "zh"): Language of the model, options: ["zh", "en"]
- `subcategories` (optional): List of subcategories for the model
- `tags` (optional): Related tags for the model
- `author` (optional): Model author
- `source` (optional): Model source
- `prompt` (optional): Detailed prompt/role-playing guide
- `example` (optional): Brief example of model usage
- `use_cases` (optional): Use cases for the model
- `interaction` (optional): Guide for interacting with users using this model
- `constraints` (optional): Constraints for using this model
- `popular_science_teaching` (optional): Popular science teaching for the model
- `limitations` (optional): Limitations of the model
- `common_pitfalls` (optional): Common pitfalls when using the model
- `common_problems_solved` (optional): Common problems solved by the model
- Various visualization data (optional): Flowcharts, tables, bar charts, lists, etc.

**Return Value:**
```json
{
  "status": "operation status",
  "message": "operation message",
  "model_id": "created model ID"
}
```

#### `update-thinking-model`

Update any field of an existing thinking model.

**Parameters:**
- `model_id` (required): ID of the model to update
- Other fields to update (optional): Same as create-thinking-model parameters

**Return Value:**
```json
{
  "status": "operation status",
  "message": "operation message",
  "updated_fields": ["updated field 1", "updated field 2"]
}
```

#### `emergent-model-design`

Create a new thinking model by combining existing thinking models.

**Parameters:**
- `source_model_ids` (required): List of source model IDs for combination, minimum 2, maximum 10
- `target_model_id` (required): Unique identifier for the new model
- `target_model_name` (required): Name of the new model
- `design_goal` (required): Design goal and purpose description
- `connection_description` (optional): Description of how source models are combined
- `category` (optional): Main category of the new model
- `lang` (required, default "zh"): Language of the model, options: ["zh", "en"]

**Return Value:**
```json
{
  "status": "operation status",
  "message": "operation message",
  "model_id": "created model ID",
  "emergent_properties": ["emergent property 1", "emergent property 2"],
  "source_models_used": [
    {
      "id": "source model ID",
      "name": "source model name",
      "contribution": "contribution to the new model"
    }
    // ... more source models
  ]
}
```

#### `delete-thinking-model`

Delete unwanted thinking models.

**Parameters:**
- `model_id` (required): ID of the model to delete
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]
- `confirm` (required): Confirm deletion, must be true

**Return Value:**
```json
{
  "status": "operation status",
  "message": "operation message",
  "deleted_model_id": "deleted model ID"
}
```

### System and Learning Tools

#### `get-started-guide`

Get beginner's guide.

**Parameters:**
- `user_objective` (optional, default "explore"): User objective, options: ["explore", "solve_problem", "create_model", "learn_tools"]
- `expertise_level` (optional, default "beginner"): User experience level, options: ["beginner", "intermediate", "advanced"]
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]

**Return Value:**
```json
{
  "welcome_message": "welcome message",
  "system_overview": "system overview",
  "suggested_first_steps": [
    {
      "step": "step description",
      "tool": "recommended tool",
      "example": "usage example"
    }
    // ... more steps
  ],
  "recommended_models": [
    {
      "id": "recommended model ID",
      "name": "recommended model name",
      "purpose": "model purpose"
    }
    // ... more recommended models
  ],
  "learning_path": "learning path suggestions",
  "additional_resources": ["additional resource 1", "additional resource 2"]
}
```

#### `get-server-version`

Get server version and status information.

**Parameters:**
- None

**Return Value:**
```json
{
  "version": "version number",
  "build_date": "build date",
  "api_version": "API version",
  "status": "server status",
  "uptime": uptime in seconds,
  "models_loaded": total number of models loaded
}
```

#### `count-models`

Count the total number of current thinking models.

**Parameters:**
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]

**Return Value:**
```json
{
  "total_count": total number of models,
  "language": "language code",
  "category_counts": {
    "category1": number of models in this category,
    "category2": number of models in this category
    // ... more category statistics
  }
}
```

#### `record-user-feedback`

Record user feedback on thinking model experiences.

**Parameters:**
- `modelIds` (required): Array of IDs for relevant thinking models
- `context` (required): Context or problem description where the model was applied
- `feedbackType` (required): Feedback type, options: ["helpful", "not_helpful", "incorrect", "insightful", "confusing"]
- `comment` (optional): Detailed feedback explanation or comment
- `applicationResult` (optional): Description of model application result
- `suggestedImprovements` (optional): Array of suggested improvements
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]

**Return Value:**
```json
{
  "status": "operation status",
  "message": "operation message",
  "insights": "insights gained from the feedback"
}
```

#### `detect-knowledge-gap`

Detect knowledge gaps in user queries.

**Parameters:**
- `query` (required): User query or question
- `matchThreshold` (optional, default 0.5): Match threshold, values below this are considered knowledge gaps
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]

**Return Value:**
```json
{
  "knowledge_gaps": [
    {
      "concept": "missing concept",
      "match_score": match score,
      "suggested_models": [
        {
          "id": "suggested model ID",
          "name": "suggested model name",
          "relevance": "relevance description"
        }
        // ... more suggested models
      ],
      "learning_resources": ["learning resource 1", "learning resource 2"]
    }
    // ... more knowledge gaps
  ],
  "query_coverage": query coverage,
  "recommendations": ["recommendation 1", "recommendation 2"]
}
```

#### `get-model-usage-stats`

Get usage statistics for thinking models.

**Parameters:**
- `modelId` (required): Unique ID of the thinking model
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]

**Return Value:**
```json
{
  "model_id": "model ID",
  "model_name": "model name",
  "usage_count": usage count,
  "average_rating": average rating,
  "feedback_distribution": {
    "helpful": number of helpful feedback,
    "not_helpful": number of unhelpful feedback,
    "incorrect": number of incorrect feedback,
    "insightful": number of insightful feedback,
    "confusing": number of confusing feedback
  },
  "common_usage_contexts": ["common usage context 1", "common usage context 2"],
  "trend": "usage trend description",
  "related_models_also_used": [
    {
      "id": "related model ID",
      "name": "related model name",
      "co_occurrence_count": co-occurrence count
    }
    // ... more related models
  ]
}
```

#### `analyze-learning-system`

Analyze the status of the thinking model learning system.

**Parameters:**
- `lang` (required, default "zh"): Language code, options: ["zh", "en"]

**Return Value:**
```json
{
  "system_health": {
    "total_feedback_count": total feedback count,
    "knowledge_coverage": knowledge coverage,
    "adaptation_score": adaptation score
  },
  "top_performing_models": [
    {
      "id": "model ID",
      "name": "model name",
      "effectiveness_score": effectiveness score
    }
    // ... more well-performing models
  ],
  "identified_gaps": ["identified gap 1", "identified gap 2"],
  "learning_trends": ["learning trend 1", "learning trend 2"],
  "improvement_suggestions": ["improvement suggestion 1", "improvement suggestion 2"]
}
```

## Use Cases

### Solving Complex Problems

When facing complex problems, the system can recommend multiple thinking models to help you analyze problems from different angles and avoid mental blind spots.

### Improving Thinking Quality

Through structured thinking processes, avoid common cognitive biases and make more rational decisions.

### Learning Thinking Models

The system not only provides definitions of thinking models but also includes detailed teaching content, application examples, and notes to help you master various thinking tools.

### Creating Custom Models

When existing models cannot meet needs, you can create new thinking models or combine existing models to create innovative thinking frameworks.

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

1.  **Normal Start (stdio mode)**
    In the project root directory, run:
    ```bash
    node build/thinking_models_server.js
    ```
    Or use the npm script (if configured in package.json):
    ```bash
    npm run start
    ```

## Configuration Guide

You can integrate the thinking models MCP server into any client that supports the MCP protocol. Here are two different implementation methods:

### Method 1: Running the "Tianji" Server with Local Node.js

This method requires you to install and configure the "Tianji" server code locally and is suitable for scenarios where you need to customize development or modify server code.

```json
{
  "mcpServers": {
    "tianji": { // "Tianji" server name
      "command": "node",
      "args": [
        "e:\\thinking_models_mcp\\build\\thinking_models_server.js" // Replace with your actual path
      ]
    }
  }
  // ... other configurations ...
}
```

### Method 2: Using NPX to Start the Server from a Remote npm Package

This method is simpler, doesn't require local installation of the full code, and directly pulls and runs packages from the npm repository.

```json
{
  "mcpServers": {
    "thinking-models": {
      "command": "npx",
      "args": [
        "--no-cache", // Avoid using cached versions, ensure using the latest version
        "@thinking-models/mcp-server" // npm package name
        // If you need to specify version: "@thinking-models/mcp-server@latest"
      ]
    }
  }
  // ... other configurations ...
}
```

**Command Line Arguments Explanation:**

- **`node`**: Directly use local Node.js to run JavaScript files
- **`npx`**: npm package runner, allows executing commands in npm packages without global or local installation
- **`--no-cache`**: Disable cache, ensure getting the latest version of the package each time, avoiding outdated versions

> **Important Note**: Server data will be automatically saved in the `data` folder of the installation directory. Even if the service restarts, previous data will be retained without additional configuration. It is recommended to use the `--no-cache` parameter to ensure getting the latest version each time, avoiding using outdated features due to cache issues.

### Basic Usage

After the "Tianji" server starts, you can send requests to access thinking model tools through the MCP client. For example:

```json
1. What is the current version number of "Tianji"?
2. How many thinking models does "Tianji" currently have available for me to use?
3. I want to check what types of thinking models are in "Tianji", tell me how many categories there are in total?
4. I encountered XXXX event, but I don't know what to do, please have "Tianji" recommend some thinking models that can help me solve the problem.
```

If configured correctly, the client should be able to call the server and return results.

## Developer Documentation

This section is for developers who want to understand, customize, or extend the thinking model MCP server.

### Development Environment Setup

#### Environment Requirements

- Node.js >= 18.0.0
- npm >= 8.0.0 (or compatible package managers like yarn, pnpm)
- TypeScript 5.x

#### Installing Dependencies (Local Development)

```bash
# Assuming you've already cloned the repository and entered the project directory
npm install
```

#### Development Mode (Local Development)

```bash
# Watch mode, automatically recompile TypeScript files when changed
npm run watch

# In another terminal, start the development server (usually runs compiled files from the build directory)
# You might need a tool like nodemon to automatically restart the server
npm run start:dev # (assuming you've configured this script in package.json)
```

### Code Architecture

#### File Structure (Example)

```
thinking_models_mcp/
├── build/                    # Compiled JavaScript files
├── src/                      # TypeScript source code
│   ├── thinking_models_server.ts  # Main server logic and tool registration
│   ├── types.ts              # TypeScript type definitions
│   ├── utils.ts              # Common utility functions
│   ├── similarity_engine.ts  # Similarity calculation logic
│   ├── reasoning_process.ts  # Reasoning process management
│   ├── learning_capability.ts # Learning system functionality
│   ├── recommendations.ts    # Model recommendation logic
│   └── response_types.ts     # API response type definitions
├── thinking_models_db/       # Thinking model database
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
    *   Processes client requests and routes them to the appropriate tools

2.  **Thinking Model Types (`types.ts`)**
    *   Defines the core `ThinkingModel` interface, describing the model's data structure
    *   Other model-related TypeScript types and interfaces

3.  **Similarity Calculation Engine (`similarity_engine.ts`)**
    *   `calculateQueryMatch`: Calculates the match between user queries and thinking models
    *   `calculateKeywordRelevance`: Calculates the relevance of keyword lists to thinking models

4.  **Reasoning Process Management (`reasoning_process.ts`)**
    *   Used for building, managing, and visualizing structured reasoning paths

5.  **Learning System (`learning_capability.ts`)**
    *   `recordUserFeedback`: Records user feedback on model usage
    *   `detectKnowledgeGap`: Detects knowledge gaps based on user queries and feedback
    *   `adjustModelRecommendations`: Adjusts model recommendations based on learning data

### API Documentation

#### Server API

Server communication modes:

1.  **stdio API**
    *   Communicates with clients through standard input/output.
    *   Follows MCP protocol specifications.
    *   Usually managed automatically by clients (such as Cursor, Claude Desktop).

#### Tool API

Each tool is registered using the `server.tool()` method, containing:
1.  **Tool Name** (string): The name used by clients when calling.
2.  **Tool Description** (string): A brief description of the tool's functionality.
3.  **Parameter Schema** (Zod object): Uses the `zod` library to define the parameters accepted by the tool and their types, descriptions, and constraints.
4.  **Handler Function** (async function): Receives validated parameter objects, executes tool logic, and returns responses that comply with the MCP protocol.

##### Tool Registration Example

```typescript
// filepath: src/thinking_models_server.ts
// ... imports ...

server.tool(
  "get-model-count-by-category", // Tool name
  "Get the number of thinking models in a specified category", // Tool description
  { // Parameter schema (Zod schema)
    category: z.string().describe("Main category of thinking models to query"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("Language code ('zh' or 'en')")
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
      log(`Tool 'get-model-count-by-category' execution error: ${error.message}`);
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

### Extension Guidelines

#### Adding New Tools

1.  In thinking_models_server.ts (or related module files), register your new tool using the `server.tool()` method, as shown in the example above.
2.  Define clear parameter schemas and descriptions.
3.  Implement the tool's handler function, ensuring it includes error handling and logging.
4.  Recompile the project (`npm run build`).

#### Creating New Thinking Models

1.  Create a new `.json` file in the zh (Chinese) or en (English) directory.
2.  The filename is typically the model's ID (for example, `new_decision_matrix.json`).
3.  The file content should conform to the structure of the `ThinkingModel` interface (defined in types.ts). Example:
    ```json
    {
      "id": "new_decision_matrix",
      "name": "New Decision Matrix Model",
      "definition": "A structured method for evaluating options under multiple criteria.",
      "purpose": "Help make rational choices among complex options.",
      "category": "Decision Making",
      "subcategories": ["Multi-criteria Decision"],
      "tags": ["decision", "matrix", "evaluation", "selection"],
      "use_cases": ["Product feature prioritization", "Vendor selection"],
      // ... other fields like popular_science_teaching, limitations, common_pitfalls, visualizations, etc.
    }
    ```
4.  The server will automatically load the new model when it starts, or if file monitoring is enabled, it will also reload when the file is saved.

#### Modifying Recommendation Algorithms

Recommendation logic is mainly located in similarity_engine.ts and recommendations.ts.
-   **`similarity_engine.ts`**: Contains core algorithms for calculating text similarity and keyword relevance. You can adjust these algorithms' weights, techniques used (such as TF-IDF, embedding vectors, etc.) to improve matching precision.
-   **`recommendations.ts`**: Contains functions like `getModelRecommendations` that use the similarity engine's results to generate the final model recommendation list. You can modify the logic here, such as how to combine scores from different sources or how to adjust recommendations based on context.

### Testing

The project typically uses testing frameworks like Jest.

#### Writing Tests

Create test files for your modules or functions in the `tests` directory (for example, `tests/my_tool.test.ts`).

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
  // Actual testing might need more complex mocking to match the MCP SDK context
  return toolDefinition.execute(params, {} as any);
}

describe('My Custom Tool Tests', () => {
  beforeAll(async () => {
    // Load test model data (if needed)
    await loadModels('zh'); // Load Chinese models
  });

  test('get-model-count-by-category should return correct count', async () => {
    const response = await callTool('get-model-count-by-category', { category: 'Decision Making', lang: 'zh' });
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

### Build and Deployment

#### Building the Project

```bash
npm run build
```
This will use `tsc` (TypeScript compiler) to compile `.ts` files from the src directory into JavaScript files in the `build` directory.

#### Deployment Options

**Deploy as a standalone Node.js server**
*   Copy the entire project (or at least the `build` directory, node_modules, package.json, and thinking_models_db) to the server
*   Run the server:
    ```bash
    node build/thinking_models_server.js
    ```
*   Or use process managers like `pm2` to keep the server running:
    ```bash
    npm install -g pm2
    pm2 start build/thinking_models_server.js --name "thinking-models-mcp"
    pm2 save
    ```

### Coding Standards

#### Coding Style

-   Follow a consistent coding style (for example, using Prettier and ESLint).
-   Use TypeScript's strong typing features, avoid using `any` unless absolutely necessary.
-   Write clear, self-explanatory code, and add comments for complex logic.

#### Naming Conventions

-   **Functions and variables**: `camelCase` (e.g., `calculateSimilarity`)
-   **Classes and interfaces**: `PascalCase` (e.g., `ThinkingModel`, `McpServer`)
-   **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_PORT`)
-   **File names**: `snake_case.ts` or `kebab-case.ts` (maintain consistency within the project)

#### Documentation Standards

-   Write JSDoc/TSDoc comments for all public APIs (functions, classes, interfaces).
-   Clearly explain the project's functionality and usage in README and other documentation.
-   Keep documentation in sync with the code.

### Common Development Issues and Troubleshooting

#### 1. Model Files Not Loaded or Loading Errors
-   **Check Paths**: Ensure paths defined in `SUPPORTED_LANGUAGES` are correct relative to the compiled `thinking_models_server.js` file.
-   **JSON Format**: Ensure all model `.json` files are valid JSON and conform to the structure of the `ThinkingModel` interface.
-   **File Permissions**: Ensure the server process has permissions to read the model directory and files.
-   **Logs**: View server startup logs, which usually include error information when loading models.

#### 2. API Request Failure or Tool Not Found
-   **Server Running Status**: Confirm the server has started successfully without errors.
-   **Tool Names**: Confirm the tool name called by the client exactly matches the name registered in the server (case-sensitive).
-   **Parameter Format**: Ensure parameters sent to the tool comply with its Zod schema definition.

#### 3. Inaccurate Similarity Calculation or Recommendations
-   **Model Data Quality**: Fields like `definition`, `purpose`, `tags`, `keywords` are crucial for similarity calculation. Ensure these fields are rich and accurate.
-   **Algorithm Adjustment**: You might need to adjust algorithm parameters or weights in `similarity_engine.ts`.
-   **Learning System**: If the learning system is enabled, check if feedback data is correctly recorded and applied.

#### Best Practices
-   **Logging**: Use the `log()` function (or more sophisticated logging libraries) to record key operations, errors, and debugging information.
-   **Error Handling**: Implement robust error handling in all tool functions and asynchronous operations, and return meaningful error messages to clients.
-   **Modularity**: Organize different functionalities (such as similarity calculation, learning systems, tool implementation) into separate modules.
-   **Configuration Management**: Use environment variables or configuration files for configurable items such as ports and paths.

## License

This project is open-sourced under the MIT License.
