# Thinking Models MCP Server

This is a Model Context Protocol (MCP) based service for querying thinking models. It provides a rich collection of thinking model data, including model definitions, purposes, categories, popular science teaching content, usage notes, and more.

## Features

- Supports both Chinese and English
- Provides model search and category browsing
- Includes popular science teaching content
- Provides usage notes (limitations and common pitfalls)
- Supports related model recommendations
- Real-time monitoring of data file updates

## Available Tools

1. `list-models`: Get a list of all thinking models
2. `get-model-detail`: Get detailed information about a specific model
3. `search-models`: Search for thinking models by keyword
4. `get-model-teaching`: Get popular science teaching content for a model
5. `get-model-warnings`: Get usage notes for a model (limitations and common pitfalls)
6. `get-categories`: Get model category information
7. `get-models-by-category`: Get models by category
8. `get-related-models`: Get related model recommendations
9. `count-models`: Count the total number of models

## Usage

### Local Execution

```bash
# Install dependencies
npm install

# Build
npm run build

# Run with stdio interface (default)
node build/thinking_models_server.js

# Run with REST interface
node build/thinking_models_server.js --rest
# or
MODE=rest PORT=9593 node build/thinking_models_server.js
```

### Docker Deployment

```bash
# Build image
docker build -t thinking-models-mcp .

# Run container
docker run -p 9593:9593 -e MODE=rest thinking-models-mcp
```

### Using with MCP.so

This service can be used directly through [MCP.so](https://mcp.so).

## Data Files

The service relies on two JSON data files:
- `model.zh.json`: Chinese thinking model data
- `model.en.json`: English thinking model data

These files should be placed in the service's running directory under the `thinking_models_db` folder.

## API Parameters

Most tools accept the following parameters:
- `lang`: Language code (`zh` or `en`), defaults to `zh`
- `model_id`: The unique identifier of a thinking model

## Development

To extend or modify this service:

```bash
# Clone the repository
git clone https://github.com/lanyijianke/thinking_models_mcp.git
cd thinking_models_mcp

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## License

MIT