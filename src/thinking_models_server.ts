#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RestServerTransport } from "@chatmcp/sdk/server/rest.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { watch } from "fs";
import { fileURLToPath } from "url";

// 兼容ESM的__dirname（修正Windows路径问题）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 支持的语言及对应文件
const SUPPORTED_LANGUAGES = {
  zh: "thinking_models_db/model.zh.json",
  en: "thinking_models_db/model.en.json"
} as const;

// 类型定义
type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

interface ThinkingModel {
  id: string;
  name: string;
  definition?: string;
  purpose?: string;
  category?: string;
  subcategories?: string[];
  tags?: string[];
  use_cases?: string[];
  popular_science_teaching?: Array<{
    concept_name: string;
    explanation: string;
  }>;
  limitations?: Array<{
    limitation_name: string;
    description: string;
  }>;
  common_pitfalls?: Array<{
    pitfall_name: string;
    description: string;
  }>;
}

// 模型数据缓存
const MODELS: Record<SupportedLanguage, ThinkingModel[]> = {
  zh: [],
  en: []
};

// 日志工具
function log(...args: any[]) {
  console.error(new Date().toISOString(), ...args);
}

// 加载模型数据
async function loadModels(lang?: SupportedLanguage) {
  const langsToLoad = lang ? [lang] : (Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]);
  
  for (const l of langsToLoad) {
    // 修正为相对于代码目录的路径
    const filePath = path.resolve(__dirname, "..", SUPPORTED_LANGUAGES[l]);
    try {
      log(`开始加载 ${filePath} ...`);
      const content = await fs.readFile(filePath, "utf-8");
      MODELS[l] = JSON.parse(content);
      log(`${filePath} 加载成功，共 ${MODELS[l].length} 个模型, 文件大小: ${(await fs.stat(filePath)).size / 1024}KB`);
    } catch (e: any) {
      log(`加载 ${filePath} 失败: ${e.message}`);
      MODELS[l] = [];
    }
  }
}

// 创建 MCP Server 实例
const server = new McpServer({
  name: "thinking_models",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// 初始加载所有语言的模型
await loadModels();

// 监控模型文件变化
for (const [lang, fileName] of Object.entries(SUPPORTED_LANGUAGES)) {
  // 修正为相对于代码目录的路径
  const filePath = path.resolve(__dirname, "..", fileName);
  try {
    await fs.access(filePath);
    watch(filePath, async (eventType) => {
      if (eventType === "change") {
        log(`${filePath} 发生变化，重新加载...`);
        await loadModels(lang as SupportedLanguage);
      }
    });
  } catch {
    log(`模型文件 ${filePath} 不存在，跳过watch`);
  }
}

// 注册工具: list_models
// 修改 list-models 工具实现
server.tool(
  "list-models",
  "获取指定语言的所有思维模型简要信息",
  {
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
  },
  async ({ lang }) => {
    try {
      log(`开始获取 ${lang} 语言的思维模型列表...`);
      const result = MODELS[lang].map(m => ({
        id: m.id,
        name: m.name,
        definition: m.definition || "",
        purpose: m.purpose || ""
      }));
      log(`成功返回 ${result.length} 个 ${lang} 语言的模型简要信息`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (e: any) {
      log(`获取模型列表时出错: ${e.message}`);
      return {
        content: [{ 
          type: "text",
          text: "[]"
        }]
      };
    }
  }
);

// 注册工具: get_model_detail
// 修改 get-model-detail 工具实现
server.tool(
  "get-model-detail",
  "获取指定语言的思维模型详细信息",
  {
    model_id: z.string().describe("思维模型的唯一id"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
  },
  async ({ model_id, lang }) => {
    try {
      log(`正在查找 ${lang} 语言的模型 ID: ${model_id}`);
      const model = MODELS[lang].find(m => m.id === model_id);
      
      if (model) {
        log(`找到模型 '${model.name}'，标签: ${model.tags?.join(", ") || "无"}`);
        return {
          content: [{ 
            type: "text",
            text: JSON.stringify(model, null, 2)
          }]
        };
      }
      
      log(`在 ${lang} 语言中未找到模型 ID: ${model_id}`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify({ error: "未找到该模型" }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`获取模型详情时出错: ${e.message}`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify({ error: "服务异常" }, null, 2)
        }]
      };
    }
  }
);

// 注册工具: search_models
// 修改 search-models 工具实现
server.tool(
  "search-models",
  "在指定语言的思维模型中搜索",
  {
    keyword: z.string().describe("搜索关键词"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
  },
  async ({ keyword, lang }) => {
    try {
      log(`开始在 ${lang} 语言中搜索关键词: '${keyword}'`);
      const keyword_lower = keyword.toLowerCase();
      const result: Array<ThinkingModel & { match_reasons: string[] }> = [];

      for (const m of MODELS[lang]) {
        const match_reasons: string[] = [];

        // 基本信息匹配
        if (m.name.toLowerCase().includes(keyword_lower)) {
          match_reasons.push("模型名称");
        }
        if (m.definition?.toLowerCase().includes(keyword_lower)) {
          match_reasons.push("核心定义");
        }
        if (m.tags?.some(tag => tag.toLowerCase().includes(keyword_lower))) {
          match_reasons.push("标签");
        }

        // 科普教学内容匹配
        if (m.popular_science_teaching?.some(
          teaching => teaching.concept_name.toLowerCase().includes(keyword_lower) ||
                     teaching.explanation.toLowerCase().includes(keyword_lower)
        )) {
          match_reasons.push("科普教学内容");
        }

        // 局限性匹配
        if (m.limitations?.some(
          limitation => limitation.limitation_name.toLowerCase().includes(keyword_lower) ||
                       limitation.description.toLowerCase().includes(keyword_lower)
        )) {
          match_reasons.push("局限性说明");
        }

        // 常见误区匹配
        if (m.common_pitfalls?.some(
          pitfall => pitfall.pitfall_name.toLowerCase().includes(keyword_lower) ||
                    pitfall.description.toLowerCase().includes(keyword_lower)
        )) {
          match_reasons.push("常见误区");
        }

        if (match_reasons.length > 0) {
          result.push({
            ...m,
            match_reasons
          });
        }
      }

      log(`在 ${lang} 语言中搜索关键词 '${keyword}' 完成，找到 ${result.length} 个匹配的模型`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (e: any) {
      log(`搜索模型时出错: ${e.message}`);
      return {
        content: [{ 
          type: "text",
          text: "[]"
        }]
      };
    }
  }
);

// 注册工具: get_model_teaching
// 修改 get-model-teaching 工具实现
server.tool(
  "get-model-teaching",
  "获取思维模型的流行科普教学内容",
  {
    model_id: z.string().describe("思维模型的唯一id"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
  },
  async ({ model_id, lang }) => {
    try {
      log(`获取模型 ID: ${model_id} 的流行科普教学内容`);
      const model = MODELS[lang].find(m => m.id === model_id);

      if (model) {
        const teaching_content = {
          id: model.id,
          name: model.name,
          popular_science_teaching: model.popular_science_teaching || []
        };
        log(`找到 ${teaching_content.popular_science_teaching.length} 个科普教学内容`);
        return {
          content: [{ 
            type: "text",
            text: JSON.stringify(teaching_content, null, 2)
          }]
        };
      }

      log(`未找到模型 ID: ${model_id}`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify({ error: "未找到该模型" }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`获取模型科普教学内容时出错: ${e.message}`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify({ error: "服务异常" }, null, 2)
        }]
      };
    }
  }
);

// 注册工具: get_model_warnings
// 修改 get-model-warnings 工具实现
server.tool(
  "get-model-warnings",
  "获取思维模型的使用注意事项（包含局限性和常见误区）",
  {
    model_id: z.string().describe("思维模型的唯一id"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
  },
  async ({ model_id, lang }) => {
    try {
      log(`获取模型 ID: ${model_id} 的使用注意事项`);
      const model = MODELS[lang].find(m => m.id === model_id);

      if (model) {
        const warnings = {
          id: model.id,
          name: model.name,
          limitations: model.limitations || [],
          common_pitfalls: model.common_pitfalls || []
        };
        log(`找到 ${warnings.limitations.length} 个局限性和 ${warnings.common_pitfalls.length} 个常见误区`);
        return {
          content: [{ 
            type: "text",
            text: JSON.stringify(warnings, null, 2)
          }]
        };
      }

      log(`未找到模型 ID: ${model_id}`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify({ error: "未找到该模型" }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`获取模型使用注意事项时出错: ${e.message}`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify({ error: "服务异常" }, null, 2)
        }]
      };
    }
  }
);

// 修改 get-categories 工具实现
server.tool(
  "get-categories",
  "获取所有思维模型的分类信息",
  {
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
  },
  async ({ lang }) => {
    try {
      const categories: Record<string, Set<string>> = {};
      
      for (const model of MODELS[lang]) {
        const category = model.category || "未分类";
        if (!categories[category]) {
          categories[category] = new Set<string>();
        }

        const subcats = model.subcategories || [];
        subcats.forEach(subcat => categories[category].add(subcat));
      }

      // 将 Set 转换为数组以便 JSON 序列化
      const result = Object.fromEntries(
        Object.entries(categories).map(([cat, subcats]) => [cat, Array.from(subcats).sort()])
      );

      log(`成功获取分类信息：${Object.keys(result).length} 个主分类`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (e: any) {
      log(`获取分类信息时出错: ${e.message}`);
      return {
        content: [{ 
          type: "text",
          text: "{}"
        }]
      };
    }
  }
);

// 修改 get-models-by-category 工具实现
server.tool(
  "get-models-by-category",
  "按分类获取思维模型",
  {
    category: z.string().describe("主分类名称"),
    subcategory: z.string().optional().describe("子分类名称（可选）"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
  },
  async ({ category, subcategory, lang }) => {
    try {
      log(`开始获取分类 '${category}' ${subcategory ? `和子分类 '${subcategory}'` : ''} 下的模型...`);
      
      const result = MODELS[lang]
        .filter(m => 
          m.category === category && 
          (subcategory === undefined || m.subcategories?.includes(subcategory))
        )
        .map(m => ({
          id: m.id,
          name: m.name,
          definition: m.definition || "",
          purpose: m.purpose || ""
        }));

      log(`在分类 '${category}' 下找到 ${result.length} 个模型`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (e: any) {
      log(`按分类获取模型时出错: ${e.message}`);
      return {
        content: [{ 
          type: "text",
          text: "[]"
        }]
      };
    }
  }
);

// 修改 get-related-models 工具实现
server.tool(
  "get-related-models",
  "基于分类和标签获取相关模型推荐",
  {
    model_id: z.string().describe("思维模型的唯一id"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
  },
  async ({ model_id, lang }) => {
    try {
      // 查找源模型
      const source_model = MODELS[lang].find(m => m.id === model_id);
      
      if (!source_model) {
        log(`未找到模型 ID: ${model_id}`);
        return {
          content: [{ 
            type: "text",
            text: "[]"
          }]
        };
      }

      // 提取源模型特征
      const source_tags = new Set(source_model.tags || []);
      const source_category = source_model.category || "";
      const source_subcats = new Set(source_model.subcategories || []);
      const source_use_cases = new Set(source_model.use_cases || []);

      // 计算相关度并收集推荐
      const related = MODELS[lang]
        .filter(m => m.id !== model_id) // 排除源模型
        .map(m => {
          let score = 0;
          const reasons: string[] = [];

          // 1. 分类相关度（权重最高）
          if (m.category === source_category) {
            score += 3;
            reasons.push(`同属于「${source_category}」分类`);
          }

          // 2. 子分类相关度
          const common_subcats = (m.subcategories || [])
            .filter(subcat => source_subcats.has(subcat));
          if (common_subcats.length > 0) {
            score += common_subcats.length;
            reasons.push(`共同的子分类：${common_subcats.join(", ")}`);
          }

          // 3. 标签相关度
          const common_tags = (m.tags || [])
            .filter(tag => source_tags.has(tag));
          if (common_tags.length > 0) {
            score += common_tags.length * 2;
            reasons.push(`共同的标签：${common_tags.join(", ")}`);
          }

          // 4. 使用场景相关度
          const common_use_cases = (m.use_cases || [])
            .filter(use_case => source_use_cases.has(use_case));
          if (common_use_cases.length > 0) {
            score += common_use_cases.length;
            reasons.push(`适用于相同场景：${common_use_cases.join(", ")}`);
          }

          return {
            id: m.id,
            name: m.name,
            definition: m.definition || "",
            purpose: m.purpose || "",
            relevance_score: score,
            reasons
          };
        })
        .filter(m => m.relevance_score > 0)
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 5);

      log(`找到 ${related.length} 个相关模型推荐`);
      if (related.length > 0) {
        log(`最相关的模型是 '${related[0].name}'，相关度分数：${related[0].relevance_score}`);
      }

      return {
        content: [{ 
          type: "text",
          text: JSON.stringify(related, null, 2)
        }]
      };
    } catch (e: any) {
      log(`获取相关模型推荐时出错: ${e.message}`);
      return {
        content: [{ 
          type: "text",
          text: "[]"
        }]
      };
    }
  }
);

// 修改 count-models 工具实现
server.tool(
  "count-models",
  "统计当前思维模型的总数",
  {
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
  },
  async ({ lang }) => {
    try {
      const count = MODELS[lang].length;
      log(`当前语言 '${lang}' 下共有 ${count} 个思维模型`);
      return {
        content: [{ 
          type: "text",
          text: count.toString()
        }]
      };
    } catch (e: any) {
      log(`统计思维模型总数时出错: ${e.message}`);
      return {
        content: [{ 
          type: "text",
          text: "0"
        }]
      };
    }
  }
);

// 主程序入口
async function main() {
  // 支持通过命令行参数或环境变量切换模式
  const mode = process.env.MODE || (process.argv.includes("--rest") ? "rest" : "stdio");
  const port = process.env.PORT ? Number(process.env.PORT) : 9593;
  const endpoint = process.env.ENDPOINT || "/rest";
  
  try {
    log("思维模型 MCP Server 初始化中...");
    
    if (mode === "rest") {
      const transport = new RestServerTransport({ 
        port, 
        endpoint
        // 移除了不支持的 cors 配置
      });
      await server.connect(transport);
      await transport.startServer();
      log(`思维模型 MCP Server 正在通过 REST 运行，端口: ${port}，endpoint: ${endpoint}`);
      return;
    }
    
    // 默认 stdio
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log("思维模型 MCP Server 正在通过 stdio 运行");
  } catch (error) {
    log("主程序致命错误:", error);
    process.exit(1);
  }
}

// 导出 server 实例，便于测试和扩展
export { server, loadModels };

// 立即执行主函数
main().catch((error) => {
  log("主程序致命错误:", error);
  process.exit(1);
});