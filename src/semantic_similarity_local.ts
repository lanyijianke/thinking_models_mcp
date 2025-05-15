/**
 * 计算文本相似度的工具函数
 */

import { log } from './utils.js';

/**
 * 计算两段文本之间的语义相似度
 * 移除了OpenRouter依赖，仅使用本地算法计算
 */
export async function calculateSemanticSimilarity(
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

    // 使用Jaccard相似度
    return calculateJaccardSimilarity(normalizedText1, normalizedText2);
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
    // 使用字词分割
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 1));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 1));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    if (union.size === 0) return 0;
    
    const jaccardScore = intersection.size / union.size;
    return Math.min(0.8, jaccardScore * 1.5); // 稍微提高分数但限制最大值，模拟语义相似度
  } catch(e) {
    log(`计算Jaccard相似度时出错: ${e instanceof Error ? e.message : String(e)}`);
    return 0;
  }
}
