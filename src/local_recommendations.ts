/**
 * 基于本地算法的模型推荐系统
 * 移除了OpenRouter依赖
 */

import { ThinkingModel } from './types.js';
import { log } from './utils.js';
import { calculateSemanticSimilarity } from './semantic_similarity_local.js';

export type SupportedLanguage = 'zh' | 'en';

/**
 * 使用本地算法生成相关思维模型推荐
 * @param source_model 源模型
 * @param candidateModels 候选模型
 * @param lang 语言
 * @returns 推荐模型列表
 */
export async function getLocalRecommendations(
  source_model: ThinkingModel, 
  candidateModels: ThinkingModel[], 
  lang: SupportedLanguage
) {
  try {
    // 使用本地算法计算相似度和相关性
    const scoredModels = await Promise.all(
      candidateModels.map(async (candidate) => {
        const score = await calculateModelRelevance(source_model, candidate);
        const reasons = generateReasonsList(source_model, candidate, score);
        
        return {
          id: candidate.id,
          name: candidate.name,
          definition: candidate.definition || "",
          relevance_score: score,
          reasons
        };
      })
    );

    // 按相关度排序
    const recommendations = scoredModels
      .filter(model => model.relevance_score > 0)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 5);

    log(`本地推荐系统生成了 ${recommendations.length} 个相关模型推荐`);
    return recommendations;
  } catch (error) {
    log(`生成本地推荐时出错: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * 计算两个模型间的相关度分数
 */
async function calculateModelRelevance(source: ThinkingModel, target: ThinkingModel): Promise<number> {
  let score = 0;

  // 分类相同
  if (source.category === target.category && source.category) {
    score += 3;
  }

  // 子分类相似度
  const source_subcats = new Set(source.subcategories || []);
  const common_subcats = (target.subcategories || [])
    .filter(subcat => source_subcats.has(subcat));
  score += common_subcats.length;

  // 标签相似度
  const source_tags = new Set(source.tags || []);
  const common_tags = (target.tags || [])
    .filter(tag => source_tags.has(tag));
  score += common_tags.length * 1.5;

  // 使用场景相似度
  const source_use_cases = new Set(source.use_cases || []);
  const common_use_cases = (target.use_cases || [])
    .filter(use_case => source_use_cases.has(use_case));
  score += common_use_cases.length;

  // 定义和目的的文本相似度
  if (source.definition && target.definition) {
    const defSimilarity = await calculateSemanticSimilarity(
      source.definition,
      target.definition
    );
    score += defSimilarity * 4;
  }

  // 问题解决关键词相似度
  const source_problem_keywords = new Set(
    source.common_problems_solved?.flatMap(p => p.keywords.map(k => k.toLowerCase())) || []
  );
  const target_problem_keywords = target.common_problems_solved?.flatMap(p => p.keywords.map(k => k.toLowerCase())) || [];
  const common_problem_keywords = target_problem_keywords
    .filter(keyword => source_problem_keywords.has(keyword));
  score += common_problem_keywords.length * 1.5;

  return score;
}

/**
 * 生成相关原因列表
 */
function generateReasonsList(source: ThinkingModel, target: ThinkingModel, score: number): string[] {
  const reasons: string[] = [];
  
  // 分类相同
  if (source.category === target.category && source.category) {
    reasons.push(`同属于「${source.category}」分类`);
  }

  // 子分类相似度
  const source_subcats = new Set(source.subcategories || []);
  const common_subcats = (target.subcategories || [])
    .filter(subcat => source_subcats.has(subcat));
  if (common_subcats.length > 0) {
    reasons.push(`共同的子分类：${common_subcats.join(", ")}`);
  }

  // 标签相似度
  const source_tags = new Set(source.tags || []);
  const common_tags = (target.tags || [])
    .filter(tag => source_tags.has(tag));
  if (common_tags.length > 0) {
    reasons.push(`共同的标签：${common_tags.join(", ")}`);
  }

  // 使用场景相似度
  const source_use_cases = new Set(source.use_cases || []);
  const common_use_cases = (target.use_cases || [])
    .filter(use_case => source_use_cases.has(use_case));
  if (common_use_cases.length > 0) {
    reasons.push(`适用于相同场景：${common_use_cases.join(", ")}`);
  }

  // 问题解决关键词相似度
  const source_problem_keywords = new Set(
    source.common_problems_solved?.flatMap(p => p.keywords.map(k => k.toLowerCase())) || []
  );
  const target_problem_keywords = target.common_problems_solved?.flatMap(p => p.keywords.map(k => k.toLowerCase())) || [];
  const common_problem_keywords = target_problem_keywords
    .filter(keyword => source_problem_keywords.has(keyword));
  if (common_problem_keywords.length > 0) {
    reasons.push(`解决相似问题的关键词：${common_problem_keywords.join(", ")}`);
  }

  // 如果没有找到具体原因，增加一个通用原因
  if (reasons.length === 0 && score > 0) {
    reasons.push("整体特征相似度较高");
  }
  
  return reasons;
}
