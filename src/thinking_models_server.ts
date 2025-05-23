#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { watch } from "fs";
import { fileURLToPath } from "url";
import { calculateSemanticSimilarity } from "./semantic_similarity_local.js";
import { log } from "./utils.js";
import { ThinkingModel } from "./types.js";
import { 
  calculateKeywordRelevance, 
  calculateQueryMatch
} from "./similarity_engine.js";
import { 
  getModelRecommendations,
  RecommendationMode
} from "./recommendations.js";
import {
  createApiResponse,
  createErrorResponse,
  toBaseModelInfo,
  ModelSearchResult,
  ModelRecommendation
} from "./response_types.js";
import {
  ReasoningPath,
  ReasoningStep,
  createReasoningPath,
  addReasoningStep,
  setReasoningConclusion,
  formatReasoningPath,
  visualizeReasoningPath
} from "./reasoning_process.js";
import {
  loadLearningSystemState,
  recordUserFeedback,
  detectKnowledgeGap,
  getModelUsageStats,
  getKnowledgeGaps,
  getModelFeedbackHistory,
  analyzeModelUsage,
  adjustModelRecommendations,
  FeedbackType,
  KnowledgeGap
} from "./learning_capability.js";

// 兼容ESM的__dirname（修正Windows路径问题）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从package.json文件中获取版本号
 * @returns {Promise<string>} 版本号
 */
async function getPackageVersion(): Promise<string> {
  try {
    const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    return packageJson.version || '未知版本';
  } catch (error) {
    log(`无法获取package.json版本信息: ${error instanceof Error ? error.message : String(error)}`);
    return '未知版本';
  }
}

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

// 模型数据缓存
const MODELS: Record<SupportedLanguage, ThinkingModel[]> = {
  zh: [],
  en: []
};

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
const packageVersion = await getPackageVersion();
log(`启动思维模型MCP服务器，版本: ${packageVersion}`);

const server = new McpServer({
  name: "thinking_models",
  version: packageVersion,
  capabilities: {
    resources: {},
    tools: {},
  },
});

// 初始加载所有语言的模型
await loadModels();

// 加载学习系统状态
try {
  await loadLearningSystemState();
  log("学习系统状态已加载");
} catch (err: any) {
  log(`加载学习系统状态失败: ${err.message}`);
}


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
// 重构 search-models 工具实现，专注于文本搜索功能
server.tool(
  "search-models",
  "在指定语言的思维模型中根据关键词进行文本搜索",
  {
    query: z.string().describe("搜索关键词"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
    limit: z.number().optional().default(10).describe("返回结果数量限制，默认为10")
  },
  async ({ query, lang, limit }) => {
    try {
      log(`开始在 ${lang} 语言中搜索关键词: "${query}"`);
      
      if (!query || query.trim() === "") {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "搜索关键词不能为空" }, null, 2)
          }]
        };
      }
      
      const results: Array<ModelSearchResult> = [];
      
      // 对每个模型应用我们的查询匹配算法
      for (const model of MODELS[lang]) {
        const { score, reasons } = calculateQueryMatch(model, query);
        
        if (score > 0) {
          results.push({
            id: model.id,
            name: model.name,
            definition: model.definition || "",
            purpose: model.purpose || "",
            match_score: score,
            match_reasons: reasons
          });
        }
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

// 新增 recommend-models-for-problem 工具实现，专门处理问题推荐
server.tool(
  "recommend-models-for-problem",
  "基于问题关键词推荐适合解决特定问题的思维模型",
  {
    problem_keywords: z.array(z.string()).min(1).describe("问题关键词数组"),
    problem_context: z.string().optional().describe("问题的完整上下文描述"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
    limit: z.number().optional().default(10).describe("返回结果数量限制，默认为10"),
    use_learning_adjustment: z.boolean().optional().default(true).describe("是否使用学习系统调整推荐结果")
  },
  async ({ problem_keywords, problem_context, lang, limit, use_learning_adjustment }) => {
    try {
      log(`开始在 ${lang} 语言中基于问题关键词推荐模型`);
      
      if (!problem_keywords || problem_keywords.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "问题关键词不能为空" }, null, 2)
          }]
        };
      }
      
      const results: Array<ModelSearchResult & { adjustment_reason?: string }> = [];
      
      // 对每个模型计算与问题关键词的相关度
      for (const model of MODELS[lang]) {
        const { score, reasons } = calculateKeywordRelevance(model, problem_keywords);
        
        if (score > 0) {
          results.push({
            id: model.id,
            name: model.name,
            definition: model.definition || "",
            purpose: model.purpose || "",
            match_score: score,
            match_reasons: reasons
          });
        }
      }
      
      // 调整推荐结果（如果启用了学习调整）
      let adjustedResults = [...results];
      if (use_learning_adjustment && problem_context) {
        // 转换为学习调整所需的格式
        const simpleResults = results.map(r => ({ id: r.id, score: r.match_score }));
        
        // 获取学习调整结果
        const adjusted = adjustModelRecommendations(simpleResults, problem_context);
        
        // 合并调整后的分数和原始结果
        adjustedResults = results.map(r => {
          const adjustedItem = adjusted.find(a => a.id === r.id);
          if (adjustedItem && adjustedItem.adjustment_reason) {
            return {
              ...r,
              match_score: adjustedItem.score,
              adjustment_reason: adjustedItem.adjustment_reason
            };
          }
          return r;
        });
      }
      
      // 按评分排序
      adjustedResults.sort((a, b) => b.match_score - a.match_score);
      
      // 限制返回结果数量
      const limitedResults = adjustedResults.slice(0, limit);
      
      log(`推荐完成，找到 ${results.length} 个适合的模型，返回 ${limitedResults.length} 个结果`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            models: limitedResults,
            learning_adjusted: use_learning_adjustment && problem_context ? true : false,
            total_models_matched: results.length
          }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`推荐模型时出错: ${e.message}`);
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

// 重构 get-related-models 工具实现，专注于基于模型相似性的推荐
server.tool(
  "get-related-models",
  "获取与特定思维模型相关的模型推荐",
  {
    model_id: z.string().describe("思维模型的唯一id"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
    use_enhanced_similarity: z.boolean().optional().default(true).describe("是否使用增强的相似度评估（如果为false则使用基础算法）"),
    limit: z.number().optional().default(5).describe("返回结果数量限制，默认为5")
  },  
  async ({ model_id, lang, use_enhanced_similarity, limit }) => {
    try {
      // 查找源模型
      const source_model = MODELS[lang].find(m => m.id === model_id);
      
      if (!source_model) {
        log(`未找到模型 ID: ${model_id}`);
        return {
          content: [{ 
            type: "text",
            text: JSON.stringify({ error: "未找到指定模型" }, null, 2)
          }]
        };
      }

      // 过滤出候选模型（不包括源模型自身）
      const candidateModels = MODELS[lang].filter(m => m.id !== model_id);
      
      // 根据参数确定使用哪种推荐模式
      const mode = use_enhanced_similarity && candidateModels.length <= 50
        ? RecommendationMode.ENHANCED
        : RecommendationMode.BASIC;
        
      log(`使用${mode}模式为「${source_model.name}」生成相关思维模型推荐`);
      
      // 使用统一的推荐系统获取推荐结果
      const recommendations = await getModelRecommendations(
        source_model,
        candidateModels,
        lang,
        mode,
        limit
      );
      
      log(`成功生成${recommendations.length}个相关模型推荐`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify(recommendations, null, 2)
        }]
      };
    } catch (e: any) {
      log(`获取相关模型推荐时出错: ${e.message}`);
      return {
        content: [{ 
          type: "text",
          text: JSON.stringify({ error: "服务异常", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 添加推理过程透明化工具
server.tool(
  "explain-reasoning-process",
  "解释模型的推理过程和应用的思维模式",
  {
    problemDescription: z.string().describe("问题或情境描述"),
    reasoningSteps: z.array(z.object({
      description: z.string().describe("推理步骤描述"),
      modelIds: z.array(z.string()).optional().describe("使用的思维模型ID"),
      evidence: z.array(z.string()).optional().describe("支持证据"),
      confidence: z.number().optional().default(0.8).describe("置信度(0-1)")
    })).describe("推理步骤详情"),
    conclusion: z.string().describe("推理结论"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码")
  },
  async ({ problemDescription, reasoningSteps, conclusion, lang }) => {
    try {
      log(`开始构建推理路径，问题: "${problemDescription.substring(0, 50)}..."，${reasoningSteps.length} 个步骤`);
      
      // 1. 创建初始推理路径
      let path = createReasoningPath(problemDescription);
      
      // 2. 添加每个推理步骤
      for (const step of reasoningSteps) {
        path = addReasoningStep(
          path, 
          step.description, 
          step.evidence || [], 
          step.confidence || 0.8, 
          step.modelIds || []
        );
      }
      
      // 3. 添加结论
      path = setReasoningConclusion(path, conclusion);
      
      // 4. 获取所有模型信息用于格式化
      const modelsMap: Record<string, ThinkingModel> = {};
      const modelIds = new Set<string>();
      
      // 收集使用到的所有模型ID
      reasoningSteps.forEach(step => {
        if (step.modelIds) {
          step.modelIds.forEach(id => modelIds.add(id));
        }
      });
      
      // 获取模型详细信息
      for (const modelId of modelIds) {
        const model = MODELS[lang].find(m => m.id === modelId);
        if (model) {
          modelsMap[modelId] = model;
        }
      }
      
      // 5. 格式化输出结果
      const formattedPath = formatReasoningPath(path, modelsMap);
      
      // 6. 创建可视化数据
      const visualData = visualizeReasoningPath(path);
      
      log(`成功构建推理路径，包含 ${path.steps.length} 个步骤，使用了 ${modelIds.size} 个思维模型`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            formatted_text: formattedPath,
            visualization_data: visualData,
            path_data: path
          }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`解释推理过程时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "处理推理过程时出错", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 交互式推理工具
server.tool(
  "interactive-reasoning",
  "交互式推理过程，允许动态获取额外信息",
  {
    initialContext: z.string().describe("初始问题或情境描述"),
    reasoningStage: z.enum(["information_gathering", "hypothesis_generation", "hypothesis_testing", "conclusion"]).describe("当前推理阶段"),
    currentPathId: z.string().optional().describe("当前推理路径ID（如果在现有推理中）"),
    requiredInformation: z.array(z.string()).optional().describe("需要获取的额外信息"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码")
  },
  async ({ initialContext, reasoningStage, currentPathId, requiredInformation, lang }) => {
    try {
      // 根据推理阶段生成指导性问题或建议
      let suggestedActions: string[] = [];
      let relevantModels: ThinkingModel[] = [];
      
      // 根据不同阶段提供不同类型的指导
      switch (reasoningStage) {
        case "information_gathering":
          // 推荐5个适合信息收集阶段的思维模型
          relevantModels = MODELS[lang].filter(m => 
            (m.tags || []).some(tag => 
              ["信息收集", "数据分析", "问题定义", "information gathering", "data analysis"].includes(tag.toLowerCase())
            )
          ).slice(0, 5);
          
          suggestedActions = [
            "明确问题的关键信息维度",
            "确定数据收集的范围和边界",
            "识别潜在的信息盲点",
            "考虑可能的信息偏差",
            "确定信息的可靠性评估标准"
          ];
          break;
          
        case "hypothesis_generation":
          // 推荐适合假设生成阶段的思维模型
          relevantModels = MODELS[lang].filter(m => 
            (m.tags || []).some(tag => 
              ["创造性思维", "假设生成", "发散思考", "creative thinking", "hypothesis generation"].includes(tag.toLowerCase())
            )
          ).slice(0, 5);
          
          suggestedActions = [
            "考虑多个可能的解释",
            "应用反向思考质疑常规观点",
            "寻找现有理论的限制",
            "尝试结合不同领域的视角",
            "考虑极端情况以扩展思考范围"
          ];
          break;
          
        case "hypothesis_testing":
          // 推荐适合假设测试阶段的思维模型
          relevantModels = MODELS[lang].filter(m => 
            (m.tags || []).some(tag => 
              ["批判性思维", "验证", "评估", "critical thinking", "validation"].includes(tag.toLowerCase())
            )
          ).slice(0, 5);
          
          suggestedActions = [
            "设计可证伪的测试",
            "寻找反面证据",
            "评估假设的内部一致性",
            "考虑替代假设的解释力",
            "检验预测与观察结果的匹配度"
          ];
          break;
          
        case "conclusion":
          // 推荐适合结论形成阶段的思维模型
          relevantModels = MODELS[lang].filter(m => 
            (m.tags || []).some(tag => 
              ["决策制定", "综合分析", "结论形成", "decision making", "synthesis"].includes(tag.toLowerCase())
            )
          ).slice(0, 5);
          
          suggestedActions = [
            "评估结论的可靠性和局限性",
            "考虑结论的实际应用价值",
            "识别需要进一步验证的环节",
            "提出后续行动建议",
            "明确结论的适用条件和边界"
          ];
          break;
      }
      
      // 格式化推荐模型信息
      const recommendedModels = relevantModels.map(model => ({
        id: model.id,
        name: model.name,
        definition: model.definition || "",
        purpose: model.purpose || "",
        why_useful: `在${reasoningStage === "information_gathering" ? "信息收集" : 
                      reasoningStage === "hypothesis_generation" ? "假设生成" : 
                      reasoningStage === "hypothesis_testing" ? "假设验证" : "结论形成"}阶段特别有用`
      }));
      
      log(`为推理阶段 ${reasoningStage} 生成了交互式指导`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            reasoning_stage: reasoningStage,
            suggested_actions: suggestedActions,
            recommended_models: recommendedModels,
            required_information: requiredInformation || []
          }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`交互式推理工具出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "交互式推理过程失败", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 假设生成与验证工具
server.tool(
  "generate-validate-hypotheses",
  "为问题生成多个假设并提供验证方法",
  {
    problem: z.string().describe("要解决的问题"),
    context: z.string().describe("问题相关的背景信息"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码")
  },
  async ({ problem, context, lang }) => {
    try {
      log(`开始为问题生成假设: "${problem.substring(0, 50)}..."`);
      
      // 查找与问题相关的思维模型
      const relevantModels = [];
      for (const model of MODELS[lang]) {
        const { score } = calculateQueryMatch(model, problem + " " + context);
        if (score > 0) {
          relevantModels.push({
            id: model.id,
            name: model.name,
            definition: model.definition || "",
            score: score
          });
        }
      }
      
      // 按相关性排序并取前3个
      const topModels = relevantModels
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      
      // 基于思维模型生成假设
      const hypotheses = [
        {
          statement: `基于${topModels[0]?.name || '系统分析'}的假设：问题可能源于...`,
          supporting_evidence: ["背景信息中的关键点A", "领域内常见的模式B"],
          testing_methods: [
            "收集特定数据进行验证",
            "对比不同场景下的结果",
            "设计一个小规模实验"
          ],
          confidence: 0.75,
          related_model: topModels[0]?.id || ""
        },
        {
          statement: `替代假设：从${topModels[1]?.name || '反向思考'}角度看，问题可能是...`,
          supporting_evidence: ["背景中被忽视的因素X", "相关研究中的特例Y"],
          testing_methods: [
            "分析极端情况",
            "寻找反例",
            "验证关键假设条件"
          ],
          confidence: 0.65,
          related_model: topModels[1]?.id || ""
        },
        {
          statement: `综合假设：结合${topModels[2]?.name || '系统思维'}，可能的解释是...`,
          supporting_evidence: ["综合因素1和因素2", "系统层面的观察"],
          testing_methods: [
            "建立关键指标并测量",
            "进行对照实验",
            "寻求专家评估"
          ],
          confidence: 0.7,
          related_model: topModels[2]?.id || ""
        }
      ];
      
      log(`成功生成假设并提供验证方法`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            problem: problem,
            hypotheses: hypotheses,
            relevant_models: topModels
          }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`生成假设时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "生成假设验证过程失败", message: e.message }, null, 2)
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

// 添加用户反馈收集工具
server.tool(
  "record-user-feedback",
  "记录用户对思维模型使用体验的反馈",
  {
    modelIds: z.array(z.string()).describe("相关思维模型的ID数组"),
    context: z.string().describe("应用模型的上下文或问题描述"),
    feedbackType: z.enum(["helpful", "not_helpful", "incorrect", "insightful", "confusing"]).describe("反馈类型"),
    comment: z.string().optional().describe("反馈详细说明或评论"),
    applicationResult: z.string().optional().describe("模型应用结果描述"),
    suggestedImprovements: z.array(z.string()).optional().describe("建议的改进点"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码")
  },
  async ({ modelIds, context, feedbackType, comment, applicationResult, suggestedImprovements, lang }) => {
    try {
      log(`接收到用户反馈，类型：${feedbackType}, 相关模型：${modelIds.join(", ")}`);
        // 转换反馈类型为内部枚举类型
      const internalFeedbackType = 
                                  feedbackType === "helpful" ? "helpful" :
                                  feedbackType === "not_helpful" ? "not_helpful" :
                                  feedbackType === "incorrect" ? "incorrect" :
                                  feedbackType === "insightful" ? "insightful" :
                                  "confusing";
        // 记录用户反馈
      const feedback = recordUserFeedback(
        modelIds,
        context,
        internalFeedbackType as FeedbackType,
        comment,
        applicationResult,
        suggestedImprovements
      );
      
      // 检查并记录潜在的知识缺口
      if (internalFeedbackType === "not_helpful" || 
          internalFeedbackType === "incorrect" || 
          internalFeedbackType === "confusing") {
        const matchedModels = modelIds.map(id => MODELS[lang].find(m => m.id === id)).filter(Boolean) as ThinkingModel[];
        detectKnowledgeGap(context, matchedModels);
      }
      
      log(`用户反馈已记录，ID: ${feedback.feedbackId}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: "反馈已成功记录",
            feedbackId: feedback.feedbackId
          }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`记录用户反馈时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "记录用户反馈失败", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 添加知识缺口识别工具
server.tool(
  "detect-knowledge-gap",
  "检测用户查询中的知识缺口",
  {
    query: z.string().describe("用户查询或问题"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码"),
    matchThreshold: z.number().optional().default(0.5).describe("匹配阈值，低于此值视为知识缺口")
  },
  async ({ query, lang, matchThreshold }) => {
    try {
      log(`分析查询中潜在的知识缺口: "${query.substring(0, 50)}..."`);
      
      // 先执行标准搜索，找出最匹配的模型
      const matchedModels = [];
      for (const model of MODELS[lang]) {
        const { score } = calculateQueryMatch(model, query);
        if (score > 0) {
          matchedModels.push(model);
        }
      }
      
      // 检测知识缺口
      const gap = detectKnowledgeGap(query, matchedModels, matchThreshold);
      
      if (gap) {
        log(`发现知识缺口: ${gap.description}`);
        
        // 查找可能相关的模型
        const possibleRelatedModels = MODELS[lang]
          .map(model => {
            const { score } = calculateQueryMatch(model, gap.description);
            return { model, score };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(item => ({
            id: item.model.id,
            name: item.model.name,
            relevance: item.score
          }));
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              has_knowledge_gap: true,
              gap_id: gap.gapId,
              description: gap.description,
              detection_count: gap.detectionCount,
              possible_tags: gap.possibleTags,
              suggested_models: possibleRelatedModels,
              recommendations: [
                "考虑添加新的思维模型",
                "扩展现有模型的标签和关键词",
                "收集更多用户反馈"
              ]
            }, null, 2)
          }]
        };
      } else {
        log(`未发现知识缺口`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              has_knowledge_gap: false,
              matched_models_count: matchedModels.length
            }, null, 2)
          }]
        };
      }
    } catch (e: any) {
      log(`检测知识缺口时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "检测知识缺口失败", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 获取模型使用统计工具
server.tool(
  "get-model-usage-stats",
  "获取思维模型的使用统计数据",
  {
    modelId: z.string().describe("思维模型的唯一ID"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码")
  },
  async ({ modelId, lang }) => {
    try {
      log(`获取模型 ${modelId} 的使用统计`);
      
      // 检查模型是否存在
      const model = MODELS[lang].find(m => m.id === modelId);
      if (!model) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "未找到指定模型" }, null, 2)
          }]
        };
      }
      
      // 获取使用统计
      const stats = getModelUsageStats(modelId);
      
      // 获取反馈历史
      const feedbackHistory = getModelFeedbackHistory(modelId);
      
      if (!stats) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ 
              modelId,
              modelName: model.name,
              message: "该模型暂无使用数据" 
            }, null, 2)
          }]
        };
      }
      
      // 从反馈中提取关键洞察
      const insights = [];
      
      if (stats.averageHelpfulness > 0.7 && stats.usageCount >= 5) {
        insights.push("该模型获得了很高的正面评价");
      } else if (stats.averageHelpfulness < 0.3 && stats.usageCount >= 5) {
        insights.push("该模型获得的负面评价较多，可能需要改进");
      }
      
      if (stats.commonContexts.length > 0) {
        insights.push("该模型在特定上下文中被频繁使用");
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            modelId,
            modelName: model.name,
            usage_count: stats.usageCount,
            positive_feedback_ratio: stats.averageHelpfulness,
            positive_count: stats.positiveCount,
            negative_count: stats.negativeCount,
            common_contexts: stats.commonContexts,
            feedback_count: feedbackHistory.length,
            insights
          }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`获取模型使用统计时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "获取使用统计失败", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 学习系统总体分析工具
server.tool(
  "analyze-learning-system",
  "分析思维模型学习系统的总体状况",
  {
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码")
  },
  async ({ lang }) => {
    try {
      log(`分析学习系统整体状况`);
      
      // 获取系统分析数据
      const analysis = analyzeModelUsage();
      
      // 获取知识缺口
      const knowledgeGaps = getKnowledgeGaps(5); // 获取前5个知识缺口
      
      // 为知识缺口添加可能相关的模型
      const gapsWithSuggestions = knowledgeGaps.map(gap => {
        // 找出可能相关的模型
        const suggestedModels = MODELS[lang]
          .map(model => {
            const { score } = calculateQueryMatch(model, gap.description);
            return { id: model.id, name: model.name, score };
          })
          .filter(item => item.score > 0.3) // 只保留相关度较高的
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
          
        return {
          ...gap,
          suggested_models: suggestedModels
        };
      });
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            system_stats: analysis,
            top_knowledge_gaps: gapsWithSuggestions,
            recommendations: [
              "持续收集用户反馈以改进模型推荐",
              "考虑添加新模型以填补知识缺口",
              "关注用户体验不佳的模型并考虑改进"
            ]
          }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`分析学习系统时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "分析学习系统失败", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 添加获取服务器版本信息的工具
server.tool(
  "get-server-version",
  "获取思维模型MCP服务器的版本和状态信息",
  {},
  async () => {
    try {
      const version = await getPackageVersion();
      const serverStartupTime = new Date().toISOString();
      
      // 收集模型统计信息
      const modelStats = Object.entries(MODELS).reduce((stats, [lang, models]) => {
        stats[lang] = models.length;
        return stats;
      }, {} as Record<string, number>);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            version,
            server_name: "thinking_models",
            startup_time: serverStartupTime,
            model_stats: modelStats,
            supported_languages: Object.keys(SUPPORTED_LANGUAGES),
            server_status: "running"
          }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`获取服务器版本信息时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "获取服务器信息失败", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 添加创建新思维模型的工具
server.tool(
  "create-thinking-model",
  "创建新的思维模型并添加到系统中，用于填补知识缺口",
  {    id: z.string().describe("模型的唯一标识符，请使用小写字母和下划线，例如：digital_marketing_funnel"),
    name: z.string().describe("模型的名称，例如：数字营销漏斗模型"),
    author: z.string().optional().describe("模型作者（可选）"),
    source: z.string().optional().describe("模型来源（可选）"),
    definition: z.string().describe("模型的简明定义"),
    purpose: z.string().describe("模型的主要目的和使用场景"),
    interaction: z.string().optional().describe("使用该模型与用户交互的方式指南（可选）"),
    constraints: z.array(z.string()).optional().describe("使用此模型的约束条件（可选）"),
    prompt: z.string().optional().describe("详细的提示词/角色扮演指南（可选）"),
    example: z.string().optional().describe("模型使用的简短示例（可选）"),
    category: z.string().describe("模型的主要分类，如：营销分析、决策制定、系统思考等"),
    subcategories: z.array(z.string()).optional().describe("模型的子分类列表（可选）"),
    tags: z.array(z.string()).optional().describe("模型的相关标签（可选）"),
    use_cases: z.array(z.string()).optional().describe("模型的使用案例（可选）"),
    common_problems_solved: z.array(
      z.object({
        problem_description: z.string(),
        keywords: z.array(z.string()),
        guiding_questions: z.array(z.string()).optional()
      })
    ).optional().describe("模型解决的常见问题（可选）"),
    popular_science_teaching: z.array(
      z.object({
        concept_name: z.string(),
        explanation: z.string()
      })
    ).optional().describe("模型的通俗科学教学（可选）"),
    limitations: z.array(
      z.object({
        limitation_name: z.string(),
        description: z.string()
      })
    ).optional().describe("模型的局限性（可选）"),
    common_pitfalls: z.array(
      z.object({
        pitfall_name: z.string(),
        description: z.string()
      })
    ).optional().describe("使用模型的常见陷阱（可选）"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("模型的语言（'zh' 或 'en'），默认为 'zh'"),
    // 可视化数据需要细分为具体类型
    flowchart_visualizations: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        dsl: z.string()
      })
    ).optional().describe("流程图可视化（可选）"),
    bar_chart_visualizations: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        labels: z.array(z.string()),
        datasets: z.array(
          z.object({
            label: z.string(),
            data: z.array(z.number()),
            backgroundColor: z.union([z.string(), z.array(z.string())]).optional()
          })
        )
      })
    ).optional().describe("柱状图可视化（可选）"),
    table_visualizations: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        headers: z.array(z.string()),
        rows: z.array(z.array(z.union([z.string(), z.number(), z.boolean()])))
      })
    ).optional().describe("表格可视化（可选）"),    list_visualizations: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        items: z.array(
          z.object({
            text: z.string(),
            subItems: z.array(
              z.object({
                text: z.string()
              })
            ).optional()
          })
        )
      })
    ).optional().describe("列表可视化（可选）"),
    comparison_table_visualizations: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        criteria: z.array(z.string()),
        items: z.array(
          z.object({
            name: z.string(),
            values: z.array(z.union([z.string(), z.number(), z.boolean()]))
          })
        )
      })
    ).optional().describe("比较表可视化（可选）")
  },  async (model) => {
    try {
      log(`开始创建新思维模型，收到参数: id=${model.id}, name=${model.name}, category=${model.category}, lang=${model.lang}`);
      const { 
        lang, 
        flowchart_visualizations,
        bar_chart_visualizations,
        table_visualizations,
        list_visualizations,
        comparison_table_visualizations,
        ...basicModelData 
      } = model;
      log(`解构参数完成，基础模型数据包含字段: ${Object.keys(basicModelData).join(', ')}`);
      
      // 验证ID格式
      if (!/^[a-z0-9_]+$/.test(basicModelData.id)) {
        log(`模型ID格式验证失败: "${basicModelData.id}" 不符合要求的格式(仅小写字母、数字和下划线)`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "模型ID格式无效，请使用小写字母、数字和下划线" }, null, 2)
          }]
        };
      }
      log(`模型ID格式验证通过: ${basicModelData.id}`);
      
      // 检查ID是否已存在
      if (MODELS[lang].some(m => m.id === basicModelData.id)) {
        log(`模型ID冲突检查失败: 模型ID "${basicModelData.id}" 已存在于 ${lang} 语言中`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: `模型ID '${basicModelData.id}' 已存在，请使用其他ID` }, null, 2)
          }]
        };
      }
      log(`模型ID冲突检查通过: ${basicModelData.id} 在 ${lang} 语言中不存在`);      // 处理可视化数据
      const visualizations: Array<{
        title: string;
        type: "flowchart_dsl" | "bar_chart_data" | "table_data" | "list_items" | "comparison_table";
        data: FlowchartDslData | BarChartData | TableData | ListData | ComparisonTableData;
        description?: string;
      }> = [];
      log(`开始处理可视化数据...`);
      
      // 处理流程图可视化
      if (flowchart_visualizations) {
        flowchart_visualizations.forEach(viz => {
          visualizations.push({
            title: viz.title,
            type: "flowchart_dsl",
            data: { dsl: viz.dsl } as FlowchartDslData,
            description: viz.description
          });
        });
      }
      
      // 处理柱状图可视化
      if (bar_chart_visualizations) {
        bar_chart_visualizations.forEach(viz => {
          visualizations.push({
            title: viz.title,
            type: "bar_chart_data",
            data: {
              labels: viz.labels,
              datasets: viz.datasets
            } as BarChartData,
            description: viz.description
          });
        });
      }
      
      // 处理表格可视化
      if (table_visualizations) {
        table_visualizations.forEach(viz => {
          visualizations.push({
            title: viz.title,
            type: "table_data",
            data: {
              headers: viz.headers,
              rows: viz.rows
            } as TableData,
            description: viz.description
          });
        });
      }
      
      // 处理列表可视化
      if (list_visualizations) {
        list_visualizations.forEach(viz => {
          visualizations.push({
            title: viz.title,
            type: "list_items",
            data: {
              items: viz.items
            } as ListData,
            description: viz.description
          });
        });
      }
      
      // 处理比较表可视化
      if (comparison_table_visualizations) {
        comparison_table_visualizations.forEach(viz => {
          visualizations.push({
            title: viz.title,
            type: "comparison_table",
            data: {
              criteria: viz.criteria,
              items: viz.items
            } as ComparisonTableData,
            description: viz.description
          });
        });
      }      // 创建完整的模型对象
      const newModel: ThinkingModel = {
        ...basicModelData,
        visualizations: visualizations.length > 0 ? visualizations : undefined
      };
      log(`已创建完整模型对象，可视化数量: ${visualizations.length}`);
      
      // 确定保存路径
      const modelLangDir = path.resolve(__dirname, "..", SUPPORTED_LANGUAGES[lang]);
      const modelFilePath = path.join(modelLangDir, `${basicModelData.id}.json`);
      log(`模型将保存到路径: ${modelFilePath}`);
      
      // 确保目录存在
      try {
        await fs.access(modelLangDir);
      } catch {
        await fs.mkdir(modelLangDir, { recursive: true });
        log(`创建模型目录: ${modelLangDir}`);
      }
      
      // 保存模型到文件
      await fs.writeFile(modelFilePath, JSON.stringify(newModel, null, 2), 'utf-8');
      log(`新模型 ${basicModelData.id} 已保存到 ${modelFilePath}`);
      
      // 将新模型添加到内存中
      MODELS[lang].push(newModel);      // 检查该模型是否可能填补了现有的知识缺口
      let potentiallyFilledGaps: Array<{gapId: string, description: string, relevanceScore: number}> = [];
      
      try {
        // 确保加载了最新状态
        await loadLearningSystemState();
        
        // 获取知识缺口
        const knowledgeGaps = getKnowledgeGaps(100); // 获取最多100个知识缺口进行检查
        
        if (knowledgeGaps && knowledgeGaps.length > 0) {
          // 检查新模型是否可能填补任何知识缺口
          potentiallyFilledGaps = knowledgeGaps
            .filter(gap => {
              // 使用查询匹配算法检查模型与知识缺口的相关性
              const { score } = calculateQueryMatch(newModel, gap.description);
              return score > 0.6; // 相关性阈值
            })
            .map(gap => ({
              gapId: gap.gapId,
              description: gap.description,
              relevanceScore: calculateQueryMatch(newModel, gap.description).score
            }));
        }
      } catch (error) {
        log(`检查知识缺口填补时出错: ${error instanceof Error ? error.message : String(error)}`);
      }
        return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `新思维模型 '${newModel.name}' (ID: ${newModel.id}) 已成功创建`,
            model_id: newModel.id,
            file_path: modelFilePath,
            potentially_filled_knowledge_gaps: potentiallyFilledGaps
          }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`创建思维模型时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "创建思维模型失败", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 添加更新思维模型的工具
server.tool(
  "update-thinking-model",
  "更新现有思维模型的内容",
  {
    model_id: z.string().describe("要更新的模型ID"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("模型的语言（'zh' 或 'en'），默认为 'zh'"),
    // 可更新的字段
    name: z.string().optional().describe("模型的名称（可选）"),
    author: z.string().optional().describe("模型作者（可选）"),
    source: z.string().optional().describe("模型来源（可选）"),
    definition: z.string().optional().describe("模型的简明定义（可选）"),
    purpose: z.string().optional().describe("模型的主要目的和使用场景（可选）"),
    interaction: z.string().optional().describe("使用该模型与用户交互的方式指南（可选）"),
    constraints: z.array(z.string()).optional().describe("使用此模型的约束条件（可选）"),
    prompt: z.string().optional().describe("详细的提示词/角色扮演指南（可选）"),
    example: z.string().optional().describe("模型使用的简短示例（可选）"),
    category: z.string().optional().describe("模型的主要分类（可选）"),
    subcategories: z.array(z.string()).optional().describe("模型的子分类列表（可选）"),
    tags: z.array(z.string()).optional().describe("模型的相关标签（可选）"),
    use_cases: z.array(z.string()).optional().describe("模型的使用案例（可选）"),
    common_problems_solved: z.array(
      z.object({
        problem_description: z.string(),
        keywords: z.array(z.string()),
        guiding_questions: z.array(z.string()).optional()
      })
    ).optional().describe("模型解决的常见问题（可选）"),
    popular_science_teaching: z.array(
      z.object({
        concept_name: z.string(),
        explanation: z.string()
      })
    ).optional().describe("模型的通俗科学教学（可选）"),
    limitations: z.array(
      z.object({
        limitation_name: z.string(),
        description: z.string()
      })
    ).optional().describe("模型的局限性（可选）"),
    common_pitfalls: z.array(
      z.object({
        pitfall_name: z.string(),
        description: z.string()
      })
    ).optional().describe("使用模型的常见陷阱（可选）"),
    // 可视化数据需要细分为具体类型
    flowchart_visualizations: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        dsl: z.string()
      })
    ).optional().describe("流程图可视化（可选）"),
    bar_chart_visualizations: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        labels: z.array(z.string()),
        datasets: z.array(
          z.object({
            label: z.string(),
            data: z.array(z.number()),
            backgroundColor: z.union([z.string(), z.array(z.string())]).optional()
          })
        )
      })
    ).optional().describe("柱状图可视化（可选）"),
    table_visualizations: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        headers: z.array(z.string()),
        rows: z.array(z.array(z.union([z.string(), z.number(), z.boolean()])))
      })
    ).optional().describe("表格可视化（可选）"),    
    list_visualizations: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        items: z.array(
          z.object({
            text: z.string(),
            subItems: z.array(
              z.object({
                text: z.string()
              })
            ).optional()
          })
        )
      })
    ).optional().describe("列表可视化（可选）"),
    comparison_table_visualizations: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        criteria: z.array(z.string()),
        items: z.array(
          z.object({
            name: z.string(),
            values: z.array(z.union([z.string(), z.number(), z.boolean()]))
          })
        )
      })
    ).optional().describe("比较表可视化（可选）")
  },
  async (model) => {
    try {
      const { model_id, lang, ...updateData } = model;
      log(`开始更新思维模型, ID: ${model_id}, 语言: ${lang}, 待更新字段: ${Object.keys(updateData).join(', ')}`);
      
      // 查找现有模型
      const modelIndex = MODELS[lang].findIndex(m => m.id === model_id);
      if (modelIndex === -1) {
        log(`未找到要更新的模型: ID=${model_id}, 语言=${lang}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: `找不到ID为'${model_id}'的模型` }, null, 2)
          }]
        };
      }
      
      // 获取现有模型
      const existingModel = MODELS[lang][modelIndex];
      log(`找到现有模型: ${existingModel.name} (ID: ${existingModel.id})`);
      
      // 提取可视化相关字段和基础字段
      const {
        flowchart_visualizations,
        bar_chart_visualizations,
        table_visualizations,
        list_visualizations,
        comparison_table_visualizations,
        ...basicUpdateData
      } = updateData;
      
      // 更新基础字段
      const updatedModel = {
        ...existingModel,
        ...basicUpdateData
      };
      
      log(`基础字段更新完成，开始处理可视化数据...`);
      
      // 初始化可视化数组（如果原模型没有则创建空数组）
      let currentVisualizations = existingModel.visualizations || [];
      
      // 处理流程图可视化更新
      if (flowchart_visualizations) {
        flowchart_visualizations.forEach(viz => {
          const vizIndex = currentVisualizations.findIndex(
            v => v.type === "flowchart_dsl" && v.title === viz.title
          );
          
          if (vizIndex >= 0) {
            // 更新现有可视化
            currentVisualizations[vizIndex] = {
              title: viz.title,
              type: "flowchart_dsl",
              data: { dsl: viz.dsl } as FlowchartDslData,
              description: viz.description
            };
            log(`更新流程图可视化: ${viz.title}`);
          } else {
            // 添加新可视化
            currentVisualizations.push({
              title: viz.title,
              type: "flowchart_dsl",
              data: { dsl: viz.dsl } as FlowchartDslData,
              description: viz.description
            });
            log(`添加新流程图可视化: ${viz.title}`);
          }
        });
      }
      
      // 处理柱状图可视化更新
      if (bar_chart_visualizations) {
        bar_chart_visualizations.forEach(viz => {
          const vizIndex = currentVisualizations.findIndex(
            v => v.type === "bar_chart_data" && v.title === viz.title
          );
          
          if (vizIndex >= 0) {
            // 更新现有可视化
            currentVisualizations[vizIndex] = {
              title: viz.title,
              type: "bar_chart_data",
              data: {
                labels: viz.labels,
                datasets: viz.datasets
              } as BarChartData,
              description: viz.description
            };
            log(`更新柱状图可视化: ${viz.title}`);
          } else {
            // 添加新可视化
            currentVisualizations.push({
              title: viz.title,
              type: "bar_chart_data",
              data: {
                labels: viz.labels,
                datasets: viz.datasets
              } as BarChartData,
              description: viz.description
            });
            log(`添加新柱状图可视化: ${viz.title}`);
          }
        });
      }
      
      // 处理表格可视化更新
      if (table_visualizations) {
        table_visualizations.forEach(viz => {
          const vizIndex = currentVisualizations.findIndex(
            v => v.type === "table_data" && v.title === viz.title
          );
          
          if (vizIndex >= 0) {
            // 更新现有可视化
            currentVisualizations[vizIndex] = {
              title: viz.title,
              type: "table_data",
              data: {
                headers: viz.headers,
                rows: viz.rows
              } as TableData,
              description: viz.description
            };
            log(`更新表格可视化: ${viz.title}`);
          } else {
            // 添加新可视化
            currentVisualizations.push({
              title: viz.title,
              type: "table_data",
              data: {
                headers: viz.headers,
                rows: viz.rows
              } as TableData,
              description: viz.description
            });
            log(`添加新表格可视化: ${viz.title}`);
          }
        });
      }
      
      // 处理列表可视化更新
      if (list_visualizations) {
        list_visualizations.forEach(viz => {
          const vizIndex = currentVisualizations.findIndex(
            v => v.type === "list_items" && v.title === viz.title
          );
          
          if (vizIndex >= 0) {
            // 更新现有可视化
            currentVisualizations[vizIndex] = {
              title: viz.title,
              type: "list_items",
              data: {
                items: viz.items
              } as ListData,
              description: viz.description
            };
            log(`更新列表可视化: ${viz.title}`);
          } else {
            // 添加新可视化
            currentVisualizations.push({
              title: viz.title,
              type: "list_items",
              data: {
                items: viz.items
              } as ListData,
              description: viz.description
            });
            log(`添加新列表可视化: ${viz.title}`);
          }
        });
      }
      
      // 处理比较表可视化更新
      if (comparison_table_visualizations) {
        comparison_table_visualizations.forEach(viz => {
          const vizIndex = currentVisualizations.findIndex(
            v => v.type === "comparison_table" && v.title === viz.title
          );
          
          if (vizIndex >= 0) {
            // 更新现有可视化
            currentVisualizations[vizIndex] = {
              title: viz.title,
              type: "comparison_table",
              data: {
                criteria: viz.criteria,
                items: viz.items
              } as ComparisonTableData,
              description: viz.description
            };
            log(`更新比较表可视化: ${viz.title}`);
          } else {
            // 添加新可视化
            currentVisualizations.push({
              title: viz.title,
              type: "comparison_table",
              data: {
                criteria: viz.criteria,
                items: viz.items
              } as ComparisonTableData,
              description: viz.description
            });
            log(`添加新比较表可视化: ${viz.title}`);
          }
        });
      }
      
      // 应用更新后的可视化
      updatedModel.visualizations = currentVisualizations.length > 0 ? currentVisualizations : undefined;
      log(`可视化数据处理完成，共有 ${currentVisualizations.length} 个可视化`);
      
      // 更新内存中的模型
      MODELS[lang][modelIndex] = updatedModel;
      
      // 保存更新后的模型到文件系统
      const modelLangDir = path.resolve(__dirname, "..", SUPPORTED_LANGUAGES[lang]);
      const modelFilePath = path.join(modelLangDir, `${model_id}.json`);
      
      await fs.writeFile(modelFilePath, JSON.stringify(updatedModel, null, 2), 'utf-8');
      log(`模型 ${model_id} 已更新并保存到 ${modelFilePath}`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `思维模型 '${updatedModel.name}' (ID: ${updatedModel.id}) 已成功更新`,
            updated_fields: Object.keys(updateData),
            file_path: modelFilePath
          }, null, 2)
        }]
      };
      
    } catch (e: any) {
      log(`更新思维模型时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "更新思维模型失败", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 添加基于现有模型组合创建新思维模型的工具
server.tool(
  "emergent-model-design",
  "通过组合现有思维模型的关键概念和特性来创建新的思维模型",
  {
    source_model_ids: z.array(z.string()).min(2).max(10).describe("用于组合的源模型ID列表，至少2个，最多10个"),
    target_model_id: z.string().describe("新模型的唯一标识符，请使用小写字母和下划线"),
    target_model_name: z.string().describe("新模型的名称"),
    design_goal: z.string().describe("设计目标和用途描述"),
    lang: z.enum(["zh", "en"] as const).default("zh").describe("模型的语言（'zh' 或 'en'），默认为 'zh'"),
    category: z.string().optional().describe("新模型的主要分类（可选）"),
    connection_description: z.string().optional().describe("描述源模型是如何组合的（可选）")
  },
  async ({ source_model_ids, target_model_id, target_model_name, design_goal, lang, category, connection_description }) => {
    try {
      // 验证ID格式
      if (!/^[a-z0-9_]+$/.test(target_model_id)) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "模型ID格式无效，请使用小写字母、数字和下划线" }, null, 2)
          }]
        };
      }
      
      // 检查目标ID是否已存在
      if (MODELS[lang].some(m => m.id === target_model_id)) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: `模型ID '${target_model_id}' 已存在，请使用其他ID` }, null, 2)
          }]
        };
      }
      
      // 查找源模型
      const sourceModels: ThinkingModel[] = [];
      const notFoundModels: string[] = [];
      
      for (const modelId of source_model_ids) {
        const model = MODELS[lang].find(m => m.id === modelId);
        if (model) {
          sourceModels.push(model);
        } else {
          notFoundModels.push(modelId);
        }
      }
      
      // 如果有模型未找到，返回错误
      if (notFoundModels.length > 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ 
              error: "部分源模型未找到", 
              not_found_model_ids: notFoundModels 
            }, null, 2)
          }]
        };
      }
      
      // 如果没有足够的源模型进行组合，返回错误
      if (sourceModels.length < 2) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ 
              error: "至少需要两个有效的源模型进行组合" 
            }, null, 2)
          }]
        };
      }
      
      // 提取源模型的关键特性
      const combinedTags = new Set<string>();
      const combinedUseCases = new Set<string>();
      const combinedProblems = new Map<string, {
        problem_description: string;
        keywords: string[];
        guiding_questions?: string[];
      }>();
      
      // 组合标签和使用场景
      sourceModels.forEach(model => {
        // 合并标签
        if (model.tags) {
          model.tags.forEach(tag => combinedTags.add(tag));
        }
        
        // 合并使用场景
        if (model.use_cases) {
          model.use_cases.forEach(useCase => combinedUseCases.add(useCase));
        }
        
        // 合并常见问题，使用Map来避免重复
        if (model.common_problems_solved) {
          model.common_problems_solved.forEach(problem => {
            const key = problem.problem_description.toLowerCase().trim();
            if (!combinedProblems.has(key)) {
              combinedProblems.set(key, { ...problem });
            }
          });
        }
      });
      
      // 创建新模型结构
      const newModel: ThinkingModel = {
        id: target_model_id,
        name: target_model_name,
        definition: `这是一个通过结合${sourceModels.map(m => m.name).join("、")}的关键概念创建的思维模型。`,
        purpose: design_goal,
        category: category || (sourceModels[0].category || "组合模型"),
        subcategories: Array.from(new Set(sourceModels.flatMap(m => m.subcategories || []))),
        tags: Array.from(combinedTags),
        use_cases: Array.from(combinedUseCases),
        common_problems_solved: Array.from(combinedProblems.values()),
      };
      
      // 添加源模型的关联信息
      if (connection_description) {
        // 如果提供了连接描述，使用它
        newModel.popular_science_teaching = [
          {
            concept_name: "模型组合方法",
            explanation: connection_description
          }
        ];
      } else {
        // 否则创建一个默认的说明
        newModel.popular_science_teaching = [
          {
            concept_name: "模型组合方法",
            explanation: `这个模型结合了${sourceModels.map(m => m.name).join("和")}的关键概念和应用方法。`
          }
        ];
      }
      
      // 从源模型提取限制条件
      const limitations = new Map<string, { limitation_name: string, description: string }>();
      sourceModels.forEach(model => {
        if (model.limitations) {
          model.limitations.forEach(limitation => {
            const key = limitation.limitation_name.toLowerCase().trim();
            if (!limitations.has(key)) {
              limitations.set(key, { ...limitation });
            }
          });
        }
      });
      
      // 从源模型提取常见陷阱
      const pitfalls = new Map<string, { pitfall_name: string, description: string }>();
      sourceModels.forEach(model => {
        if (model.common_pitfalls) {
          model.common_pitfalls.forEach(pitfall => {
            const key = pitfall.pitfall_name.toLowerCase().trim();
            if (!pitfalls.has(key)) {
              pitfalls.set(key, { ...pitfall });
            }
          });
        }
      });
      
      // 添加限制和陷阱到新模型
      if (limitations.size > 0) {
        newModel.limitations = Array.from(limitations.values());
      }
      
      if (pitfalls.size > 0) {
        newModel.common_pitfalls = Array.from(pitfalls.values());
      }
      
      // 创建比较表可视化（展示源模型的关键特性和组合如何工作）
      const comparisonTable = {
        title: "组合模型特性对比",
        description: "展示源模型的关键特性以及它们如何在新模型中组合",
        criteria: ["定义", "主要用途", "关键应用场景"],
        items: sourceModels.map(model => ({
          name: model.name,
          values: [
            model.definition || "未提供定义",
            model.purpose || "未提供用途",
            (model.use_cases && model.use_cases.length > 0) ? model.use_cases[0] : "未提供应用场景"
          ]
        }))
      };
      
      // 创建列表可视化（展示新模型的创新点）
      const innovationList = {
        title: "模型创新点",
        description: "通过组合现有模型产生的创新特性",
        items: [
          {
            text: "跨领域应用能力",
            subItems: sourceModels.map(model => ({
              text: `从${model.name}借鉴: ${model.purpose || model.definition || model.name}`
            }))
          },
          {
            text: "综合问题解决方法",
            subItems: Array.from(combinedProblems.values()).slice(0, 3).map(problem => ({
              text: problem.problem_description
            }))
          }
        ]
      };
      
      // 添加可视化到新模型
      newModel.visualizations = [
        {
          title: comparisonTable.title,
          type: "comparison_table",
          data: comparisonTable as ComparisonTableData,
          description: comparisonTable.description
        },
        {
          title: innovationList.title,
          type: "list_items",
          data: innovationList as ListData,
          description: innovationList.description
        }
      ];
      
      // 确定保存路径
      const modelLangDir = path.resolve(__dirname, "..", SUPPORTED_LANGUAGES[lang]);
      const modelFilePath = path.join(modelLangDir, `${target_model_id}.json`);
      
      // 确保目录存在
      try {
        await fs.access(modelLangDir);
      } catch {
        await fs.mkdir(modelLangDir, { recursive: true });
        log(`创建模型目录: ${modelLangDir}`);
      }
      
      // 保存模型到文件
      await fs.writeFile(modelFilePath, JSON.stringify(newModel, null, 2), 'utf-8');
      log(`新的组合模型 ${target_model_id} 已保存到 ${modelFilePath}`);
      
      // 将新模型添加到内存中
      MODELS[lang].push(newModel);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `新的组合思维模型 '${newModel.name}' (ID: ${newModel.id}) 已成功创建`,
            model_id: newModel.id,
            file_path: modelFilePath,
            source_models: sourceModels.map(m => ({ id: m.id, name: m.name })),
            combined_features: {
              tags: Array.from(combinedTags),
              use_cases: Array.from(combinedUseCases).length,
              problem_solving_approaches: combinedProblems.size
            }
          }, null, 2)
        }]
      };
    } catch (e: any) {
      log(`创建组合思维模型时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "创建组合思维模型失败", message: e.message }, null, 2)
        }]
      };
    }
  }
);

// 添加新手引导工具
server.tool(
  "get-started-guide",
  "新手入门指南，帮助用户了解思维模型工具体系和建议使用流程",
  {
    lang: z.enum(["zh", "en"] as const).default("zh").describe("语言代码（'zh' 或 'en'），默认为 'zh'"),
    expertise_level: z.enum(["beginner", "intermediate", "advanced"] as const).default("beginner").describe("用户经验水平，默认为 'beginner'"),
    user_objective: z.enum(["explore", "solve_problem", "create_model", "learn_tools"] as const).default("explore").describe("用户目标，默认为 'explore'")
  },
  async ({ lang, expertise_level, user_objective }) => {
    try {
      log(`获取新手引导，语言: ${lang}, 级别: ${expertise_level}, 目标: ${user_objective}`);
      
      // 获取基于用户目标的工具指南
      let toolGuide;
      switch (user_objective) {
        case "explore":
          toolGuide = generateExploreToolsGuide(expertise_level, lang);
          break;
        case "solve_problem":
          toolGuide = generateProblemSolvingToolsGuide(expertise_level, lang);
          break;
        case "create_model":
          toolGuide = generateCreationToolsGuide(expertise_level, lang);
          break;
        case "learn_tools":
          toolGuide = generateCompleteToolsGuide(expertise_level, lang);
          break;
      }
      
      // 获取工作流程指南
      let workflowGuide;
      switch (user_objective) {
        case "explore":
          workflowGuide = generateExploreWorkflowGuide(expertise_level);
          break;
        case "solve_problem":
          workflowGuide = generateProblemSolvingWorkflowGuide(expertise_level);
          break;
        case "create_model":
          workflowGuide = generateCreationWorkflowGuide(expertise_level);
          break;
        case "learn_tools":
          workflowGuide = generateToolLearningWorkflowGuide(expertise_level);
          break;
      }
      
      // 获取示例
      let examples;
      switch (user_objective) {
        case "explore":
          examples = generateExploreExamples(expertise_level, lang);
          break;
        case "solve_problem":
          examples = generateProblemSolvingExamples(expertise_level, lang);
          break;
        case "create_model":
          examples = generateCreationExamples(expertise_level, lang);
          break;
        case "learn_tools":
          examples = generateToolLearningExamples(expertise_level, lang);
          break;
      }
      
      // 获取学习路径
      const learningPath = generateLearningPath(user_objective, expertise_level, lang);
      
      // 获取工具关系图
      const toolsRelationshipMap = generateToolsRelationshipMap(user_objective);
      
      // 为初学者提供一些额外的指导说明
      const generalGuidance = expertise_level === "beginner" ? {
        welcome_message: "欢迎使用思维模型MCP服务器！",
        general_tips: [
          "从简单的工具开始，如list-models和get-categories",
          "熟悉基本概念后再尝试高级工具",
          "使用recommend-models-for-problem解决实际问题",
          "不确定如何使用某个工具时，查看其参数描述"
        ],
        common_scenarios: [
          "探索新的思维模型 - 使用list-models和get-categories",
          "解决特定问题 - 使用recommend-models-for-problem",
          "学习特定模型 - 使用get-model-details和get-related-models",
          "创建自己的模型 - 使用create-thinking-model或emergent-model-design"
        ]
      } : null;
        // 找到最适合当前目标的模型
      const interestWords = user_objective === "explore" ? ["思考框架", "模型分类"] :
                           user_objective === "solve_problem" ? ["决策", "分析", "问题解决"] :
                           user_objective === "create_model" ? ["创新", "组合思维", "设计思维"] :
                           ["学习系统", "工具使用", "反馈"];
      
      const interestArea = interestWords.join(" ");
      const relevantCategories = analyzeInterestArea(interestArea, lang);
      
      // 生成起点建议
      let startingPoint = null;
      if (relevantCategories.length > 0) {
        const relevantModels = MODELS[lang].filter(m => 
          m.category === relevantCategories[0].category
        ).slice(0, 3);
        
        startingPoint = generateStartingPoint(user_objective, relevantModels, expertise_level, lang);
      }
      
      // 构建完整的指南
      const completeGuide = {
        expertise_level,
        user_objective,
        general_guidance: generalGuidance,
        tool_guide: toolGuide,
        workflow_guide: workflowGuide,
        learning_path: learningPath,
        tool_relationships: toolsRelationshipMap,
        examples,
        relevant_categories: relevantCategories,
        starting_point: startingPoint
      };
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(completeGuide, null, 2)
        }]
      };
    } catch (e: any) {
      log(`生成新手引导时出错: ${e.message}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "生成新手引导失败", message: e.message }, null, 2)
        }]
      };
    }
  }
);



// 新手引导辅助函数
// 生成探索工具指南
function generateExploreToolsGuide(expertiseLevel: string, lang: SupportedLanguage) {
  return {
    primary_tools: [
      {
        tool: "list-models",
        description: "列出所有思维模型或按分类筛选",
        usage: expertiseLevel === "beginner" ? "最基本的模型浏览工具，适合初步了解系统中有哪些思维模型" : "可用于按分类浏览模型，支持子分类过滤",
        parameters: {
          lang: "语言选择，'zh' 或 'en'",
          category: "可选，按主分类筛选",
          subcategory: "可选，按子分类进一步筛选",
          limit: "可选，限制返回结果数量"
        },
        example_command: `{
  "lang": "${lang}",
  "category": "决策理论"
}`
      },
      {
        tool: "search-models",
        description: "按关键词搜索思维模型",
        usage: "当你对某个具体概念或方法感兴趣时，可以使用此工具进行搜索",
        parameters: {
          query: "搜索关键词",
          lang: "语言选择",
          limit: "可选，限制返回结果数量"
        },
        example_command: `{
  "query": "决策分析",
  "lang": "${lang}",
  "limit": 5
}`
      },
      {
        tool: "get-categories",
        description: "获取所有思维模型分类",
        usage: "了解系统中的模型是如何分类的，便于系统性探索",
        parameters: {
          lang: "语言选择"
        },
        example_command: `{
  "lang": "${lang}"
}`
      }
    ],
    secondary_tools: [
      {
        tool: "get-model-details",
        description: "获取思维模型的详细信息",
        usage: "深入了解特定模型的定义、用途、限制等",
        related_to: ["list-models", "search-models", "get-related-models"]
      },
      {
        tool: "get-related-models",
        description: "获取与特定模型相关的其他模型",
        usage: "基于一个你感兴趣的模型，发现其他相关模型",
        related_to: ["get-model-details"]
      }
    ]
  };
}

// 生成问题解决工具指南
function generateProblemSolvingToolsGuide(expertiseLevel: string, lang: SupportedLanguage) {
  return {
    primary_tools: [
      {
        tool: "recommend-models-for-problem",
        description: "基于问题关键词推荐适合的思维模型",
        usage: expertiseLevel === "beginner" ? "最直接实用的工具，直接输入你的问题关键词，获取推荐模型" : "支持基于学习系统动态调整推荐结果，提高准确性",
        parameters: {
          problem_keywords: "问题关键词数组",
          problem_context: "可选，问题的完整描述",
          lang: "语言选择",
          limit: "可选，限制返回结果数量",
          use_learning_adjustment: "是否使用学习系统调整结果"
        },
        example_command: `{
  "problem_keywords": ["团队冲突", "沟通障碍", "效率低下"],
  "problem_context": "我们团队在远程工作时遇到了沟通不畅和效率下降的问题",
  "lang": "${lang}",
  "limit": 3
}`
      },
      {
        tool: "interactive-reasoning",
        description: "交互式推理过程指导",
        usage: "引导你一步步思考问题，基于不同推理阶段提供指导",
        parameters: {
          initialContext: "初始问题或情境描述",
          reasoningStage: "当前推理阶段",
          requiredInformation: "需要获取的额外信息",
          lang: "语言选择"
        },
        example_command: `{
  "initialContext": "我需要决定是否推进一个新产品项目",
  "reasoningStage": "information_gathering",
  "lang": "${lang}"
}`
      },
      {
        tool: "generate-validate-hypotheses",
        description: "为问题生成多个假设并提供验证方法",
        usage: "对于复杂问题，生成多角度的解释假设，并提供验证方法",
        parameters: {
          problem: "要解决的问题",
          context: "问题相关的背景信息",
          lang: "语言选择"
        },
        example_command: `{
  "problem": "我们的网站转化率近期大幅下降",
  "context": "上个月我们更新了网站设计，同时也修改了注册流程",
  "lang": "${lang}"
}`
      }
    ],
    secondary_tools: [
      {
        tool: "explain-reasoning-process",
        description: "解释模型的推理过程和应用的思维模式",
        usage: "记录和解释你的思考过程，使推理更透明",
        related_to: ["interactive-reasoning"]
      },
      {
        tool: "get-model-details",
        description: "获取思维模型的详细信息",
        usage: "深入了解推荐模型的应用方法和局限性",
        related_to: ["recommend-models-for-problem"]
      }
    ]
  };
}

// 生成工具学习指南
function generateCompleteToolsGuide(expertiseLevel: string, lang: SupportedLanguage) {
  // 所有工具的完整指南
  const allTools = [
    {
      tool: "list-models",
      description: "列出思维模型或按分类筛选",
      category: "探索"
    },
    {
      tool: "search-models",
      description: "按关键词搜索思维模型",
      category: "探索"
    },
    {
      tool: "get-categories",
      description: "获取所有思维模型分类",
      category: "探索"
    },
    {
      tool: "get-model-details",
      description: "获取思维模型的详细信息",
      category: "探索"
    },
    {
      tool: "get-related-models",
      description: "获取与特定模型相关的其他模型",
      category: "探索"
    },
    {
      tool: "recommend-models-for-problem",
      description: "基于问题关键词推荐适合的思维模型",
      category: "问题解决"
    },
    {
      tool: "interactive-reasoning",
      description: "交互式推理过程指导",
      category: "问题解决"
    },
    {
      tool: "generate-validate-hypotheses",
      description: "为问题生成多个假设并提供验证方法",
      category: "问题解决"
    },
    {
      tool: "explain-reasoning-process",
      description: "解释模型的推理过程和应用的思维模式",
      category: "问题解决"
    },
    {
      tool: "count-models",
      description: "统计当前思维模型的总数",
      category: "系统"
    },
    {
      tool: "record-user-feedback",
      description: "记录用户对思维模型使用体验的反馈",
      category: "学习"
    },
    {
      tool: "detect-knowledge-gap",
      description: "检测用户查询中的知识缺口",
      category: "学习"
    },
    {
      tool: "get-model-usage-stats",
      description: "获取思维模型的使用统计数据",
      category: "学习"
    },
    {
      tool: "analyze-learning-system",
      description: "分析思维模型学习系统的总体状况",
      category: "学习"
    },
    {
      tool: "get-server-version",
      description: "获取思维模型MCP服务器的版本和状态信息",
      category: "系统"
    },
    {
      tool: "create-thinking-model",
      description: "创建新的思维模型并添加到系统中",
      category: "创建"
    },
    {
      tool: "delete-thinking-model",
      description: "删除不需要的思维模型文件并从系统中移除",
      category: "创建"
    },
    {
      tool: "emergent-model-design",
      description: "通过组合现有思维模型创建新的思维模型",
      category: "创建"
    }
  ];
  
  // 按类别分组工具
  const toolsByCategory: Record<string, Array<{tool: string, description: string, category: string}>> = {};
  allTools.forEach(tool => {
    if (!toolsByCategory[tool.category]) {
      toolsByCategory[tool.category] = [];
    }
    toolsByCategory[tool.category].push(tool);
  });
  
  // 为初学者添加额外说明
  if (expertiseLevel === "beginner") {
    return {
      introduction: "思维模型MCP服务器提供多种工具，按功能可分为以下几大类：",
      categories_explanation: {
        "探索": "用于浏览和了解系统中的思维模型",
        "问题解决": "用于解决具体问题和指导思考过程",
        "学习": "收集反馈并改进系统",
        "创建": "创建新的思维模型或组合现有模型",
        "系统": "查看系统状态和信息"
      },
      tools_by_category: toolsByCategory,
      beginner_recommendation: "如果您是第一次使用，建议从探索类工具开始，例如list-models和get-categories"
    };
  } else {
    // 高级用户
    return {
      tools_by_category: toolsByCategory,
      tools_relationships: generateToolsRelationshipMap("learn_tools")
    };
  }
}

// 生成创建工具指南
function generateCreationToolsGuide(expertiseLevel: string, lang: SupportedLanguage) {
  return {
    primary_tools: [
      {
        tool: "create-thinking-model",
        description: "创建新的思维模型并添加到系统中",
        usage: expertiseLevel === "beginner" ? "用于创建全新的思维模型，需要提供详细的模型信息" : "支持可视化数据和详细教学内容，可用于填补知识缺口",
        parameters: {
          id: "模型的唯一标识符",
          name: "模型的名称",
          definition: "模型的简明定义",
          purpose: "模型的主要目的和使用场景",
          category: "模型的主要分类",
          // 其他参数根据expertise_level决定是否显示详细内容
        },
        example_command: expertiseLevel === "beginner" ? 
        `{
  "id": "simple_example_model",
  "name": "简单示例模型",
  "definition": "这是一个示例模型的定义",
  "purpose": "用于展示如何创建基础模型",
  "category": "示例分类",
  "lang": "${lang}"
}` :
        `// 高级示例，包含更多字段`
      },
      {
        tool: "emergent-model-design",
        description: "通过组合现有思维模型创建新的思维模型",
        usage: "通过结合多个现有模型的概念和特性来创建创新模型",
        parameters: {
          source_model_ids: "用于组合的源模型ID列表",
          target_model_id: "新模型的唯一标识符",
          target_model_name: "新模型的名称",
          design_goal: "设计目标和用途描述",
          lang: "语言选择",
          category: "可选，新模型的主要分类",
          connection_description: "可选，描述源模型是如何组合的"
        },
        example_command: `{
  "source_model_ids": ["model_id_1", "model_id_2"],
  "target_model_id": "combined_model",
  "target_model_name": "组合模型",
  "design_goal": "结合两种思维方法解决复杂问题",
  "lang": "${lang}"
}`
      }
    ],
    secondary_tools: [
      {
        tool: "delete-thinking-model",
        description: "删除不需要的思维模型",
        usage: "删除不再需要的模型",
        related_to: ["create-thinking-model", "emergent-model-design"]
      },
      {
        tool: "detect-knowledge-gap",
        description: "检测知识缺口",
        usage: "在创建新模型前，可以先检测系统中的知识缺口",
        related_to: ["create-thinking-model"]
      },
      {
        tool: "search-models",
        description: "搜索模型",
        usage: "在创建前搜索是否已存在类似模型",
        related_to: ["create-thinking-model", "emergent-model-design"]
      }
    ]
  };
}

// 工作流指南生成函数
function generateExploreWorkflowGuide(expertiseLevel: string) {
  const steps = [
    {
      step: 1,
      title: "了解模型分类",
      description: "使用get-categories工具了解系统中的思维模型分类",
      tool: "get-categories"
    },
    {
      step: 2,
      title: "浏览感兴趣分类中的模型",
      description: "使用list-models工具，指定特定分类，浏览其中的模型",
      tool: "list-models"
    },
    {
      step: 3,
      title: "查看特定模型详情",
      description: "找到感兴趣的模型后，使用get-model-details获取详细信息",
      tool: "get-model-details"
    },
    {
      step: 4,
      title: "发现相关模型",
      description: "使用get-related-models查找与当前模型相关的其他模型",
      tool: "get-related-models"
    }
  ];
  
  // 为中级和高级用户添加额外步骤
  if (expertiseLevel !== "beginner") {
    steps.push({
      step: 5,
      title: "关键词搜索特定概念",
      description: "使用search-models直接搜索特定概念或方法论",
      tool: "search-models"
    });
  }
  
  return {
    title: "模型探索流程",
    description: "有效探索思维模型库的推荐流程",
    steps
  };
}

// 生成问题解决工作流指南
function generateProblemSolvingWorkflowGuide(expertiseLevel: string) {
  return {
    title: "问题解决流程",
    description: "使用思维模型进行问题分析和解决的推荐流程",
    steps: [
      {
        step: 1,
        title: "发现相关模型",
        description: "使用recommend-models-for-problem工具，基于问题关键词找到适合的思维模型",
        tool: "recommend-models-for-problem"
      },
      {
        step: 2,
        title: "了解模型详情",
        description: "使用get-model-details工具，学习推荐模型的应用方法",
        tool: "get-model-details"
      },
      {
        step: 3,
        title: "生成假设",
        description: "使用generate-validate-hypotheses工具，为问题生成多个解释假设",
        tool: "generate-validate-hypotheses"
      },
      {
        step: 4,
        title: "结构化思考",
        description: "使用interactive-reasoning工具，进行结构化的思考过程",
        tool: "interactive-reasoning"
      },
      {
        step: 5,
        title: "记录思考过程",
        description: "使用explain-reasoning-process工具，记录和解释您的思考过程",
        tool: "explain-reasoning-process"
      }
    ]
  };
}

// 生成工具学习工作流指南
function generateToolLearningWorkflowGuide(expertiseLevel: string) {
  return {
    title: "工具学习流程",
    description: "系统性学习思维模型MCP服务器工具的推荐流程",
    steps: [
      {
        step: 1,
        title: "了解系统状态",
        description: "使用get-server-version工具，了解当前服务器状态和版本信息",
        tool: "get-server-version"
      },
      {
        step: 2,
        title: "了解模型库规模",
        description: "使用count-models工具，了解系统中有多少思维模型",
        tool: "count-models"
      },
      {
        step: 3,
        title: "探索模型分类",
        description: "使用get-categories和list-models工具，探索不同类别的思维模型",
        tool: "get-categories"
      },
      {
        step: 4,
        title: "尝试问题解决",
        description: "使用recommend-models-for-problem和interactive-reasoning工具，尝试解决一个问题",
        tool: "recommend-models-for-problem"
      },
      {
        step: 5,
        title: "提供反馈",
        description: "使用record-user-feedback工具，提供对模型使用体验的反馈",
        tool: "record-user-feedback"
      }
    ]
  };
}

// 生成创建模型工作流指南
function generateCreationWorkflowGuide(expertiseLevel: string) {
  return {
    title: "模型创建流程",
    description: "创建新思维模型的推荐流程",
    steps: [
      {
        step: 1,
        title: "检测知识缺口",
        description: "使用detect-knowledge-gap工具，识别系统中可能存在的知识缺口",
        tool: "detect-knowledge-gap"
      },
      {
        step: 2,
        title: "检查现有模型",
        description: "使用search-models工具，确认是否已有类似的思维模型",
        tool: "search-models"
      },
      {
        step: 3,
        title: "选择创建方式",
        description: "决定是从头创建新模型还是组合现有模型",
        tool: "create-thinking-model/emergent-model-design"
      },
      {
        step: 4,
        title: "创建模型",
        description: "使用create-thinking-model或emergent-model-design工具，创建新的思维模型",
        tool: "create-thinking-model"
      },
      {
        step: 5,
        title: "管理模型",
        description: "如需要，使用delete-thinking-model工具删除不再需要的模型",
        tool: "delete-thinking-model"
      }
    ]
  };
}

// 示例生成函数
function generateExploreExamples(expertiseLevel: string, lang: SupportedLanguage) {
  return [
    {
      title: "获取所有决策理论分类的思维模型",
      description: "列出决策理论分类下的所有思维模型",
      tool: "list-models",
      command: `{
  "lang": "${lang}",
  "category": "决策理论"
}`,
      expected_result: "返回所有属于'决策理论'分类的模型列表"
    },
    {
      title: "获取SWOT分析模型的详细信息",
      description: "查看SWOT分析模型的详细信息，包括定义、用途、教学内容和注意事项",
      tool: "get-model-details",
      command: `{
  "model_id": "swot_analysis",
  "fields": ["all"],
  "lang": "${lang}"
}`,
      expected_result: "返回SWOT分析模型的所有详细信息"
    }
  ];
}

// 生成问题解决示例
function generateProblemSolvingExamples(expertiseLevel: string, lang: SupportedLanguage) {
  return [
    {
      title: "为团队冲突问题推荐思维模型",
      description: "获取可能适用于解决团队冲突的思维模型",
      tool: "recommend-models-for-problem",
      command: `{
  "problem_keywords": ["团队冲突", "沟通障碍", "效率低下"],
  "problem_context": "我们团队在远程工作时遇到了沟通不畅和效率下降的问题",
  "lang": "${lang}",
  "limit": 3
}`,
      expected_result: "返回最相关的思维模型列表，可能包括冲突解决和沟通相关模型"
    },
    {
      title: "为市场营销策略生成假设",
      description: "生成多个市场营销策略假设并提供验证方法",
      tool: "generate-validate-hypotheses",
      command: `{
  "problem": "如何提高我们产品的市场份额",
  "context": "我们是一家中型科技公司，最近在竞争激烈的市场中份额停滞不前",
  "lang": "${lang}"
}`,
      expected_result: "返回多个市场营销假设及其验证方法"
    }
  ];
}

// 生成工具学习示例
function generateToolLearningExamples(expertiseLevel: string, lang: SupportedLanguage) {
  return [
    {
      title: "获取服务器版本和状态",
      description: "查看当前思维模型MCP服务器的版本和状态信息",
      tool: "get-server-version",
      command: `{}`,
      expected_result: "返回服务器版本、运行状态和模型统计信息"
    },
    {
      title: "获取所有模型分类",
      description: "查看系统中所有的思维模型分类",
      tool: "get-categories",
      command: `{
  "lang": "${lang}"
}`,
      expected_result: "返回所有思维模型分类及其子分类"
    }
  ];
}

// 生成创建模型示例
function generateCreationExamples(expertiseLevel: string, lang: SupportedLanguage) {
  return [
    {
      title: "创建简单的思维模型",
      description: "创建一个基础的思维模型示例",
      tool: "create-thinking-model",
      command: `{
  "id": "simple_example_model",
  "name": "简单示例模型",
  "definition": "这是一个示例模型的定义",
  "purpose": "用于展示如何创建基础模型",
  "category": "示例分类",
  "lang": "${lang}"
}`,
      expected_result: "成功创建新的思维模型并返回确认信息"
    },
    {
      title: "组合两个现有模型",
      description: "通过组合现有模型创建新的思维模型",
      tool: "emergent-model-design",
      command: `{
  "source_model_ids": ["first_principles_thinking", "inversion_thinking"],
  "target_model_id": "combined_principles_inversion",
  "target_model_name": "原理逆向思维",
  "design_goal": "结合第一性原理思考和逆向思维的优势，用于复杂问题的创新解决方案",
  "lang": "${lang}"
}`,
      expected_result: "成功组合模型并返回新模型信息"
    }
  ];
};

// 工具关系映射生成函数
function generateToolsRelationshipMap(userObjective: string) {
  // 不同用户目标下的工具关系图
  const maps: Record<string, any> = {
    "explore": {
      "核心工具": ["list-models", "get-categories", "search-models"],
      "详情工具": ["get-model-details", "get-related-models"],
      "工具流": "list-models → get-model-details → get-related-models"
    },
    "solve_problem": {
      "问题分析": ["recommend-models-for-problem"],
      "推理过程": ["interactive-reasoning", "generate-validate-hypotheses"],
      "记录与解释": ["explain-reasoning-process"],
      "工具流": "recommend-models-for-problem → get-model-details → interactive-reasoning → explain-reasoning-process"
    },
    "create_model": {
      "创建工具": ["create-thinking-model", "emergent-model-design"],
      "辅助工具": ["search-models", "detect-knowledge-gap"],
      "管理工具": ["delete-thinking-model"],
      "工具流": "detect-knowledge-gap → search-models → create-thinking-model/emergent-model-design"
    },
    "learn_tools": {
      "探索类": ["list-models", "search-models", "get-categories", "get-model-details", "get-related-models"],
      "问题解决类": ["recommend-models-for-problem", "interactive-reasoning", "generate-validate-hypotheses", "explain-reasoning-process"],
      "创建类": ["create-thinking-model", "emergent-model-design", "delete-thinking-model"],
      "学习类": ["record-user-feedback", "detect-knowledge-gap", "get-model-usage-stats", "analyze-learning-system"],
      "系统类": ["get-server-version", "count-models"],
      "基本工作流": "get-categories → list-models → get-model-details → recommend-models-for-problem → interactive-reasoning"
    }
  };
  
  return maps[userObjective] || maps["learn_tools"];
}

// 查找相关模型
function findRelevantModels(interestArea: string, lang: SupportedLanguage) {
  // 在模型库中查找与兴趣领域相关的模型
  const relevantModels = [];
  for (const model of MODELS[lang]) {
    const { score } = calculateQueryMatch(model, interestArea);
    if (score > 0.3) { // 相关性阈值
      relevantModels.push({
        id: model.id,
        name: model.name,
        relevance_score: score,
        definition: model.definition
      });
    }
  }
  
  // 按相关性排序并限制返回数量
  return relevantModels
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5);
}

// 分析兴趣领域，识别相关分类
function analyzeInterestArea(interestArea: string, lang: SupportedLanguage) {
  // 分析兴趣领域，识别可能的相关分类
  const relevantCategories = new Set<string>();
  
  // 获取所有分类
  const allCategories: Record<string, Set<string>> = {};
  for (const model of MODELS[lang]) {
    const category = model.category || "未分类";
    if (!allCategories[category]) {
      allCategories[category] = new Set<string>();
    }
    
    const subcats = model.subcategories || [];
    subcats.forEach(subcat => allCategories[category].add(subcat));
  }
  
  // 计算每个分类与兴趣领域的相关度
  const categoryRelevance = [];
  for (const [category, subcategories] of Object.entries(allCategories)) {
    const combinedText = `${category} ${Array.from(subcategories).join(" ")}`;
    let score = 0;
    
    // 简单相关度计算
    const interestWords = interestArea.toLowerCase().split(/\s+/);
    const categoryWords = combinedText.toLowerCase().split(/\s+/);
    
    for (const word of interestWords) {
      if (categoryWords.some(w => w.includes(word) || word.includes(w))) {
        score += 1;
      }
    }
    
    if (score > 0) {
      categoryRelevance.push({
        category,
        subcategories: Array.from(subcategories),
        relevance_score: score / interestWords.length
      });
    }
  }
  
  return categoryRelevance
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 3);
}

// 生成学习路径建议
function generateLearningPath(userObjective: string, expertiseLevel: string, lang: SupportedLanguage) {
  // 根据用户目标和经验水平生成学习路径
  const paths: Record<string, Record<string, string[]>> = {
    "beginner": {
      "explore": [
        "从get-categories开始了解模型分类",
        "使用list-models浏览感兴趣的分类",
        "通过get-model-details深入了解特定模型",
        "尝试使用get-related-models发现关联模型"
      ],
      "solve_problem": [
        "使用recommend-models-for-problem找到适合问题的思维模型",
        "通过get-model-details了解推荐模型的详情",
        "尝试interactive-reasoning进行结构化思考",
        "使用explain-reasoning-process记录思考过程"
      ],
      "create_model": [
        "先使用search-models确认是否已有类似模型",
        "学习现有模型的结构和格式",
        "使用create-thinking-model创建简单的思维模型",
        "尝试emergent-model-design组合现有模型"
      ],
      "learn_tools": [
        "了解系统中的模型分类 (get-categories)",
        "学习如何浏览和搜索模型 (list-models, search-models)",
        "学习如何获取详细信息 (get-model-details)",
        "尝试问题解决工具 (recommend-models-for-problem)",
        "学习如何提供反馈 (record-user-feedback)"
      ]
    },
    "intermediate": {
      "explore": [
        "使用search-models进行高级关键词搜索",
        "探索不同分类之间的模型关联",
        "尝试比较不同但相关的思维模型",
        "寻找特定领域的专业模型"
      ],
      "solve_problem": [
        "结合多个思维模型解决复杂问题",
        "使用generate-validate-hypotheses进行深入假设验证",
        "在reasoning过程中整合多方面考虑",
        "使用反馈数据优化模型选择"
      ],
      "create_model": [
        "探索知识缺口，确定创建方向",
        "分析现有模型的优缺点，发现改进空间",
        "使用emergent-model-design创建创新组合模型",
        "为模型添加可视化数据提升理解"
      ],
      "learn_tools": [
        "学习工具之间的协同使用方式",
        "探索学习系统的功能 (analyze-learning-system)",
        "了解复杂推理工具的高级应用",
        "学习模型创建和组合的高级技巧"
      ]
    },
    "advanced": {
      "explore": [
        "使用API进行批量模型数据分析",
        "寻找模型间的深层次联系",
        "分析模型使用数据来优化探索路径",
        "探索跨领域模型应用"
      ],
      "solve_problem": [
        "构建自定义思考框架组合多个模型",
        "整合反馈数据优化推理过程",
        "开发特定领域的问题解决方法论",
        "使用学习系统数据优化推荐算法"
      ],
      "create_model": [
        "基于学习系统分析开发创新模型",
        "构建复杂的多模型整合系统",
        "开发具有高度专业性的领域模型",
        "创建带有交互式教学内容的高级模型"
      ],
      "learn_tools": [
        "探索系统API的完整功能",
        "尝试开发自定义工具扩展",
        "优化工作流程自动化",
        "掌握高级数据分析和模型管理技巧"
      ]
    }
  };
  
  return paths[expertiseLevel]?.[userObjective] || paths["beginner"][userObjective];
}

// 生成起点建议
function generateStartingPoint(userObjective: string, relevantModels: any[], expertiseLevel: string, lang: SupportedLanguage) {
  // 根据用户目标和兴趣生成起点建议
  if (relevantModels.length === 0) {
    return null;
  }
  
  const topModel = relevantModels[0];
  
  switch (userObjective) {
    case "explore":
      return {
        suggestion: `开始探索"${topModel.name}"模型`,
        command: `{
  "model_id": "${topModel.id}",
  "fields": ["all"],
  "lang": "${lang}"
}`,
        tool: "get-model-details"
      };
    case "solve_problem":
      return {
        suggestion: `使用"${topModel.name}"模型开始分析问题`,
        command: `{
  "initialContext": "我想使用${topModel.name}分析我的问题",
  "reasoningStage": "information_gathering",
  "lang": "${lang}"
}`,
        tool: "interactive-reasoning"
      };
    case "create_model":
      return {
        suggestion: `基于"${topModel.name}"开始创建或组合模型`,
        command: `{
  "source_model_ids": ["${topModel.id}", "另一个相关模型ID"],
  "target_model_id": "new_combined_model",
  "target_model_name": "新组合模型",
  "design_goal": "创建一个基于${topModel.name}但有新特性的模型",
  "lang": "${lang}"
}`,
        tool: "emergent-model-design"
      };
    default:
      return {
        suggestion: `了解系统中的思维模型分类`,
        command: `{
  "lang": "${lang}"
}`,
        tool: "get-categories"
      };
  }
}

// 获取数据目录路径
function getDataDirectory(): string {
  // 始终使用默认数据目录
  return path.resolve(__dirname, '..', 'data');
}

// 主程序入口
async function main() {
  // 获取数据目录
  const dataDir = getDataDirectory();
  
  try {
    log("思维模型 MCP Server 初始化中...");
    log(`数据存储目录: ${dataDir}`);
    
    // 确保数据目录存在
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
      log(`已创建数据目录: ${dataDir}`);
    }
    
    // stdio 模式
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