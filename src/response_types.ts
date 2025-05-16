/**
 * 标准化的响应类型 - 统一各工具返回结果的格式
 */

import { ThinkingModel } from './types.js';

/** 基础模型信息 */
export interface BaseModelInfo {
  id: string;
  name: string;
  definition?: string;
  purpose?: string;
  category?: string;
  subcategories?: string[];
}

/** 模型搜索结果 */
export interface ModelSearchResult extends BaseModelInfo {
  match_score: number;     // 匹配得分
  match_reasons: string[]; // 匹配原因
}

/** 模型推荐结果 */
export interface ModelRecommendation extends BaseModelInfo {
  relevance_score: number; // 相关度得分
  match_reasons: string[]; // 匹配原因
}

/** 分类信息结果 */
export interface CategoryInfo {
  [category: string]: string[]; // 分类名称 -> 子分类数组
}

/** 详细模型信息 */
export interface DetailedModelInfo extends BaseModelInfo {
  tags?: string[];
  detail?: {
    definition: string;
    purpose: string;
    use_cases: string[];
  };
  teaching?: Array<{
    concept_name: string;
    explanation: string;
  }>;
  warnings?: {
    limitations: Array<{
      limitation_name: string;
      description: string;
    }>;
    common_pitfalls: Array<{
      pitfall_name: string;
      description: string;
    }>;
  };
  visualizations?: Array<{
    title: string;
    type: string;
    data: any;
    description?: string;
  }>;
  common_problems_solved?: Array<{
    problem_description: string;
    keywords: string[];
    guiding_questions?: string[];
  }>;
}

/**
 * 将原始模型转换为基础模型信息
 * @param model 原始思维模型
 * @returns 基础模型信息
 */
export function toBaseModelInfo(model: ThinkingModel): BaseModelInfo {
  return {
    id: model.id,
    name: model.name,
    definition: model.definition || "",
    purpose: model.purpose || "",
    category: model.category || "",
    subcategories: model.subcategories || []
  };
}

/**
 * 构造标准API响应
 * @param data 响应数据
 * @returns 符合MCP格式的响应对象
 */
export function createApiResponse(data: any) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify(data, null, 2)
    }]
  };
}

/**
 * 构造错误响应
 * @param message 错误消息
 * @returns 符合MCP格式的错误响应对象
 */
export function createErrorResponse(message: string) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({ error: "服务异常", message }, null, 2)
    }]
  };
}
