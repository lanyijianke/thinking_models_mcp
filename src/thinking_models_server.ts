#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RestServerTransport } from "@chatmcp/sdk/server/rest.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { watch } from "fs";
import { fileURLToPath } from "url";
import { calculateSemanticSimilarity } from "./semantic_similarity_local.js";

// 兼容ESM的__dirname（修正Windows路径问题）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 支持的语言及对应文件目录
const SUPPORTED_LANGUAGES = {
  zh: "thinking_models_db/zh", // 指向中文模型目录
  en: "thinking_models_db/en"  // 指向英文模型目录
} as const;

// 类型定义
type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// 定义可视化数据的具体类型
interface FlowchartDslData {
  dsl: string; 
  // 其他流图特定配置
}

interface BarChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    // 其他图表库（如 Chart.js）支持的属性
  }>;
}

interface TableData {
  headers: string[];
  rows: Array<Array<string | number | boolean>>; 
}

interface ListData {
  items: Array<{
    text: string;
    subItems?: ListData['items']; 
  }>;
}

interface ComparisonTableData {
  criteria: string[]; 
  items: Array<{
    name: string; 
    values: Array<string | number | boolean>; 
    // 其他特定属性
  }>;
}

interface ThinkingModel {
  id: string;
  name: string;
  definition?: string;
  purpose?: string;
  category?: string;
  subcategories?: string[];
  tags?: string[];
  use_cases?: string[];
  common_problems_solved?: Array<{
    problem_description: string;
    keywords: string[];
    guiding_questions?: string[];
  }>;
  visualizations?: Array<{
    title: string;
    type: "flowchart_dsl" | "bar_chart_data" | "table_data" | "list_items" | "comparison_table";
    data: FlowchartDslData | BarChartData | TableData | ListData | ComparisonTableData; // 使用联合类型
    description?: string;
  }>;
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
    const langDir = path.resolve(__dirname, "..", SUPPORTED_LANGUAGES[l]);
    MODELS[l] = []; // 清空旧数据以便重新加载
    try {
      log(`开始加载语言 '${l}' 从目录 ${langDir} ...`);
      const files = await fs.readdir(langDir);
      let loadedCount = 0;
      let totalSizeKb = 0;

      for (const file of files) {
        if (path.extname(file).toLowerCase() === ".json") {
          const filePath = path.join(langDir, file);
          try {
            const content = await fs.readFile(filePath, "utf-8");
            const model = JSON.parse(content) as ThinkingModel; // 假设每个文件是一个模型对象
            MODELS[l].push(model);
            loadedCount++;
            totalSizeKb += (await fs.stat(filePath)).size / 1024;
          } catch (e: any) {
            log(`加载或解析模型文件 ${filePath} 失败: ${e.message}`);
          }
        }
      }
      log(`语言 '${l}' 加载完成，共 ${loadedCount} 个模型, 总大小: ${totalSizeKb.toFixed(2)}KB`);
    } catch (e: any) {
      log(`加载语言 '${l}' 的模型目录 ${langDir} 失败: ${e.message}`);
      MODELS[l] = []; // 确保出错时数据为空
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

log('注意: 已移除OpenRouter依赖，使用本地算法计算相似度和相关性');
log('语义相似度和模型推荐功能将使用基于词汇匹配的简化算法');

// 监控模型文件变化
for (const [lang, dirPath] of Object.entries(SUPPORTED_LANGUAGES)) {
  const langDir = path.resolve(__dirname, "..", dirPath);
  try {
    // 确保目录存在
    await fs.access(langDir);
    watch(langDir, { recursive: false }, async (eventType, filename) => {
      if (filename && path.extname(filename).toLowerCase() === ".json") {
        log(`${langDir}/${filename} 发生变化，重新加载语言 '${lang}'...`);
        await loadModels(lang as SupportedLanguage);
      }
    });
    log(`正在监控目录: ${langDir}`);
  } catch (e: any) {
    log(`模型目录 ${langDir} 不存在或无法访问，跳过监控`);
  }
}

// 扩展的 list-models 工具实现 - 合并 list-models 和 get-models-by-category
server.tool(
  "list-models",
  "获取指定语言的思维模型列表，支持按分类过滤",
  {
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
    category: z.string().optional().describe("主分类名称（可选）"),
    subcategory: z.string().optional().describe("子分类名称（可选，需同时提供主分类）"),
    limit: z.number().optional().default(100).describe("返回结果数量限制，默认为100")
  },
  async ({ lang, category, subcategory, limit }) => {
    try {
      if (subcategory && !category) {
        return {
          content: [{ 
            type: "text",
            text: JSON.stringify({ error: "提供子分类时必须同时提供主分类" }, null, 2)
          }]
        };
      }
      
      let models = [...MODELS[lang]];
      let filterDesc = "";
      
      // 根据分类过滤
      if (category) {
        filterDesc = `分类 '${category}'`;
        models = models.filter(m => m.category === category);
        
        // 根据子分类进一步过滤
        if (subcategory) {
          filterDesc += ` 和子分类 '${subcategory}'`;
          models = models.filter(m => m.subcategories?.includes(subcategory));
        }
      }
      
      // 映射到简要信息
      const result = models
        .slice(0, limit)
        .map(m => ({
          id: m.id,
          name: m.name,
          definition: m.definition || "",
          purpose: m.purpose || "",
          category: m.category || "",
          subcategories: m.subcategories || []
        }));
      
      log(`获取模型列表${filterDesc ? `（按${filterDesc}过滤）` : ""}，找到 ${models.length} 个模型，返回 ${result.length} 个结果`);
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
          text: JSON.stringify({ error: "服务异常", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 注册工具: search_models
// 修改 search-models 工具实现
server.tool(
  "search-models",
  "在指定语言的思维模型中搜索或基于问题关键词推荐模型",
  {
    mode: z.enum(["keyword", "problem"]).default("keyword").describe("搜索模式：'keyword'(关键词搜索) 或 'problem'(问题关键词推荐)"),
    query: z.string().optional().describe("搜索关键词(用于keyword模式)"),
    problem_keywords: z.array(z.string()).optional().describe("问题关键词数组(用于problem模式)"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
    limit: z.number().optional().default(10).describe("返回结果数量限制，默认为10")
  },
  async ({ mode, query, problem_keywords, lang, limit }) => {
    try {
      log(`开始在 ${lang} 语言中以 ${mode} 模式搜索模型`);
      
      if (mode === "keyword" && !query) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "关键词搜索模式下，query 参数不能为空" }, null, 2)
          }]
        };
      }
      
      if (mode === "problem" && (!problem_keywords || problem_keywords.length === 0)) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "问题关键词推荐模式下，problem_keywords 参数不能为空" }, null, 2)
          }]
        };
      }
      
      const results: Array<any> = [];
      
      // 关键词搜索模式
      if (mode === "keyword" && query) {
        const keyword_lower = query.toLowerCase();
        
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
          
          // 新增字段的搜索逻辑
          if (m.common_problems_solved?.some(
            problem => problem.problem_description.toLowerCase().includes(keyword_lower) ||
                       problem.keywords.some(k => k.toLowerCase().includes(keyword_lower))
          )) {
            match_reasons.push("能解决的问题或关键词");
          }
          
          if (m.visualizations?.some(
            viz => viz.title.toLowerCase().includes(keyword_lower) ||
                   (viz.description && viz.description.toLowerCase().includes(keyword_lower))
          )) {
            match_reasons.push("可视化标题或描述");
          }
          
          if (match_reasons.length > 0) {
            results.push({
              id: m.id,
              name: m.name,
              definition: m.definition || "",
              purpose: m.purpose || "",
              match_reasons
            });
          }
        }
      }
      // 问题关键词推荐模式
      else if (mode === "problem" && problem_keywords) {
        const keywordsLower = problem_keywords.map(k => k.toLowerCase());
        
        for (const model of MODELS[lang]) {
          let score = 0;
          const reasons: string[] = [];
          
          // 匹配 common_problems_solved.keywords
          if (model.common_problems_solved) {
            for (const prob of model.common_problems_solved) {
              const matched = keywordsLower.filter(k => prob.keywords.map(x => x.toLowerCase()).includes(k));
              if (matched.length > 0) {
                score += matched.length * 3;
                reasons.push(`问题关键词匹配: ${matched.join(", ")}`);
              }
              
              // 匹配 problem_description
              for (const k of keywordsLower) {
                if (prob.problem_description.toLowerCase().includes(k)) {
                  score += 2;
                  reasons.push(`问题描述包含: ${k}`);
                }
              }
            }
          }
          
          // 匹配 name
          for (const k of keywordsLower) {
            if (model.name.toLowerCase().includes(k)) {
              score += 2;
              reasons.push(`模型名称包含: ${k}`);
            }
          }
          
          // 匹配 tags
          if (model.tags) {
            const matched = keywordsLower.filter(k => model.tags!.map(x => x.toLowerCase()).includes(k));
            if (matched.length > 0) {
              score += matched.length * 2;
              reasons.push(`标签匹配: ${matched.join(", ")}`);
            }
          }
          
          // 匹配 definition
          if (model.definition) {
            for (const k of keywordsLower) {
              if (model.definition.toLowerCase().includes(k)) {
                score += 1;
                reasons.push(`核心定义包含: ${k}`);
              }
            }
          }
          
          if (score > 0) {
            results.push({
              id: model.id,
              name: model.name,
              definition: model.definition || "",
              score,
              reasons
            });
          }
        }
        
        // 按评分排序
        results.sort((a, b) => b.score - a.score);
      }
      
      // 限制返回结果数量
      const limitedResults = results.slice(0, limit);
      
      log(`搜索完成，找到 ${results.length} 个匹配的模型，返回 ${limitedResults.length} 个结果`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(limitedResults, null, 2)
        }]
      };
    } catch (e: any) {
      log(`搜索模型时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "服务异常", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 统一的 get-model-info 工具实现 - 合并 get-model-detail、get-model-teaching、get-model-warnings 和 get-model-visualizations
server.tool(
  "get-model-info",
  "获取思维模型的详细信息或特定字段",
  {
    model_id: z.string().describe("思维模型的唯一id"),
    fields: z.array(z.enum(["all", "basic", "detail", "teaching", "warnings", "visualizations"])).optional().default(["basic"]).describe("需要返回的字段，如 'all'(全部), 'basic'(基本信息), 'detail'(详细信息), 'teaching'(教学内容), 'warnings'(注意事项), 'visualizations'(可视化)"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
  },
  async ({ model_id, fields, lang }) => {
    try {
      log(`获取模型 ID: ${model_id} 的信息，请求的字段: ${fields.join(', ')}`);
      const model = MODELS[lang].find(m => m.id === model_id);
      
      if (!model) {
        log(`未找到模型 ID: ${model_id}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "未找到该模型" }, null, 2)
          }]
        };
      }
      
      const includeAll = fields.includes("all");
      const result: Record<string, any> = {};
      
      // 基本信息（默认始终包含）
      if (includeAll || fields.includes("basic")) {
        result.id = model.id;
        result.name = model.name;
        result.category = model.category;
        result.subcategories = model.subcategories || [];
        result.tags = model.tags || [];
      }
      
      // 详细信息
      if (includeAll || fields.includes("detail")) {
        result.detail = {
          definition: model.definition || "",
          purpose: model.purpose || "",
          use_cases: model.use_cases || [],
        };
      }
      
      // 教学内容
      if (includeAll || fields.includes("teaching")) {
        result.teaching = model.popular_science_teaching || [];
      }
      
      // 使用注意事项（包含局限性和常见误区）
      if (includeAll || fields.includes("warnings")) {
        result.warnings = {
          limitations: model.limitations || [],
          common_pitfalls: model.common_pitfalls || []
        };
      }
      
      // 可视化数据
      if (includeAll || fields.includes("visualizations")) {
        result.visualizations = model.visualizations || [];
      }
      
      // 能解决的问题
      if (includeAll) {
        result.common_problems_solved = model.common_problems_solved || [];
      }
      
      log(`成功返回模型信息，包含字段: ${Object.keys(result).join(', ')}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (e: any) {
      log(`获取模型信息时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "服务异常", message: e.message }, null, 2)
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

// 引入本地推荐系统
import { getLocalRecommendations } from './local_recommendations.js';

// 修改 get-related-models 工具实现 - 使用大语言模型直接进行推荐
server.tool(  "get-related-models",
  "获取相关思维模型推荐",
  {
    model_id: z.string().describe("思维模型的唯一id"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
    use_llm: z.boolean().optional().default(true).describe("是否使用本地优化算法进行相关性评估（如果为false则回退到基础规则算法）")
  },  
  async ({ model_id, lang, use_llm }) => {
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

      const candidateModels = MODELS[lang].filter(m => m.id !== model_id);
        // 如果不使用LLM或候选模型过多（避免token超限），使用传统方法
      if (!use_llm || candidateModels.length > 50) {
        log(`使用传统权重算法计算相关模型`);
        const traditionalData = await getRelatedModelsTraditionalData(source_model, candidateModels, lang);
        return {
          content: [{ 
            type: "text",
            text: JSON.stringify(traditionalData, null, 2)
          }]
        };
      }      // 使用本地算法推荐相关模型
      log(`使用本地推荐算法为「${source_model.name}」生成相关思维模型推荐`);
      
      // 调用本地推荐系统获取推荐结果
      const recommendations = await getLocalRecommendations(
        source_model, 
        candidateModels, 
        lang
      );
      
      // 如果获取到推荐结果，直接返回
      if (recommendations && Array.isArray(recommendations) && recommendations.length > 0) {
        log(`本地推荐系统成功生成了${recommendations.length}个相关模型推荐`);
        return {
          content: [{ 
            type: "text",
            text: JSON.stringify(recommendations, null, 2)
          }]
        };      } else {
        // 如果未获取到推荐结果，回退到传统算法
        log(`未能从本地推荐系统获取有效推荐，回退到传统算法`);
        const traditionalData = await getRelatedModelsTraditionalData(source_model, candidateModels, lang);
        return {
          content: [{ 
            type: "text",
            text: JSON.stringify(traditionalData, null, 2)
          }]
        };
      }
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

// 传统基于权重的相关模型获取方法 - 返回处理过的数据格式用于 get-related-models 内部
async function getRelatedModelsTraditionalData(source_model: ThinkingModel, candidateModels: ThinkingModel[], lang: SupportedLanguage) {
  // 提取源模型特征
  const source_tags = new Set(source_model.tags || []);
  const source_category = source_model.category || "";
  const source_subcats = new Set(source_model.subcategories || []);
  const source_use_cases = new Set(source_model.use_cases || []);
  const source_problem_keywords_set = new Set(
    source_model.common_problems_solved?.flatMap(p => p.keywords.map(k => k.toLowerCase())) || []
  );
  const source_problem_descriptions_block = source_model.common_problems_solved
    ?.map(p => p.problem_description)
    .filter(desc => desc && desc.trim() !== "")
    .join("\\n---\\n");

  const relatedPromises = candidateModels.map(async m => {
    let score = 0;
    const reasons: string[] = [];

    // 1. 分类相关度（权重最高）
    if (m.category === source_category && source_category !== "") {
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

    // 5. 解决的共同问题关键词相关度
    const target_problem_keywords = (m.common_problems_solved?.flatMap(p => p.keywords.map(k => k.toLowerCase())) || []);
    const common_problem_keywords = target_problem_keywords
      .filter(keyword => source_problem_keywords_set.has(keyword));
    if (common_problem_keywords.length > 0) {
      score += common_problem_keywords.length * 1.5; // 给予一定权重
      reasons.push(`解决相似问题的关键词：${common_problem_keywords.join(", ")}`);
    }
      // 6. 解决的共同问题描述语义相似度 (本地评估)
    const target_problem_descriptions_block = m.common_problems_solved
      ?.map(p => p.problem_description)
      .filter(desc => desc && desc.trim() !== "")
      .join("\\n---\\n");

    if (source_problem_descriptions_block && target_problem_descriptions_block) {
      const semanticSimilarityScore = await calculateSemanticSimilarity(
        source_problem_descriptions_block,
        target_problem_descriptions_block
      );
      if (semanticSimilarityScore > 0.4) {
        const similarityContribution = semanticSimilarityScore * 3.0;
        score += similarityContribution;
        reasons.push(`解决的问题主题相似 (相似度: ${semanticSimilarityScore.toFixed(2)})`);
      }
    }

    if (score <= 0) return null;

    return {
      id: m.id,
      name: m.name,
      definition: m.definition || "",
      purpose: m.purpose || "",
      relevance_score: score,
      reasons
    };
  });

  const relatedWithNulls = await Promise.all(relatedPromises);
  const related = relatedWithNulls
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5);
  log(`传统算法找到 ${related.length} 个相关模型`);
  
  // 返回处理好的数据，而不是完整的响应对象
  return related;
}

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