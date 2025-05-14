import { ThinkingModel } from './types.js';
import { log } from './utils.js';

export type SupportedLanguage = 'zh' | 'en';

/**
 * 使用大语言模型生成相关思维模型推荐
 * @param openRouterClient OpenRouter客户端
 * @param source_model 源模型
 * @param candidateModels 候选模型
 * @param lang 语言
 * @returns 推荐模型列表
 */
export async function getLlmRecommendations(
  openRouterClient: any,
  source_model: ThinkingModel, 
  candidateModels: ThinkingModel[], 
  lang: SupportedLanguage
) {
  try {
    // 准备源模型摘要信息
    const sourceModelSummary = {
      id: source_model.id,
      name: source_model.name,
      definition: source_model.definition || "",
      purpose: source_model.purpose || "",
      category: source_model.category || "",
      subcategories: source_model.subcategories || [],
      tags: source_model.tags || [],
      use_cases: source_model.use_cases || [],
      problem_keywords: source_model.common_problems_solved?.flatMap(p => p.keywords) || [],
      problem_descriptions: source_model.common_problems_solved?.map(p => p.problem_description).slice(0, 3) || []
    };
    
    // 准备候选模型列表（简化版以减少token数量）
    const candidateModelsSummary = candidateModels.map(m => ({
      id: m.id,
      name: m.name,
      definition: m.definition || "",
      purpose: m.purpose || "",
      category: m.category || "",
      subcategories: m.subcategories || [],
      tags: m.tags || [],
      use_cases: m.use_cases || []
    }));
    
    // 构建提示词
    const prompt = `作为一个先进的思维模型推荐系统，请为给定的思维模型推荐5个最相关的其他模型。
请分析源模型和候选模型之间的深层语义关系，考虑以下因素：
1. 概念和应用场景的相似性
2. 互补性与协同效应
3. 思维方式和认知过程的相关性
4. 解决问题类型的相似性
5. 方法论层面的关联

源模型信息：
${JSON.stringify(sourceModelSummary, null, 2)}

候选模型列表（共${candidateModelsSummary.length}个）：
${JSON.stringify(candidateModelsSummary.slice(0, 20), null, 2)}
${candidateModelsSummary.length > 20 ? `...以及${candidateModelsSummary.length - 20}个其他模型` : ''}

请选择5个最相关的模型，结果以JSON数组格式返回，包括以下字段：
1. id: 模型ID
2. name: 模型名称
3. relevance_score: 相关性分数(0.0-1.0)
4. reasons: 相关性理由(字符串数组)

你的回答必须仅包含JSON数组，不要包含其他文字。`;

    try {
      // 调用LLM获取推荐
      log(`向OpenRouter发送思维模型推荐请求，提示词长度: ${prompt.length} 字符`);
      const llmResponse = await openRouterClient.getCompletion({ 
        prompt,
        maxTokens: 2000,
        temperature: 0.2
      });
      
      if (!llmResponse) {
        log(`OpenRouter返回空响应`);
        return null;
      }
      
      // 尝试解析LLM响应为JSON
      try {
        const cleanResponse = llmResponse.trim().replace(/```json|```/g, '');
        log(`正在尝试解析LLM响应为JSON，响应长度: ${cleanResponse.length} 字符`);
        
        const relatedModels = JSON.parse(cleanResponse);
        
        if (!Array.isArray(relatedModels)) {
          log(`LLM响应不是有效的数组`);
          return null;
        }
        
        if (relatedModels.length === 0) {
          log(`LLM返回了空数组`);
          return null;
        }
        
        // 验证响应数据结构并过滤无效模型
        const validModels = relatedModels.filter(model => 
          model && typeof model === 'object' && model.id && model.name
        );
        
        if (validModels.length === 0) {
          log('所有推荐模型都缺少必要字段');
          return null;
        }
          log(`成功解析出${validModels.length}个有效推荐模型`);
        return validModels;
      } catch (parseError) {
        log(`解析LLM响应为JSON时出错: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        log(`原始响应内容: ${llmResponse.substring(0, 200)}...`);
        return null;
      }
    } catch (apiError) {
      log(`调用OpenRouter API失败: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      return null;
    }
  } catch (error) {
    log(`使用大语言模型生成推荐出错: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
