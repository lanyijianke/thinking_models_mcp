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

1. `list-models`: Get a list of all thinking models, with optional category filtering
2. `get-model-info`: Get detailed information or specific fields about a model
3. `search-models`: Search for models by keywords or recommend models for specific problems
4. `get-categories`: Get model category information
5. `get-related-models`: Get related model recommendations
6. `count-models`: Count the total number of models

## Configuration

### Environment Variables

The service supports the following environment variables:

- `OPENROUTER_API_KEY`: OpenRouter API key (for semantic similarity calculation)
- `OPENROUTER_MODEL_NAME`: OpenRouter model name to use, default is "qwen/qwen3-235b-a22b:free"
- `HTTP_REFERER`: (Optional) HTTP Referer header
- `X_TITLE`: (Optional) Application title
- `MODE`: Running mode, can be "stdio" or "rest"
- `PORT`: Port number for REST mode, default is 9593
- `ENDPOINT`: Endpoint path for REST mode, default is "/rest"

## Usage

### Local Execution

```bash
# Install dependencies
npm install

# Set environment variables
export OPENROUTER_API_KEY="your-openrouter-api-key" 
# Optional: Set model
export OPENROUTER_MODEL_NAME="your-chosen-model"

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

### Common Parameters
- `lang`: Language code (`zh` or `en`), defaults to `zh`
- `model_id`: The unique identifier of a thinking model (for specific model operations)

### Tool-specific Parameters
- `list-models`: Optional `category` and `subcategory` for filtering, `limit` for result count
- `get-model-info`: `fields` array to specify which information to return (all, basic, detail, teaching, warnings, visualizations)
- `search-models`: `mode` (keyword or problem), `query` for keyword search, `problem_keywords` for problem-based recommendations

## API Optimization

The API has been optimized by merging several related tools:

1. `list-models` now incorporates functionality from the previous `get-models-by-category`
2. `get-model-info` combines the functionality of `get-model-detail`, `get-model-teaching`, `get-model-warnings`, and `get-model-visualizations`
3. `search-models` integrates both keyword-based search and problem-based recommendation (previously `suggest-models-for-problem`)

These optimizations provide a more consistent and flexible API while reducing code duplication.

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