# Thinking Models MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Introduction

The Thinking Models MCP Server is an intelligent service based on the Model Context Protocol (MCP) that provides comprehensive access to a knowledge base of thinking models. This service integrates rich thinking model data, including model definitions, application scenarios, classification systems, educational content, and usage guidelines. Whether for personal learning, educational training, or decision support, this service offers professional thinking tools.

## Core Features

- **Bilingual Support**: Full support for both Chinese and English to meet diverse linguistic needs
- **Intelligent Search**: Keyword-based search and problem-oriented model recommendations
- **Category Browsing**: Models organized by scientific classification systems for systematic learning
- **Educational Content**: Detailed educational materials to help understand and apply models
- **Usage Guidelines**: Limitations and common pitfalls for each model
- **Related Recommendations**: Smart association of similar or complementary thinking models
- **Real-time Updates**: Monitoring of data file changes with automatic model library updates

## API Toolkit

| Tool Name | Description |
|-----------|-------------|
| `list-models` | Get a list of thinking models with category filtering |
| `get-model-info` | Get detailed information or specific fields about a model |
| `search-models` | Search by keywords or recommend models for specific problems |
| `get-categories` | Get the complete model classification system |
| `get-related-models` | Get recommendations related to a specific model |
| `count-models` | Count the total number of thinking models |

## System Configuration

### Environment Variables

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `VERBOSE_LOGGING` | Enable detailed logging | `false` |
| `ENABLE_LOCAL_ALGORITHMS` | Enable local algorithm features | `false` |
| `MODE` | Running mode (stdio/rest) | `stdio` |
| `PORT` | Port number for REST mode | `9593` |
| `ENDPOINT` | Endpoint path for REST mode | `/rest` |

## Deployment Guide

### Option 1: Local Deployment

```bash
# Step 1: Install dependencies
npm install

# Step 2: Build the code
npm run build

# Step 3: Run the service (choose one method)

# Method A: Standard I/O mode
node build/thinking_models_server.js

# Method B: REST API mode
node build/thinking_models_server.js --rest

# Method C: Configure via environment variables
# For Windows PowerShell
$env:MODE="rest"
$env:PORT="9593"
$env:VERBOSE_LOGGING="true"
node build/thinking_models_server.js

# For Linux/Mac
export MODE="rest"
export PORT="9593"
export VERBOSE_LOGGING="true"
node build/thinking_models_server.js
```

### Option 2: NPX Deployment

```bash
# Method A: Direct execution (stdio mode by default)
npx -y @thinking-models/mcp-server

# Method B: Run in REST mode
npx -y @thinking-models/mcp-server --rest

# Method C: Run with environment variables
# For Windows PowerShell
$env:MODE="rest"; npx -y @thinking-models/mcp-server

# For Linux/Mac
MODE=rest npx -y @thinking-models/mcp-server

# Method D: Global installation
npm install -g @thinking-models/mcp-server
mcp-server
```

> Tip: When using NPX deployment, the latest version of the package will be automatically downloaded on first run

### Option 3: Docker Container Deployment

```bash
# Step 1: Build Docker image
docker build -t thinking-models-mcp .

# Step 2: Run Docker container
docker run -p 9593:9593 -e MODE=rest thinking-models-mcp
```

> Tip: For persistent storage or custom data, you can map data directories using volume mounts

### Option 4: Using via MCP Platform

This service is integrated with the [MCP.so](https://mcp.so) platform, allowing you to use it directly without self-deployment.

## Data Structure

### Data Files

The service runs on JSON-formatted thinking model databases:

| File Name | Description | Location |
|-----------|-------------|----------|
| `model.zh.json` | Chinese thinking model dataset | Under `thinking_models_db` directory |
| `model.en.json` | English thinking model dataset | Under `thinking_models_db` directory |

### Directory Structure

```
thinking_models_mcp/
├── thinking_models_db/    # Thinking model database directory
│   ├── zh/               # Chinese model data files
│   └── en/               # English model data files
├── src/                  # Source code directory
└── build/                # Compiled code directory
```

## API Parameters

### Common Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `lang` | string | Language code (zh/en) | `zh` |
| `model_id` | string | Unique identifier of a thinking model | - |

### Tool-specific Parameters

#### `list-models` Tool
- `category`: Category name for filtering results
- `subcategory`: Subcategory name for precise filtering
- `limit`: Maximum number of results to return

#### `get-model-info` Tool
- `fields`: Array of information fields, can include:
  - `all`: All information
  - `basic`: Basic information
  - `detail`: Detailed description
  - `teaching`: Educational content
  - `warnings`: Usage guidelines
  - `visualizations`: Visual resources

#### `search-models` Tool
- `mode`: Search mode
  - `keyword`: Keyword-based search
  - `problem`: Problem-oriented recommendations
- `query`: Search query keywords
- `problem_keywords`: Array of problem description keywords

## Architecture Optimization

This version optimizes the API architecture by merging similar functionalities to reduce redundancy:

1. Integrated category browsing functionality for simplified model retrieval
2. Unified model information retrieval interface with flexible field selection
3. Combined search and recommendation features for enhanced user experience

## Development

```bash
# Clone the repository
git clone https://github.com/lanyijianke/thinking_models_mcp.git
cd thinking_models_mcp

# Install development dependencies
npm install

# Start development mode
npm run dev
```

## License

[MIT](https://opensource.org/licenses/MIT)