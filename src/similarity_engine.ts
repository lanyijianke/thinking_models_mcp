/**
 * 相似度计算引擎 - 用于统一各工具间的相似度计算逻辑
 */

import { ThinkingModel } from './types.js';
import { calculateSemanticSimilarity } from './semantic_similarity_local.js';
import { log } from './utils.js';

export type MatchType = 'category' | 'subcategory' | 'tag' | 'keyword' | 'text' | 'problem' | 'use_case';
export type SupportedLanguage = 'zh' | 'en';

/** 各匹配类型的权重配置 */
export interface WeightConfig {
  category: number;      // 分类匹配权重
  subcategory: number;   // 子分类匹配权重
  tag: number;           // 标签匹配权重
  keyword: number;       // 关键词匹配权重
  text: number;          // 文本内容匹配权重
  problem: number;       // 问题匹配权重
  use_case: number;      // 使用场景匹配权重
  semantic: number;      // 语义相似度权重
}

/** 默认基础匹配权重 */
export const DEFAULT_BASIC_WEIGHTS: WeightConfig = {
  category: 3,
  subcategory: 1,
  tag: 2,
  keyword: 1.5,
  text: 1,
  problem: 2,
  use_case: 1,
  semantic: 3
};

/** 增强版匹配权重 */
export const DEFAULT_ENHANCED_WEIGHTS: WeightConfig = {
  category: 3,
  subcategory: 1,
  tag: 1.5,
  keyword: 2,
  text: 1,
  problem: 3,
  use_case: 1.5,
  semantic: 4
};

/** 相似度计算结果 */
export interface SimilarityResult {
  score: number;
  reasons: string[];
}

/** 相似度计算参数 */
export interface SimilarityParams {
  sourceModel?: ThinkingModel;        // 源模型（用于相似模型比较）
  targetModel?: ThinkingModel;        // 目标模型（用于相似模型比较）
  keywords?: string[];                // 关键词（用于问题和关键词搜索）
  query?: string;                     // 查询字符串（用于文本搜索）
  weights?: Partial<WeightConfig>;    // 自定义权重
  useSemanticSimilarity?: boolean;    // 是否使用语义相似度
}

/**
 * 计算模型间的相似度
 * @param params 相似度计算参数
 * @returns 相似度计算结果
 */
export async function calculateModelSimilarity(params: SimilarityParams): Promise<SimilarityResult> {
  const { sourceModel, targetModel, weights: userWeights = {}, useSemanticSimilarity = true } = params;
  
  // 合并用户权重与默认权重
  const weights = { ...DEFAULT_BASIC_WEIGHTS, ...userWeights };
  
  if (!sourceModel || !targetModel) {
    return { score: 0, reasons: [] };
  }
  
  let score = 0;
  const reasons: string[] = [];
  
  // 1. 分类相关度
  if (sourceModel.category === targetModel.category && sourceModel.category) {
    score += weights.category;
    reasons.push(`同属于「${sourceModel.category}」分类`);
  }
  
  // 2. 子分类相关度
  const source_subcats = new Set(sourceModel.subcategories || []);
  const common_subcats = (targetModel.subcategories || [])
    .filter(subcat => source_subcats.has(subcat));
  if (common_subcats.length > 0) {
    score += common_subcats.length * weights.subcategory;
    reasons.push(`共同的子分类：${common_subcats.join(", ")}`);
  }
  
  // 3. 标签相关度
  const source_tags = new Set(sourceModel.tags || []);
  const common_tags = (targetModel.tags || [])
    .filter(tag => source_tags.has(tag));
  if (common_tags.length > 0) {
    score += common_tags.length * weights.tag;
    reasons.push(`共同的标签：${common_tags.join(", ")}`);
  }
  
  // 4. 使用场景相关度
  const source_use_cases = new Set(sourceModel.use_cases || []);
  const common_use_cases = (targetModel.use_cases || [])
    .filter(use_case => source_use_cases.has(use_case));
  if (common_use_cases.length > 0) {
    score += common_use_cases.length * weights.use_case;
    reasons.push(`适用于相同场景：${common_use_cases.join(", ")}`);
  }
  
  // 5. 问题解决关键词相似度
  const source_problem_keywords = new Set(
    sourceModel.common_problems_solved?.flatMap(p => p.keywords.map(k => k.toLowerCase())) || []
  );
  const target_problem_keywords = targetModel.common_problems_solved?.flatMap(p => p.keywords.map(k => k.toLowerCase())) || [];
  const common_problem_keywords = target_problem_keywords
    .filter(keyword => source_problem_keywords.has(keyword));
  if (common_problem_keywords.length > 0) {
    score += common_problem_keywords.length * weights.problem;
    reasons.push(`解决相似问题的关键词：${common_problem_keywords.join(", ")}`);
  }
  
  // 6. 语义相似度计算（如果启用）
  if (useSemanticSimilarity) {
    // 定义和目的的文本相似度
    if (sourceModel.definition && targetModel.definition) {
      try {
        const defSimilarity = await calculateSemanticSimilarity(
          sourceModel.definition,
          targetModel.definition
        );
        if (defSimilarity > 0.4) { // 只有当相似度超过阈值才计分
          const similarityContribution = defSimilarity * weights.semantic;
          score += similarityContribution;
          reasons.push(`定义内容相似 (相似度: ${defSimilarity.toFixed(2)})`);
        }
      } catch (error) {
        log(`计算语义相似度时出错: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 解决的问题描述语义相似度
    const source_problem_descriptions = sourceModel.common_problems_solved
      ?.map(p => p.problem_description)
      .filter(desc => desc && desc.trim() !== "")
      .join("\n---\n");
      
    const target_problem_descriptions = targetModel.common_problems_solved
      ?.map(p => p.problem_description)
      .filter(desc => desc && desc.trim() !== "")
      .join("\n---\n");
    
    if (source_problem_descriptions && target_problem_descriptions) {
      try {
        const semanticSimilarityScore = await calculateSemanticSimilarity(
          source_problem_descriptions,
          target_problem_descriptions
        );
        if (semanticSimilarityScore > 0.4) {
          const similarityContribution = semanticSimilarityScore * weights.semantic;
          score += similarityContribution;
          reasons.push(`解决的问题主题相似 (相似度: ${semanticSimilarityScore.toFixed(2)})`);
        }
      } catch (error) {
        log(`计算问题描述语义相似度时出错: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  // 如果没有找到具体原因，增加一个通用原因
  if (reasons.length === 0 && score > 0) {
    reasons.push("整体特征相似度较高");
  }
  
  return { score, reasons };
}

/**
 * 根据关键词计算模型的相关度
 * @param model 要评估的模型
 * @param keywords 关键词数组
 * @param weights 权重配置
 * @returns 相关度计算结果
 */
export function calculateKeywordRelevance(
  model: ThinkingModel, 
  keywords: string[], 
  userWeights: Partial<WeightConfig> = {}
): SimilarityResult {
  // 合并用户权重与默认权重
  const weights = { ...DEFAULT_BASIC_WEIGHTS, ...userWeights };
  let score = 0;
  const reasons: string[] = [];
  const keywordsLower = keywords.map(k => k.toLowerCase());
  
  // 匹配 common_problems_solved.keywords
  if (model.common_problems_solved) {
    for (const prob of model.common_problems_solved) {
      const matched = keywordsLower.filter(k => prob.keywords.map(x => x.toLowerCase()).includes(k));
      if (matched.length > 0) {
        score += matched.length * weights.problem;
        reasons.push(`问题关键词匹配: ${matched.join(", ")}`);
      }
      
      // 匹配 problem_description
      for (const k of keywordsLower) {
        if (prob.problem_description.toLowerCase().includes(k)) {
          score += weights.text;
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
      score += matched.length * weights.tag;
      reasons.push(`标签匹配: ${matched.join(", ")}`);
    }
  }
  
  // 匹配 definition
  if (model.definition) {
    for (const k of keywordsLower) {
      if (model.definition.toLowerCase().includes(k)) {
        score += weights.text;
        reasons.push(`核心定义包含: ${k}`);
      }
    }
  }
  
  return { score, reasons };
}

/**
 * 基于字符串查询计算模型的匹配度
 * @param model 要评估的模型
 * @param query 查询字符串
 * @returns 匹配度计算结果
 */
export function calculateQueryMatch(model: ThinkingModel, query: string): SimilarityResult {
  let score = 0;
  const reasons: string[] = [];
  const query_lower = query.toLowerCase();
  
  // 基本信息匹配
  if (model.name.toLowerCase().includes(query_lower)) {
    score += 3;
    reasons.push("模型名称");
  }
  
  if (model.definition?.toLowerCase().includes(query_lower)) {
    score += 2;
    reasons.push("核心定义");
  }
  
  if (model.tags?.some(tag => tag.toLowerCase().includes(query_lower))) {
    score += 2;
    reasons.push("标签");
  }
  
  // 科普教学内容匹配
  if (model.popular_science_teaching?.some(
    teaching => teaching.concept_name.toLowerCase().includes(query_lower) ||
                teaching.explanation.toLowerCase().includes(query_lower)
  )) {
    score += 1;
    reasons.push("科普教学内容");
  }
  
  // 局限性匹配
  if (model.limitations?.some(
    limitation => limitation.limitation_name.toLowerCase().includes(query_lower) ||
                  limitation.description.toLowerCase().includes(query_lower)
  )) {
    score += 1;
    reasons.push("局限性说明");
  }
  
  // 常见误区匹配
  if (model.common_pitfalls?.some(
    pitfall => pitfall.pitfall_name.toLowerCase().includes(query_lower) ||
              pitfall.description.toLowerCase().includes(query_lower)
  )) {
    score += 1;
    reasons.push("常见误区");
  }
  
  // 能解决的问题
  if (model.common_problems_solved?.some(
    problem => problem.problem_description.toLowerCase().includes(query_lower) ||
                problem.keywords.some(k => k.toLowerCase().includes(query_lower))
  )) {
    score += 2;
    reasons.push("能解决的问题或关键词");
  }
  
  // 可视化
  if (model.visualizations?.some(
    viz => viz.title.toLowerCase().includes(query_lower) ||
            (viz.description && viz.description.toLowerCase().includes(query_lower))
  )) {
    score += 1;
    reasons.push("可视化标题或描述");
  }
  
  return { score, reasons };
}
