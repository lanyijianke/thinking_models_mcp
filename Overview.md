# Thinking Models MCP Server Overview

## What is Thinking Models MCP Server?
Thinking Models MCP Server is a Model Context Protocol (MCP) based service for querying thinking models. It provides a comprehensive collection of thinking model data, including model definitions, purposes, categories, popular science teaching content, usage notes, and more. This service enables users to easily access and manage various thinking model resources.



## What are the key features of Thinking Models MCP Server?
- **Bilingual Support**: Complete Chinese and English data support
- **Comprehensive Search**: Keyword search and category browsing functionality
- **Rich Educational Content**: Includes popular science teaching materials
- **Usage Guidelines**: Detailed usage notes and common pitfalls warnings
- **Smart Recommendations**: Related model recommendation system
- **Real-time Updates**: Live monitoring and updates of data files

## What are the use cases of Thinking Models MCP Server?
1. **Education and Training**
   - Building thinking model knowledge bases
   - Developing cognitive training courses
   - Designing educational tools

2. **Knowledge Management Systems**
   - Integrating thinking model services
   - Establishing organizational knowledge bases
   - Supporting decision analysis systems

3. **Personal Growth**
   - Systematic learning of thinking models
   - Improving cognitive decision-making
   - Developing critical thinking skills

4. **Research and Development**
   - Thinking model application research
   - Knowledge graph construction
   - Intelligent recommendation system development

## FAQ

### How do I access the thinking model data?
Data files are stored in the `thinking_models_db` directory:
- `model.zh.json`: Chinese thinking model data
- `model.en.json`: English thinking model data

### What query tools are available?
The system provides 9 core tools:
- List model queries
- Model detail retrieval
- Keyword search
- Teaching content access
- Usage notes queries
- Category information retrieval
- Category-based model queries
- Related model recommendations
- Model count statistics

### How do I switch languages?
Specify the language code via the `lang` parameter when calling the API:
- `zh`: Chinese (default)
- `en`: English

### Does it support custom deployment?
Yes, multiple deployment options are available:
- Local deployment (stdio/REST)
- Docker container deployment
- MCP.so platform integration

### How do I start development?
1. Clone the repository
2. Install dependencies
3. Run in development mode
4. Extend and modify as needed
