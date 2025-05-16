/**
 * 统一的推荐系统 - 整合不同的推荐策略和算法
 */

import { ThinkingModel } from './types.js';
import { log } from './utils.js';
import { 
  SupportedLanguage, 
  calculateModelSimilarity, 
  DEFAULT_BASIC_WEIGHTS, 
  DEFAULT_ENHANCED_WEIGHTS 
} from './similarity_engine.js';

/** 推荐系统模式 */
export enum RecommendationMode {
  ENHANCED = 'enhanced',  // 增强模式（更全面的相似度评估）
  BASIC = 'basic'         // 基础模式（轻量快速的相似度评估）
}

/** 标准化的模型推荐结果 */
export interface ModelRecommendation {
  id: string;             // 模型ID
  name: string;           // 模型名称
  definition: string;     // 模型定义
  relevance_score: number; // 相关度得分
  match_reasons: string[];  // 匹配原因
}

/**
 * 获取模型推荐
 * @param sourceModel 源模型
 * @param candidateModels 候选模型数组
 * @param lang 语言
 * @param mode 推荐模式
 * @param limit 返回的最大结果数量
 * @returns 推荐结果数组
 */
export async function getModelRecommendations(
  sourceModel: ThinkingModel,
  candidateModels: ThinkingModel[],
  lang: SupportedLanguage,
  mode: RecommendationMode = RecommendationMode.ENHANCED,
  limit: number = 5
): Promise<ModelRecommendation[]> {
  try {
    log(`开始为「${sourceModel.name}」生成${mode === RecommendationMode.ENHANCED ? '增强' : '基础'}模式的推荐`);
    
    // 根据模式选择合适的权重配置
    const weights = mode === RecommendationMode.ENHANCED 
      ? DEFAULT_ENHANCED_WEIGHTS 
      : DEFAULT_BASIC_WEIGHTS;
    
    // 根据模式决定是否使用语义相似度
    const useSemanticSimilarity = mode === RecommendationMode.ENHANCED;
    
    // 计算每个候选模型的相似度
    const scoredModelsPromises = candidateModels.map(async (candidate) => {
      const { score, reasons } = await calculateModelSimilarity({
        sourceModel,
        targetModel: candidate,
        weights,
        useSemanticSimilarity
      });
      
      if (score <= 0) return null;
      
      return {
        id: candidate.id,
        name: candidate.name,
        definition: candidate.definition || "",
        relevance_score: score,
        match_reasons: reasons
      };
    });
    
    // 等待所有相似度计算完成
    const scoredModelsWithNulls = await Promise.all(scoredModelsPromises);
    
    // 过滤掉null结果并按得分排序
    const recommendations = scoredModelsWithNulls
      .filter((result): result is ModelRecommendation => result !== null)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);
    
    log(`${mode}模式推荐系统生成了 ${recommendations.length} 个相关模型推荐`);
    return recommendations;
  } catch (error) {
    log(`生成模型推荐时出错: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}
