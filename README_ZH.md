# 思维模型 MCP 服务器

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 项目简介

思维模型 MCP 服务器是一个基于 Model Context Protocol (MCP) 的智能服务，旨在提供全面的思维模型知识库访问。该服务集成了丰富的思维模型数据，包括模型定义、应用场景、分类体系、科普教学内容及使用注意事项等。无论是个人学习、教育培训还是辅助决策，本服务均能提供专业的思维工具支持。

## 核心功能

- **双语支持**：完整支持中文和英文，满足不同用户的语言需求
- **智能搜索**：提供关键词搜索和问题导向的模型推荐
- **分类浏览**：按照科学分类体系组织模型，便于系统学习
- **教学内容**：包含详尽的科普教学资料，帮助理解和应用
- **使用指南**：提供每个模型的局限性和常见误区提醒
- **相关推荐**：智能关联相似或互补的思维模型
- **实时更新**：监控数据文件变化，自动更新模型库内容

## API工具集

| 工具名称 | 功能描述 |
|---------|--------|
| `list-models` | 获取思维模型列表，支持分类筛选 |
| `get-model-info` | 获取模型的详细信息或指定字段 |
| `search-models` | 关键词搜索或基于问题推荐模型 |
| `get-categories` | 获取完整的模型分类体系 |
| `get-related-models` | 获取与特定模型相关的推荐 |
| `count-models` | 统计思维模型库的总数量 |

## 系统配置

### 环境变量

| 环境变量 | 说明 | 默认值 |
|---------|------|-------|
| `VERBOSE_LOGGING` | 启用详细日志记录 | `false` |
| `ENABLE_LOCAL_ALGORITHMS` | 启用本地算法功能 | `false` |
| `MODE` | 运行模式 (stdio/rest) | `stdio` |
| `PORT` | REST模式的端口号 | `9593` |
| `ENDPOINT` | REST模式的端点路径 | `/rest` |

## 部署指南

### 方式一：本地部署

```bash
# 第1步：安装依赖
npm install

# 第2步：编译代码
npm run build

# 第3步：运行服务 (选择一种方式)

# 方式A：标准输入输出模式
node build/thinking_models_server.js

# 方式B：REST API模式
node build/thinking_models_server.js --rest

# 方式C：通过环境变量配置
$env:MODE="rest"
$env:PORT="9593"
$env:VERBOSE_LOGGING="true"
node build/thinking_models_server.js
```

### 方式二：NPX 方式部署

```bash
# 方式A：直接运行（默认 stdio 模式）
npx -y @thinking-models/mcp-server

# 方式B：指定 REST 模式运行
npx -y @thinking-models/mcp-server --rest

# 方式C：带环境变量运行
$env:MODE="rest"; npx -y @thinking-models/mcp-server

# 方式D：全局安装后运行
npm install -g @thinking-models/mcp-server
mcp-server
```

> 提示：通过 NPX 方式部署时，如果是首次运行会自动下载最新版本的包

### 方式三：Docker容器化部署

```bash
# 第1步：构建Docker镜像
docker build -t thinking-models-mcp .

# 第2步：运行Docker容器
docker run -p 9593:9593 -e MODE=rest thinking-models-mcp
```

> 提示：若需持久化存储或自定义数据，可以通过卷挂载方式映射数据目录

### 方式四：通过MCP平台使用

本服务已接入 [MCP.so](https://mcp.so) 平台，您可以直接在该平台上调用，无需自行部署。

## 数据结构

### 数据文件

服务基于JSON格式的思维模型数据库运行：

| 文件名 | 说明 | 位置 |
|-------|------|-----|
| `model.zh.json` | 中文思维模型数据集 | `thinking_models_db` 目录下 |
| `model.en.json` | 英文思维模型数据集 | `thinking_models_db` 目录下 |

### 目录结构

```
thinking_models_mcp/
├── thinking_models_db/    # 思维模型数据库目录
│   ├── zh/               # 中文模型数据文件
│   └── en/               # 英文模型数据文件
├── src/                  # 源代码目录
└── build/                # 编译后的代码目录
```

## API参数说明

### 通用参数

| 参数名 | 类型 | 说明 | 默认值 |
|-------|-----|------|-------|
| `lang` | string | 语言代码 (zh/en) | `zh` |
| `model_id` | string | 思维模型唯一标识符 | - |

### 工具参数详解

#### `list-models` 工具
- `category`: 分类名称，用于过滤结果
- `subcategory`: 子分类名称，用于精确过滤
- `limit`: 返回结果的最大数量

#### `get-model-info` 工具
- `fields`: 信息字段数组，可包含：
  - `all`: 全部信息
  - `basic`: 基本信息
  - `detail`: 详细描述
  - `teaching`: 教学内容
  - `warnings`: 使用注意事项
  - `visualizations`: 可视化资源

#### `search-models` 工具
- `mode`: 搜索模式
  - `keyword`: 关键词搜索
  - `problem`: 问题导向推荐
- `query`: 搜索查询关键词
- `problem_keywords`: 问题描述关键词数组

## 架构优化

本版本对API架构进行了优化，通过合并相似功能减少了冗余：

1. 整合了分类浏览功能，简化模型检索流程
2. 统一了模型信息获取接口，提供灵活的字段选择
3. 合并了搜索和推荐功能，提升了用户体验

## 开发扩展

```bash
# 克隆仓库
git clone https://github.com/lanyijianke/thinking_models_mcp.git
cd thinking_models_mcp

# 安装开发依赖
npm install

# 启动开发模式
npm run dev
```

## 许可证

[MIT](https://opensource.org/licenses/MIT)

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