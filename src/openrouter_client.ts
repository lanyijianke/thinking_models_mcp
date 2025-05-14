import OpenAI from 'openai';
import { log } from './utils.js';

interface OpenRouterOptions {
  apiKey?: string; // Made optional, will try to read from env
  model?: string;  // Made optional, will try to read from env
  defaultHeaders?: Record<string, string>;
}

interface CompletionOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * OpenRouter客户端类，用于连接OpenRouter API进行模型调用
 */
export class OpenRouterClient {
  private client: OpenAI;
  private model: string;
  private apiKey: string;

  /**
   * 创建OpenRouter客户端实例
   * @param options 配置选项
   */
  constructor(options: OpenRouterOptions = {}) {
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY || "";
    this.model = options.model || process.env.OPENROUTER_MODEL_NAME || "qwen/qwen3-235b-a22b:free"; // Default model if not set

    if (!this.apiKey) {
      log("错误：OPENROUTER_API_KEY 环境变量未设置，OpenRouterClient 将无法工作。");
      // Potentially throw an error here or disable functionality that depends on OpenRouter
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.HTTP_REFERER || 'https://thinking-models-mcp.com', // 您的站点URL
        'X-Title': process.env.X_TITLE || 'Thinking Models MCP', // 您应用的标题
        ...options.defaultHeaders
      }
    });

    if (this.apiKey) { // Only log if an API key is present
        log(`OpenRouterClient initialized with model: ${this.model}`);
    } else {
        log("OpenRouterClient initialized WITHOUT API KEY. Calls will likely fail.");
    }
  }

  /**
   * 检查连接是否可用
   * @returns 如果连接可用则返回true
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.getCompletion({ prompt: 'Hello, are you working?' });
      return result !== null && result.length > 0;
    } catch (error) {
      log(`OpenRouter连接测试失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 获取文本补全结果
   * @param options 补全选项
   * @returns 生成的文本
   */  async getCompletion(options: CompletionOptions): Promise<string> {
    try {
      // 添加请求ID用于日志跟踪
      const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      log(`OpenRouter请求开始 [${requestId}], 提示词长度: ${options.prompt.length}`);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'user', content: options.prompt }
        ],
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7,
      });

      // 增加更安全的响应处理逻辑
      if (!response) {
        log(`OpenRouter返回了空响应 [${requestId}]`);
        return '';
      }
      
      if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        log(`OpenRouter返回了无效的响应格式: 缺少choices数组或为空 [${requestId}]`);
        return '';
      }
      
      const firstChoice = response.choices[0];
      if (!firstChoice || !firstChoice.message || !firstChoice.message.content) {
        log(`OpenRouter响应缺少消息内容 [${requestId}]`);
        return '';
      }
      
      const content = firstChoice.message.content;
      log(`OpenRouter请求成功 [${requestId}], 响应长度: ${content.length}`);
      return content;
    } catch (error) {
      log(`OpenRouter API调用失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 获取模型产生的思维模型建议
   * @param keywords 关键词列表
   * @returns 建议的思维模型列表
   */
  async suggestThinkingModels(keywords: string[]): Promise<any> {
    const prompt = `
基于以下关键词，生成至少3个最相关的思维模型建议，注重可行性和实用性：
关键词: ${keywords.join(', ')}

请以JSON格式返回结果，格式如下:
[
  {
    "model_name": "思维模型名称",
    "description": "简短描述",
    "relevance_reason": "与关键词的关联原因"
  }
]
只返回JSON数据，不要有其他文本。
`;

    try {
      const completion = await this.getCompletion({
        prompt,
        maxTokens: 800,
        temperature: 0.3
      });

      // 尝试解析JSON响应
      try {
        return JSON.parse(completion);
      } catch (parseError) {
        log(`无法解析AI响应为JSON: ${completion}`);
        return null;
      }
    } catch (error) {
      log(`获取思维模型建议失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 使用AI生成思维模型的解释和应用方法
   * @param modelName 思维模型名称
   * @returns 生成的解释
   */
  async generateModelExplanation(modelName: string): Promise<any> {
    const prompt = `
请详细解释思维模型"${modelName}"，包括以下方面:
1. 核心定义
2. 适用场景
3. 使用步骤
4. 案例说明
5. 常见误区

请以JSON格式返回结果:
{
  "definition": "核心定义",
  "use_cases": ["适用场景1", "适用场景2", "..."],
  "steps": ["步骤1", "步骤2", "..."],
  "examples": ["案例1", "案例2", "..."],
  "pitfalls": ["误区1", "误区2", "..."]
}
只返回JSON数据，不要有其他文本。
`;

    try {
      const completion = await this.getCompletion({
        prompt,
        maxTokens: 1200,
        temperature: 0.3
      });

      // 尝试解析JSON响应
      try {
        return JSON.parse(completion);
      } catch (parseError) {
        log(`无法解析AI响应为JSON: ${completion}`);
        return null;
      }
    } catch (error) {
      log(`生成思维模型解释失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
}
