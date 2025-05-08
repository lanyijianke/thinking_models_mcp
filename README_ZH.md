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

1. `list-models`: 获取所有思维模型列表
2. `get-model-detail`: 获取模型详细信息
3. `search-models`: 搜索思维模型
4. `get-model-teaching`: 获取模型的科普教学内容
5. `get-model-warnings`: 获取模型的使用注意事项
6. `get-categories`: 获取模型分类信息
7. `get-models-by-category`: 按分类获取模型
8. `get-related-models`: 获取相关模型推荐
9. `count-models`: 统计模型总数

## 使用方法

### 本地运行

```bash
# 安装依赖
npm install

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

大多数工具接受以下参数：
- `lang`: 语言代码（'zh' 或 'en'），默认为 'zh'
- `model_id`: 思维模型的唯一标识符

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