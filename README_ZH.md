# "天机"——思维模型 MCP 服务器
![alt text](image/tianji.png)

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)
[![MCP Protocol](https://img.shields.io/badge/MCP_Protocol-1.11+-brightgreen.svg)](https://github.com/modelcontextprotocol)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-2.2.0-orange.svg)](https://github.com/yourusername/thinking-models-mcp)
[![Zod](https://img.shields.io/badge/Zod-3.24+-purple.svg)](https://github.com/colinhacks/zod)

> 智能思考的工具箱：将系统性思维方法集成到您的问题解决流程中

## 目录

- [什么是"天机"？](#什么是天机)
- [核心功能](#核心功能)
- [工具概览](#工具概览)
  - [探索类工具](#探索类工具)
  - [问题解决类工具](#问题解决类工具)
  - [创建类工具](#创建类工具)
  - [系统与学习类工具](#系统与学习类工具)
- [工具函数详细参数与返回值](#工具函数详细参数与返回值)
  - [探索类工具](#探索类工具-1)
  - [问题解决类工具](#问题解决类工具-1)
  - [创建类工具](#创建类工具-1)
  - [系统与学习类工具](#系统与学习类工具-1)
- [使用场景](#使用场景)
- [快速开始](#快速开始)
- [配置指南](#配置指南)
- [开发者文档](#开发者文档)
  - [开发环境设置](#开发环境设置)
  - [代码架构](#代码架构)
  - [API文档](#api-文档)
  - [扩展指南](#扩展指南)
  - [测试](#测试)
  - [构建与部署](#构建与部署)
  - [代码规范](#代码规范)
  - [常见开发问题与故障排除](#常见开发问题与故障排除)
- [开源协议](#开源协议)

## 什么是"天机"？

"天机"是一个强大的思维模型 MCP 服务器，它集成了数百种思维模型、框架和方法论，能够帮助用户更系统、更全面地思考问题。通过 MCP (Model Context Protocol) 接口，AI 助手可以访问这些思维工具，将结构化思维方法无缝应用到对话中。"天机"取名源于"天机不可泄露"的古语，寓意着它能帮助用户揭示深层次的思考模式和智慧。



## 核心功能

- **丰富的思维模型库**：包含决策理论、系统思考、概率思维等多个领域的经典思维模型
- **智能模型推荐**：根据问题特征自动推荐最合适的思维模型
- **交互式推理过程**：引导用户进行结构化思考，一步步深入分析问题
- **学习与适应系统**：通过用户反馈持续改进推荐算法
- **模型创建与组合**：允许创建新模型或组合现有模型产生创新思维框架

## 工具概览

### 探索类工具

- **list-models**: 列出所有思维模型或按分类筛选
- **search-models**: 按关键词搜索思维模型
- **get-categories**: 获取所有思维模型分类
- **get-model-info**: 获取思维模型的详细信息
- **get-related-models**: 获取与特定模型相关的其他模型

### 问题解决类工具

- **recommend-models-for-problem**: 基于问题关键词推荐适合的思维模型
- **interactive-reasoning**: 交互式推理过程指导
- **generate-validate-hypotheses**: 为问题生成多个假设并提供验证方法
- **explain-reasoning-process**: 解释模型的推理过程和应用的思维模式

### 创建类工具

- **create-thinking-model**: 创建新的思维模型
- **update-thinking-model**: 更新现有思维模型的任意字段，包括基础信息和可视化数据，无需重新创建整个模型
- **emergent-model-design**: 通过组合现有思维模型创建新的思维模型
- **delete-thinking-model**: 删除不需要的思维模型

### 系统与学习类工具

- **get-started-guide**: 新手入门指南
- **get-server-version**: 获取服务器版本信息
- **count-models**: 统计当前思维模型的总数
- **record-user-feedback**: 记录用户对思维模型使用体验的反馈
- **detect-knowledge-gap**: 检测用户查询中的知识缺口
- **get-model-usage-stats**: 获取思维模型的使用统计数据
- **analyze-learning-system**: 分析思维模型学习系统状况

## 工具函数详细参数与返回值

以下是所有工具函数的详细参数与返回值说明：

### 探索类工具

#### `list-models`

列出所有思维模型或按分类筛选。

**参数：**
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]
- `category` (可选)：主分类名称
- `subcategory` (可选)：子分类名称（需同时提供主分类）
- `limit` (可选，默认值 100)：返回结果数量限制

**返回值：**
```json
{
  "models": [
    {
      "id": "模型ID",
      "name": "模型名称",
      "definition": "模型定义",
      "category": "模型分类"
    }
    // ... 更多模型
  ],
  "total": 查询到的模型总数,
  "filter": "应用的过滤条件"
}
```

#### `search-models`

根据关键词搜索思维模型。

**参数：**
- `query` (必选)：搜索关键词
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]
- `limit` (可选，默认值 10)：返回结果数量限制

**返回值：**
```json
{
  "results": [
    {
      "id": "模型ID",
      "name": "模型名称",
      "definition": "模型定义",
      "purpose": "模型用途",
      "match_score": 匹配分数,
      "match_reasons": ["匹配原因1", "匹配原因2"]
    }
    // ... 更多匹配结果
  ],
  "total": 匹配的模型总数,
  "query": "搜索关键词"
}
```

#### `get-categories`

获取所有思维模型分类信息。

**参数：**
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]

**返回值：**
```json
{
  "categories": [
    {
      "name": "分类名称",
      "count": 该分类下的模型数量,
      "subcategories": [
        {
          "name": "子分类名称",
          "count": 子分类下的模型数量
        }
        // ... 更多子分类
      ]
    }
    // ... 更多分类
  ],
  "total_categories": 总分类数量,
  "total_models": 所有模型总数
}
```

#### `get-model-info`

获取思维模型的详细信息。

**参数：**
- `model_id` (必选)：思维模型的唯一id
- `fields` (可选，默认值 ["basic"])：需要返回的字段，可选值：["all", "basic", "detail", "teaching", "warnings", "visualizations"]
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]

**返回值：**
```json
{
  "id": "模型ID",
  "name": "模型名称",
  "definition": "模型定义",
  "purpose": "模型用途",
  // 根据fields不同，返回不同级别的详细信息
  "category": "模型分类",
  "subcategories": ["子分类1", "子分类2"],
  "application_steps": ["应用步骤1", "应用步骤2"],
  "popular_science_teaching": [
    {
      "concept_name": "概念名称",
      "explanation": "通俗解释"
    }
  ],
  "limitations": [
    {
      "limitation_name": "局限性名称",
      "description": "局限性描述"
    }
  ],
  "common_pitfalls": [
    {
      "pitfall_name": "常见陷阱名称",
      "description": "陷阱描述"
    }
  ],
  // 可视化相关字段（如果请求）
  "visualizations": {
    "flowcharts": [...],
    "tables": [...],
    "bar_charts": [...],
    "lists": [...]
  }
}
```

#### `get-related-models`

获取与特定模型相关的其他模型。

**参数：**
- `model_id` (必选)：思维模型的唯一id
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]
- `limit` (可选，默认值 5)：返回结果数量限制
- `use_enhanced_similarity` (可选，默认值 true)：是否使用增强的相似度评估

**返回值：**
```json
{
  "related_models": [
    {
      "id": "相关模型ID",
      "name": "相关模型名称",
      "similarity_score": 相似度评分,
      "relationship_type": "相关性类型",
      "definition": "模型定义"
    }
    // ... 更多相关模型
  ],
  "source_model": {
    "id": "源模型ID",
    "name": "源模型名称"
  }
}
```

### 问题解决类工具

#### `recommend-models-for-problem`

基于问题关键词推荐适合的思维模型。

**参数：**
- `problem_keywords` (必选)：问题关键词数组
- `problem_context` (可选)：问题的完整上下文描述
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]
- `limit` (可选，默认值 10)：返回结果数量限制
- `use_learning_adjustment` (可选，默认值 true)：是否使用学习系统调整推荐结果

**返回值：**
```json
{
  "models": [
    {
      "id": "模型ID",
      "name": "模型名称",
      "match_score": 匹配分数,
      "match_reasons": ["匹配原因1", "匹配原因2"],
      "definition": "模型定义",
      "purpose": "模型用途",
      "adjustment_reason": "调整原因（如果使用学习调整）"
    }
    // ... 更多推荐模型
  ],
  "learning_adjusted": 是否应用了学习调整,
  "total_models_matched": 匹配的模型总数
}
```

#### `interactive-reasoning`

提供交互式推理过程指导。

**参数：**
- `initialContext` (必选)：初始问题或情境描述
- `reasoningStage` (必选)：当前推理阶段，可选值：["information_gathering", "hypothesis_generation", "hypothesis_testing", "conclusion"]
- `currentPathId` (可选)：当前推理路径ID（如果在现有推理中）
- `requiredInformation` (可选)：需要获取的额外信息数组
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]

**返回值：**
```json
{
  "pathId": "推理路径ID",
  "currentStage": "当前阶段",
  "suggestedActions": [
    "建议动作1",
    "建议动作2"
  ],
  "relevantModels": [
    {
      "id": "相关模型ID",
      "name": "相关模型名称",
      "relevance_reason": "相关原因"
    }
    // ... 更多相关模型
  ],
  "nextStep": {
    "action": "下一步动作",
    "description": "下一步说明"
    // 可能包含其他阶段特定数据
  }
}
```

#### `generate-validate-hypotheses`

为问题生成多个假设并提供验证方法。

**参数：**
- `problem` (必选)：要解决的问题
- `context` (必选)：问题相关的背景信息
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]

**返回值：**
```json
{
  "problem_statement": "问题陈述",
  "hypotheses": [
    {
      "hypothesis": "假设内容",
      "rationale": "形成理由",
      "validation_methods": [
        {
          "method": "验证方法",
          "expected_outcome": "预期结果",
          "resources_needed": "所需资源"
        }
        // ... 更多验证方法
      ],
      "potential_biases": ["潜在偏见1", "潜在偏见2"]
    }
    // ... 更多假设
  ],
  "applicable_thinking_models": [
    {
      "id": "适用模型ID",
      "name": "适用模型名称",
      "relevance": "相关性说明"
    }
    // ... 更多适用模型
  ]
}
```

#### `explain-reasoning-process`

解释模型的推理过程和应用的思维模式。

**参数：**
- `problemDescription` (必选)：问题或情境描述
- `reasoningSteps` (必选)：推理步骤详情数组，每个步骤包含：
  - `description` (必选)：推理步骤描述
  - `modelIds` (可选)：使用的思维模型ID数组
  - `evidence` (可选)：支持证据数组
  - `confidence` (可选，默认值 0.8)：置信度(0-1)
- `conclusion` (必选)：推理结论
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]

**返回值：**
```json
{
  "reasoning_path": {
    "problem": "问题描述",
    "steps": [
      {
        "description": "步骤描述",
        "models_applied": [
          {
            "id": "应用模型ID",
            "name": "应用模型名称",
            "explanation": "模型应用说明"
          }
        ],
        "cognitive_biases_avoided": ["避免的认知偏见1", "避免的认知偏见2"],
        "confidence": 置信度数值
      }
      // ... 更多推理步骤
    ],
    "conclusion": "结论",
    "meta_cognition_insights": ["元认知洞察1", "元认知洞察2"]
  },
  "visualization": "推理路径可视化（如流程图）"
}
```

### 创建类工具

#### `create-thinking-model`

创建新的思维模型。

**参数：**
- `id` (必选)：模型的唯一标识符
- `name` (必选)：模型的名称
- `definition` (必选)：模型的简明定义
- `purpose` (必选)：模型的主要目的和使用场景
- `category` (必选)：模型的主要分类
- `lang` (必选，默认值 "zh")：模型的语言，可选值：["zh", "en"]
- `subcategories` (可选)：模型的子分类列表
- `tags` (可选)：模型的相关标签
- `author` (可选)：模型作者
- `source` (可选)：模型来源
- `prompt` (可选)：详细的提示词/角色扮演指南
- `example` (可选)：模型使用的简短示例
- `use_cases` (可选)：模型的使用案例
- `interaction` (可选)：使用该模型与用户交互的方式指南
- `constraints` (可选)：使用此模型的约束条件
- `popular_science_teaching` (可选)：模型的通俗科学教学
- `limitations` (可选)：模型的局限性
- `common_pitfalls` (可选)：使用模型的常见陷阱
- `common_problems_solved` (可选)：模型解决的常见问题
- 各种可视化数据 (可选)：流程图、表格、条形图、列表等

**返回值：**
```json
{
  "status": "操作状态",
  "message": "操作消息",
  "model_id": "创建的模型ID"
}
```

#### `update-thinking-model`

更新现有思维模型的任意字段。

**参数：**
- `model_id` (必选)：要更新的模型ID
- 其他需要更新的字段 (可选)：与create-thinking-model参数相同

**返回值：**
```json
{
  "status": "操作状态",
  "message": "操作消息",
  "updated_fields": ["更新的字段1", "更新的字段2"]
}
```

#### `emergent-model-design`

通过组合现有思维模型创建新的思维模型。

**参数：**
- `source_model_ids` (必选)：用于组合的源模型ID列表，至少2个，最多10个
- `target_model_id` (必选)：新模型的唯一标识符
- `target_model_name` (必选)：新模型的名称
- `design_goal` (必选)：设计目标和用途描述
- `connection_description` (可选)：描述源模型是如何组合的
- `category` (可选)：新模型的主要分类
- `lang` (必选，默认值 "zh")：模型的语言，可选值：["zh", "en"]

**返回值：**
```json
{
  "status": "操作状态",
  "message": "操作消息",
  "model_id": "创建的模型ID",
  "emergent_properties": ["涌现特性1", "涌现特性2"],
  "source_models_used": [
    {
      "id": "源模型ID",
      "name": "源模型名称",
      "contribution": "对新模型的贡献"
    }
    // ... 更多源模型
  ]
}
```

#### `delete-thinking-model`

删除不需要的思维模型。

**参数：**
- `model_id` (必选)：要删除的模型ID
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]
- `confirm` (必选)：确认删除，必须为true

**返回值：**
```json
{
  "status": "操作状态",
  "message": "操作消息",
  "deleted_model_id": "删除的模型ID"
}
```

### 系统与学习类工具

#### `get-started-guide`

获取新手入门指南。

**参数：**
- `user_objective` (可选，默认值 "explore")：用户目标，可选值：["explore", "solve_problem", "create_model", "learn_tools"]
- `expertise_level` (可选，默认值 "beginner")：用户经验水平，可选值：["beginner", "intermediate", "advanced"]
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]

**返回值：**
```json
{
  "welcome_message": "欢迎信息",
  "system_overview": "系统概述",
  "suggested_first_steps": [
    {
      "step": "步骤描述",
      "tool": "推荐工具",
      "example": "使用示例"
    }
    // ... 更多步骤
  ],
  "recommended_models": [
    {
      "id": "推荐模型ID",
      "name": "推荐模型名称",
      "purpose": "模型用途"
    }
    // ... 更多推荐模型
  ],
  "learning_path": "学习路径建议",
  "additional_resources": ["附加资源1", "附加资源2"]
}
```

#### `get-server-version`

获取服务器版本和状态信息。

**参数：**
- 无

**返回值：**
```json
{
  "version": "版本号",
  "build_date": "构建日期",
  "api_version": "API版本",
  "status": "服务器状态",
  "uptime": 运行时间（秒）,
  "models_loaded": 加载的模型总数
}
```

#### `count-models`

统计当前思维模型的总数。

**参数：**
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]

**返回值：**
```json
{
  "total_count": 模型总数,
  "language": "语言代码",
  "category_counts": {
    "分类1": 该分类下的模型数量,
    "分类2": 该分类下的模型数量
    // ... 更多分类统计
  }
}
```

#### `record-user-feedback`

记录用户对思维模型使用体验的反馈。

**参数：**
- `modelIds` (必选)：相关思维模型的ID数组
- `context` (必选)：应用模型的上下文或问题描述
- `feedbackType` (必选)：反馈类型，可选值：["helpful", "not_helpful", "incorrect", "insightful", "confusing"]
- `comment` (可选)：反馈详细说明或评论
- `applicationResult` (可选)：模型应用结果描述
- `suggestedImprovements` (可选)：建议的改进点数组
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]

**返回值：**
```json
{
  "status": "操作状态",
  "message": "操作消息",
  "insights": "从反馈中获取的见解"
}
```

#### `detect-knowledge-gap`

检测用户查询中的知识缺口。

**参数：**
- `query` (必选)：用户查询或问题
- `matchThreshold` (可选，默认值 0.5)：匹配阈值，低于此值视为知识缺口
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]

**返回值：**
```json
{
  "knowledge_gaps": [
    {
      "concept": "缺失概念",
      "match_score": 匹配分数,
      "suggested_models": [
        {
          "id": "建议模型ID",
          "name": "建议模型名称",
          "relevance": "相关性说明"
        }
        // ... 更多建议模型
      ],
      "learning_resources": ["学习资源1", "学习资源2"]
    }
    // ... 更多知识缺口
  ],
  "query_coverage": 查询覆盖率,
  "recommendations": ["建议1", "建议2"]
}
```

#### `get-model-usage-stats`

获取思维模型的使用统计数据。

**参数：**
- `modelId` (必选)：思维模型的唯一ID
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]

**返回值：**
```json
{
  "model_id": "模型ID",
  "model_name": "模型名称",
  "usage_count": 使用次数,
  "average_rating": 平均评分,
  "feedback_distribution": {
    "helpful": 有帮助的反馈数量,
    "not_helpful": 无帮助的反馈数量,
    "incorrect": 不正确的反馈数量,
    "insightful": 富有洞察力的反馈数量,
    "confusing": 令人困惑的反馈数量
  },
  "common_usage_contexts": ["常见用途上下文1", "常见用途上下文2"],
  "trend": "使用趋势描述",
  "related_models_also_used": [
    {
      "id": "相关模型ID",
      "name": "相关模型名称",
      "co_occurrence_count": 共同出现次数
    }
    // ... 更多相关模型
  ]
}
```

#### `analyze-learning-system`

分析思维模型学习系统的总体状况。

**参数：**
- `lang` (必选，默认值 "zh")：语言代码，可选值：["zh", "en"]

**返回值：**
```json
{
  "system_health": {
    "total_feedback_count": 总反馈数量,
    "knowledge_coverage": 知识覆盖率,
    "adaptation_score": 适应性评分
  },
  "top_performing_models": [
    {
      "id": "模型ID",
      "name": "模型名称",
      "effectiveness_score": 有效性评分
    }
    // ... 更多表现良好的模型
  ],
  "identified_gaps": ["已识别缺口1", "已识别缺口2"],
  "learning_trends": ["学习趋势1", "学习趋势2"],
  "improvement_suggestions": ["改进建议1", "改进建议2"]
}
```

## 使用场景

### 解决复杂问题

面对复杂问题时，系统可推荐多种思维模型，帮助您从不同角度分析问题，避免思维盲点。

### 提升思考质量

通过结构化思考流程，避免常见认知偏差，做出更理性的决策。

### 学习思维模型

系统不仅提供思维模型的定义，还包含详细的教学内容、应用示例和注意事项，帮助您掌握各种思维工具。

### 创建自定义模型

当现有模型无法满足需求时，您可以创建新的思维模型，或者组合现有模型创造创新的思考框架。

## 快速开始

### 安装 (本地开发)

如果您想在本地运行和开发此项目：

```bash
git clone https://github.com/yourusername/thinking-models-mcp.git # 替换为您的仓库地址
cd thinking_models_mcp
npm install
npm run build
```

### 启动服务器 (本地开发)

1.  **普通启动 (stdio模式)**
    在项目根目录下运行：
    ```bash
    node build/thinking_models_server.js
    ```
    或者使用 npm 脚本 (如果已在 package.json 中配置):
    ```bash
    npm run start
    ```

## 配置指南

您可以将思维模型MCP服务器集成到任何支持MCP协议的客户端中。以下是两种不同的实现方式：

### 方式一：使用本地Node.js运行"天机"服务器

此方式需要您在本地安装和配置"天机"服务器代码，适合需要自定义开发或修改服务器代码的场景。

```json
{
  "mcpServers": {
    "tianji": { // "天机"服务器名称
      "command": "node",
      "args": [
        "e:\\thinking_models_mcp\\build\\thinking_models_server.js" // 替换为您的实际路径
      ]
    }
  }
  // ... 其他配置 ...
}
```

### 方式二：使用 NPX 从 npm 远程包启动服务器

此方式更简单，无需本地安装完整代码，直接从npm仓库拉取包并运行。

```json
{
  "mcpServers": {
    "thinking-models": {
      "command": "npx",
      "args": [
        "--no-cache", // 避免使用缓存版本，确保使用最新版本
        "@thinking-models/mcp-server" // npm包名
        // 如果需要指定版本: "@thinking-models/mcp-server@latest"
      ]
    }
  }
  // ... 其他配置 ...
}
```




**命令行参数说明：**

- **`node`**: 直接使用本地Node.js运行JavaScript文件
- **`npx`**: npm包运行器，允许执行npm包中的命令，无需全局或本地安装
- **`--no-cache`**: 禁用缓存，确保每次都获取最新版本的包，避免使用过时版本

> **重要提示**：服务器数据会自动保存在安装目录的 `data` 文件夹中。即使服务重启，之前的数据也会保留，无需额外配置。建议使用 `--no-cache` 参数确保每次都获取最新版本，避免因缓存问题导致使用过时的功能。


### 基本使用

"天机"服务器启动后，可以通过 MCP 客户端发送请求访问思维模型工具。例如：

```json
1. "天机"当前版本号是多少？
2. "天机"当前一共有多少个思维模型可供我使用？
3. 我想调阅"天机"中某个类型的思维模型，告诉我目前一共有多少种分类？
4. 我遇到了XXXX事件，但我不知道该怎么办，请"天机"推荐几个可以帮助我解决问题的思维模型。
```

如果配置正确，客户端应该能够调用服务器并返回结果。

## 开发者文档

本部分面向希望理解、定制或扩展思维模型 MCP 服务器的开发者。

### 开发环境设置

#### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0 (或兼容的包管理器如 yarn, pnpm)
- TypeScript 5.x

#### 安装依赖 (本地开发)

```bash
# 假设您已克隆仓库并进入项目目录
npm install
```

#### 开发模式 (本地开发)

```bash
# 监视模式，TypeScript文件更改时自动重新编译
npm run watch

# 在另一个终端启动开发服务器 (通常会从 build 目录运行编译后的文件)
# 您可能需要一个类似 nodemon 的工具来自动重启服务器
npm run start:dev # (假设您在 package.json 中配置了此脚本)
```

### 代码架构

#### 文件结构 (示例)

```
thinking_models_mcp/
├── build/                    # 编译输出的JavaScript文件
├── src/                      # TypeScript源代码
│   ├── thinking_models_server.ts  # 主服务器逻辑和工具注册
│   ├── types.ts              # TypeScript类型定义
│   ├── utils.ts              # 通用工具函数
│   ├── similarity_engine.ts  # 相似度计算逻辑
│   ├── reasoning_process.ts  # 推理过程管理
│   ├── learning_capability.ts # 学习系统功能
│   ├── recommendations.ts    # 模型推荐逻辑
│   └── response_types.ts     # API响应类型定义
├── thinking_models_db/       # 思维模型数据库
│   ├── zh/                   # 中文模型 (JSON文件)
│   └── en/                   # 英文模型 (JSON文件)
├── package.json              # 项目依赖和脚本
├── tsconfig.json             # TypeScript编译器配置
└── README.md                 # 本文档
```

#### 核心模块

1.  **服务器核心 (thinking_models_server.ts)**
    *   初始化 MCP 服务器实例 (`McpServer` from `@modelcontextprotocol/sdk`)
    *   注册所有可用的工具，定义其参数模式 (使用 `zod`) 和处理函数
    *   加载和管理思维模型数据
    *   处理客户端请求并路由到相应的工具

2.  **思维模型类型 (`types.ts`)**
    *   定义核心的 `ThinkingModel` 接口，描述模型的数据结构
    *   其他与模型相关的TypeScript类型和接口

3.  **相似度计算引擎 (`similarity_engine.ts`)**
    *   `calculateQueryMatch`: 计算用户查询与思维模型之间的匹配度
    *   `calculateKeywordRelevance`: 计算关键词列表与思维模型的相关性

4.  **推理过程管理 (`reasoning_process.ts`)**
    *   用于构建、管理和可视化结构化的推理路径

5.  **学习系统 (`learning_capability.ts`)**
    *   `recordUserFeedback`: 记录用户对模型使用的反馈
    *   `detectKnowledgeGap`: 基于用户查询和反馈检测知识缺口
    *   `adjustModelRecommendations`: 根据学习数据调整模型推荐

### API 文档

#### 服务器 API

服务器通信模式：

1.  **stdio API**
    *   通过标准输入/输出与客户端通信。
    *   遵循 MCP 协议规范。
    *   通常由客户端（如Cursor, Claude桌面版）自动管理。

#### 工具 API

每个工具都通过 `server.tool()` 方法注册，包含：
1.  **工具名称** (字符串): 客户端调用时使用的名称。
2.  **工具描述** (字符串): 工具功能的简要说明。
3.  **参数模式** (Zod 对象): 使用 `zod`库定义工具接受的参数及其类型、描述和约束。
4.  **处理函数** (异步函数): 接收经过验证的参数对象，执行工具逻辑，并返回符合MCP协议的响应。

##### 工具注册示例

```typescript
// filepath: src/thinking_models_server.ts
// ... imports ...

server.tool(
  "get-model-count-by-category", // 工具名称
  "获取指定分类下的思维模型数量", // 工具描述
  { // 参数模式 (Zod schema)
    category: z.string().describe("要查询的思维模型主分类"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码 ('zh' 或 'en')")
  },
  async ({ category, lang }) => { // 处理函数
    try {
      const modelsInBuffer = MODELS[lang] || []; // MODELS是已加载模型的缓存
      const count = modelsInBuffer.filter(m => m.category === category).length;
      log(`工具 'get-model-count-by-category' 被调用: category=${category}, lang=${lang}, count=${count}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ category, lang, count }, null, 2)
        }]
      };
    } catch (error: any) {
      log(`工具 'get-model-count-by-category' 执行错误: ${error.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "获取模型数量失败", message: error.message }, null, 2)
        }]
      };
    }
  }
);
```

### 扩展指南

#### 添加新工具

1.  在 thinking_models_server.ts (或相关模块文件) 中，使用 `server.tool()` 方法注册您的新工具，如上例所示。
2.  定义清晰的参数模式和描述。
3.  实现工具的处理函数，确保包含错误处理和日志记录。
4.  重新编译项目 (`npm run build`)。

#### 创建新的思维模型

1.  在 zh (中文) 或 en (英文) 目录下创建一个新的 `.json` 文件。
2.  文件名通常是模型的ID (例如 `new_decision_matrix.json`)。
3.  文件内容应符合 `ThinkingModel` 接口的结构 (定义在 types.ts)。示例：
    ```json
    {
      "id": "new_decision_matrix",
      "name": "新决策矩阵模型",
      "definition": "一个用于在多个标准下评估选项的结构化方法。",
      "purpose": "帮助在复杂选项中做出理性选择。",
      "category": "决策制定",
      "subcategories": ["多标准决策"],
      "tags": ["决策", "矩阵", "评估", "选择"],
      "use_cases": ["产品功能优先级排序", "供应商选择"],
      // ... 其他字段如 popular_science_teaching, limitations, common_pitfalls, visualizations 等
    }
    ```
4.  服务器在启动时会自动加载新模型，或者如果文件监控已启用，在文件保存后也会重新加载。

#### 修改推荐算法

推荐逻辑主要位于 similarity_engine.ts 和 recommendations.ts。
-   **`similarity_engine.ts`**: 包含计算文本相似度和关键词相关性的核心算法。您可以调整这些算法的权重、使用的技术（如TF-IDF、嵌入向量等）来改进匹配精度。
-   **`recommendations.ts`**: 包含 `getModelRecommendations` 等函数，这些函数使用相似度引擎的结果来生成最终的模型推荐列表。您可以修改这里的逻辑，例如如何组合不同来源的评分，或者如何根据上下文调整推荐。

### 测试

项目通常使用像 Jest 这样的测试框架。

#### 编写测试

在 `tests` 目录下为您的模块或函数创建测试文件 (例如 `tests/my_tool.test.ts`)。

```typescript
// tests/example_tool.test.ts
import { server, loadModels } from '../src/thinking_models_server'; // 假设导出了server实例
import { ThinkingModel } from '../src/types';

// 模拟MCP客户端请求
async function callTool(toolName: string, params: any) {
  const toolDefinition = server.capabilities.tools[toolName];
  if (!toolDefinition || !toolDefinition.execute) {
    throw new Error(`Tool ${toolName} not found or not executable`);
  }
  // 实际测试中可能需要更复杂的模拟来匹配MCP SDK的上下文
  return toolDefinition.execute(params, {} as any);
}

describe('My Custom Tool Tests', () => {
  beforeAll(async () => {
    // 加载测试用的模型数据 (如果需要)
    await loadModels('zh'); // 加载中文模型
  });

  test('get-model-count-by-category should return correct count', async () => {
    const response = await callTool('get-model-count-by-category', { category: '决策制定', lang: 'zh' });
    const result = JSON.parse(response.content[0].text);
    expect(result.category).toBe('决策制定');
    expect(result.count).toBeGreaterThanOrEqual(0); // 具体数量取决于您的测试数据
  });
});
```

#### 运行测试

在 package.json 中配置测试脚本：
```json
{
  "scripts": {
    "test": "jest"
  }
}
```
然后运行：
```bash
npm test
```

### 构建与部署

#### 构建项目

```bash
npm run build
```
这将使用 `tsc` (TypeScript编译器) 将 src 目录下的 `.ts` 文件编译成 JavaScript 文件到 `build` 目录。

#### 部署选项

**作为独立的 Node.js 服务器部署**
*   将整个项目（或至少 `build` 目录、node_modules、package.json 和 thinking_models_db）复制到服务器
*   运行服务器：
    ```bash
    node build/thinking_models_server.js
    ```
*   或使用进程管理器如 `pm2` 来保持服务器运行：
    ```bash
    npm install -g pm2
    pm2 start build/thinking_models_server.js --name "thinking-models-mcp"
    pm2 save
    ```

### 代码规范

#### 编码风格

-   遵循一致的编码风格 (例如，使用 Prettier 和 ESLint)。
-   使用 TypeScript 的强类型特性，避免使用 `any`除非绝对必要。
-   编写清晰、自解释的代码，并为复杂逻辑添加注释。

#### 命名约定

-   **函数和变量**: `camelCase` (例如 `calculateSimilarity`)
-   **类和接口**: `PascalCase` (例如 `ThinkingModel`, `McpServer`)
-   **常量**: `UPPER_SNAKE_CASE` (例如 `DEFAULT_PORT`)
-   **文件名**: `snake_case.ts` 或 `kebab-case.ts` (保持项目内一致)

#### 文档标准

-   为所有公共API（函数、类、接口）编写 JSDoc/TSDoc 注释。
-   在 README 和其他文档中清晰地解释项目的功能和用法。
-   保持文档与代码同步。

### 常见开发问题与故障排除

#### 1. 模型文件未加载或加载错误
-   **检查路径**：确认 `SUPPORTED_LANGUAGES` 中定义的路径相对于编译后的 `thinking_models_server.js` 文件是正确的。
-   **JSON 格式**：确保所有模型 `.json` 文件都是有效的JSON，并且符合 `ThinkingModel` 接口的结构。
-   **文件权限**：确保服务器进程有读取模型目录和文件的权限。
-   **日志**：查看服务器启动时的日志输出，通常会包含加载模型时的错误信息。

#### 2. API 请求失败或工具未找到
-   **服务器运行状态**：确认服务器已成功启动并且没有错误。
-   **工具名称**：确认客户端调用的工具名称与服务器中注册的名称完全一致（区分大小写）。
-   **参数格式**：确保发送给工具的参数符合其Zod模式定义。

#### 3. 相似度计算或推荐不准确
-   **模型数据质量**：模型的 `definition`, `purpose`, `tags`, `keywords` 等字段对相似度计算至关重要。确保这些字段内容丰富且准确。
-   **算法调整**：可能需要调整 `similarity_engine.ts` 中的算法参数或权重。
-   **学习系统**：如果启用了学习系统，检查反馈数据是否正确记录和应用。

#### 最佳实践
-   **日志记录**: 使用 `log()` 函数（或更完善的日志库）记录关键操作、错误和调试信息。
-   **错误处理**: 在所有工具函数和异步操作中实现健壮的错误处理，并向客户端返回有意义的错误信息。
-   **模块化**: 将不同的功能（如相似度计算、学习系统、工具实现）组织到独立的模块中。
-   **配置管理**: 对端口、路径等可配置项使用环境变量或配置文件。

## 开源协议

本项目使用 MIT 协议开源。
