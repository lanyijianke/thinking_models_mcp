# 思维模型 MCP 服务器

这是一个基于 Model Context Protocol (MCP) 的思维模型查询服务。它提供了丰富的思维模型数据，包括模型定义、用途、分类、科普教学内容、使用注意事项等。

## 功能特点

- 支持中英双语
- 提供模型搜索、分类浏览
- 包含科普教学内容
- 提供使用注意事项（局限性和常见误区）
- 支持相关模型推荐
- 实时监控数据文件更新

## 可用工具

1. `list-models`: 获取思维模型列表，支持按分类过滤
2. `get-model-info`: 获取模型的详细信息或特定字段
3. `search-models`: 根据关键词搜索模型或针对特定问题推荐模型
4. `get-categories`: 获取模型分类信息
5. `get-related-models`: 获取相关模型推荐
6. `count-models`: 统计模型总数

## 配置

### 环境变量

服务支持以下环境变量配置：

- `OPENROUTER_API_KEY`: OpenRouter API 密钥（用于语义相似度计算）
- `OPENROUTER_MODEL_NAME`: 使用的 OpenRouter 模型名称，默认为 "qwen/qwen3-235b-a22b:free"
- `HTTP_REFERER`: (可选) HTTP 请求的 Referer 头
- `X_TITLE`: (可选) 应用程序标题
- `MODE`: 运行模式，可以是 "stdio" 或 "rest"
- `PORT`: REST 模式的端口号，默认为 9593
- `ENDPOINT`: REST 模式的端点路径，默认为 "/rest"

## 使用方法

### 本地运行

```bash
# 安装依赖
npm install

# 设置环境变量
export OPENROUTER_API_KEY="你的OpenRouter API密钥"
# 可选：设置模型
export OPENROUTER_MODEL_NAME="你选择的模型"

# 构建
npm run build

# 默认使用stdio接口运行
node build/thinking_models_server.js

# 使用REST接口运行
node build/thinking_models_server.js --rest
# 或者
MODE=rest PORT=9593 node build/thinking_models_server.js
```

### Docker 部署

```bash
# 构建镜像
docker build -t thinking-models-mcp .

# 运行容器
docker run -p 9593:9593 -e MODE=rest thinking-models-mcp
```

### 通过 MCP.so 使用

可以通过 [MCP.so](https://mcp.so) 直接使用本服务。

## 数据文件

服务依赖两个 JSON 数据文件：
- `model.zh.json`: 中文思维模型数据
- `model.en.json`: 英文思维模型数据

这些文件应放在服务运行目录下的 `thinking_models_db` 文件夹中。

## API 参数

### 通用参数
- `lang`: 语言代码（'zh' 或 'en'），默认为 'zh'
- `model_id`: 思维模型的唯一标识符（用于特定模型操作）

### 工具特定参数
- `list-models`: 可选 `category` 和 `subcategory` 用于过滤，`limit` 控制结果数量
- `get-model-info`: `fields` 数组指定要返回的信息（all全部, basic基本信息, detail详情, teaching教学内容, warnings注意事项, visualizations可视化）
- `search-models`: `mode`（keyword关键词或problem问题），`query` 用于关键词搜索，`problem_keywords` 用于基于问题的推荐

## API 优化

API 已通过合并相关工具进行了优化：

1. `list-models` 现在整合了原有 `get-models-by-category` 的功能
2. `get-model-info` 合并了 `get-model-detail`、`get-model-teaching`、`get-model-warnings` 和 `get-model-visualizations` 的功能
3. `search-models` 集成了基于关键词的搜索和基于问题的推荐功能（原 `suggest-models-for-problem`）

这些优化提供了更一致、更灵活的 API，同时减少了代码重复。

## 开发指南

要扩展或修改此服务：

```bash
# 克隆仓库
git clone https://github.com/lanyijianke/thinking_models_mcp.git
cd thinking_models_mcp

# 安装依赖
npm install

# 开发模式运行
npm run dev
```

## 许可证

MIT