import { OpenRouterClient } from './openrouter_client.js';
import { log } from './utils.js';

/**
 * 使用 OpenRouter LLM 计算两段文本之间的语义相似度
 * 经过增强的错误处理和容错设计
 */
export async function calculateSemanticSimilarity(
  openRouterClient: OpenRouterClient,
  text1: string, 
  text2: string
): Promise<number> {
  try {
    // 基本验证
    if (!text1 || !text2 || text1.trim() === "" || text2.trim() === "") {
      return 0;
    }

    // 规范化文本
    const normalizeText = (text: string): string => {
      return text.replace(/\s+/g, ' ').trim().toLowerCase();
    };

    const normalizedText1 = normalizeText(text1);
    const normalizedText2 = normalizeText(text2);

    // 完全相同文本直接返回1.0
    if (normalizedText1 === normalizedText2) {
      return 1.0;
    }

    // 对于非常短的文本，使用 Jaccard 相似度而非调用LLM（节约资源）
    const MIN_TEXT_LENGTH = 20;
    if (Math.min(normalizedText1.length, normalizedText2.length) < MIN_TEXT_LENGTH) {
      return calculateJaccardSimilarity(normalizedText1, normalizedText2);
    }

    // 构建LLM查询的提示词
    const prompt = buildSimilarityPrompt(normalizedText1, normalizedText2);
    
    try {
      // 调用OpenRouter API
      const response = await openRouterClient.getCompletion({ 
        prompt,
        maxTokens: 50,  // 小数字足够了
        temperature: 0.1 // 低温度以获得一致的结果
      });
      
      if (!response || response.trim() === '') {
        log('获取相似度的OpenRouter响应为空');
        return 0;
      }
      
      // 尝试提取数字
      const score = extractScoreFromResponse(response);
      
      if (score !== null && score >= 0 && score <= 1) {
        log(`文本相似度分数: ${score.toFixed(2)} (来源: "${normalizedText1.substring(0,30)}...", "${normalizedText2.substring(0,30)}...")`);
        return score;
      } else {
        log(`无法从LLM响应中提取有效的相似度分数: "${response}"`);
        // 回退到保守的相似度估计
        return 0.1;
      }
    } catch (error) {
      log(`调用OpenRouter计算相似度时出错: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  } catch (error) {
    log(`相似度计算过程中发生错误: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
}

/**
 * 计算两个文本的Jaccard相似度
 */
function calculateJaccardSimilarity(text1: string, text2: string): number {
  try {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 1));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 1));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    if (union.size === 0) return 0;
    
    const jaccardScore = intersection.size / union.size;
    // log(`使用 Jaccard 处理短文本 ("${text1.substring(0,30)}...", "${text2.substring(0,30)}...") = ${jaccardScore.toFixed(2)}`);
    return jaccardScore;
  } catch(e) {
    log(`计算Jaccard相似度时出错: ${e instanceof Error ? e.message : String(e)}`);
    return 0;
  }
}

/**
 * 构建用于相似度计算的提示词
 */
function buildSimilarityPrompt(text1: string, text2: string): string {
  return `请评估以下两组文本之间的语义相似度。
每组可能包含一个或多个问题描述，或一个整合后的描述。
请重点考虑整体主题的相似性，而不是文字表面的相似。
请用一个介于 0.0（完全不相似）和 1.0（非常相似或相同）之间的小数来回答。
不要包含任何其他文本或解释。只输出一个小数表示的相似度值。

文本组 1:
'''
${text1}
'''

文本组 2:
'''
${text2}
'''

相似度评分 (0.0-1.0):`;
}

/**
 * 从LLM响应中提取相似度分数
 */
function extractScoreFromResponse(response: string): number | null {
  // 第一种情况：尝试精确匹配格式为"0.75"的浮点数
  const exactMatch = response.trim().match(/^(\d+\.\d+|\d+)$/);
  if (exactMatch) {
    const score = parseFloat(exactMatch[1]);
    if (!isNaN(score) && score >= 0 && score <= 1) {
      return score;
    }
  }
  
  // 第二种情况：查找响应中任何可能是相似度分数的数字
  const anyMatch = response.match(/(\d+\.\d+|\d+)/);
  if (anyMatch) {
    const score = parseFloat(anyMatch[1]);
    if (!isNaN(score) && score >= 0 && score <= 1) {
      return score;
    }
  }
  
  // 第三种情况：最后尝试将整个响应解析为数字
  const score = parseFloat(response.trim());
  if (!isNaN(score) && score >= 0 && score <= 1) {
    return score;
  }
  
  // 无法提取有效分数
  return null;
}
