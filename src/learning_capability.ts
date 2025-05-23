/**
 * 学习能力模块 - 实现思维模型系统的学习和改进能力
 */

import { ThinkingModel } from './types.js';
import { log } from './utils.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateQueryMatch } from './similarity_engine.js';

// 兼容ESM的__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 用户反馈类型
 */
export enum FeedbackType {
  HELPFUL = 'helpful',        // 有帮助的
  NOT_HELPFUL = 'not_helpful', // 无帮助的
  INCORRECT = 'incorrect',    // 不正确的
  INSIGHTFUL = 'insightful',  // 有见解的
  CONFUSING = 'confusing'     // 令人困惑的
}

/**
 * 用户反馈结构
 */
export interface UserFeedback {
  feedbackId: string;         // 反馈ID
  timestamp: number;          // 时间戳
  modelIds: string[];         // 相关模型ID
  context: string;            // 使用上下文
  feedbackType: FeedbackType; // 反馈类型
  comment?: string;           // 用户评论
  applicationResult?: string; // 应用结果
  suggestedImprovements?: string[]; // 建议改进
}

/**
 * 知识缺口记录
 */
export interface KnowledgeGap {
  gapId: string;              // 缺口ID
  description: string;        // 描述
  detectionCount: number;     // 检测次数
  relatedQueries: string[];   // 相关查询
  possibleTags: string[];     // 可能的标签
  suggestedModels?: string[]; // 建议的相关模型
  createdAt: number;          // 创建时间
  updatedAt: number;          // 更新时间
}

/**
 * 模型使用统计
 */
export interface ModelUsageStats {
  modelId: string;            // 模型ID
  usageCount: number;         // 使用次数
  averageHelpfulness: number; // 平均有用性(0-1)
  positiveCount: number;      // 正面反馈次数
  negativeCount: number;      // 负面反馈次数
  commonContexts: string[];   // 常见使用上下文
}

/**
 * 学习系统状态
 */
interface LearningSystemState {
  userFeedbacks: UserFeedback[];
  knowledgeGaps: KnowledgeGap[];
  modelUsageStats: Record<string, ModelUsageStats>;
  lastUpdated: number;
}

// 默认的系统状态
const defaultSystemState: LearningSystemState = {
  userFeedbacks: [],
  knowledgeGaps: [],
  modelUsageStats: {},
  lastUpdated: Date.now()
};

// 内存中的系统状态
let systemState: LearningSystemState = { ...defaultSystemState };

// 状态文件路径
const getStateFilePath = () => {
  // 始终使用默认数据目录
  const dataDir = path.resolve(__dirname, '..', 'data');
  return path.resolve(dataDir, 'learning_state.json');
};

/**
 * 加载学习系统状态
 */
export async function loadLearningSystemState(): Promise<void> {
  try {
    // 确保目录存在
    const stateDir = path.dirname(getStateFilePath());
    try {
      await fs.access(stateDir);
    } catch {
      await fs.mkdir(stateDir, { recursive: true });
      log('创建学习系统数据目录');
    }
    
    // 读取状态文件
    const stateData = await fs.readFile(getStateFilePath(), 'utf-8');
    systemState = JSON.parse(stateData);
    log(`学习系统状态加载完成，包含 ${systemState.userFeedbacks.length} 条反馈和 ${systemState.knowledgeGaps.length} 个知识缺口`);
  } catch (error) {
    log('加载学习系统状态失败，使用默认状态');
    systemState = { ...defaultSystemState };
    await saveLearningSystemState();
  }
}

/**
 * 保存学习系统状态
 */
export async function saveLearningSystemState(): Promise<void> {
  try {
    systemState.lastUpdated = Date.now();
    await fs.writeFile(getStateFilePath(), JSON.stringify(systemState, null, 2), 'utf-8');
    log('学习系统状态已保存');
  } catch (error: any) {
    log(`保存学习系统状态失败: ${error.message}`);
  }
}

/**
 * 记录用户反馈
 */
export function recordUserFeedback(
  modelIds: string[],
  context: string,
  feedbackType: FeedbackType,
  comment?: string,
  applicationResult?: string,
  suggestedImprovements?: string[]
): UserFeedback {
  const timestamp = Date.now();
  const feedbackId = `feedback_${timestamp}_${Math.floor(Math.random() * 10000)}`;
  
  const feedback: UserFeedback = {
    feedbackId,
    timestamp,
    modelIds,
    context,
    feedbackType,
    comment,
    applicationResult,
    suggestedImprovements
  };
  
  // 添加到内存状态
  systemState.userFeedbacks.push(feedback);
  
  // 更新模型使用统计
  modelIds.forEach(modelId => {
    if (!systemState.modelUsageStats[modelId]) {
      systemState.modelUsageStats[modelId] = {
        modelId,
        usageCount: 0,
        averageHelpfulness: 0,
        positiveCount: 0,
        negativeCount: 0,
        commonContexts: []
      };
    }
    
    const stats = systemState.modelUsageStats[modelId];
    stats.usageCount++;
    
    // 更新有用性数据
    if (feedbackType === FeedbackType.HELPFUL || feedbackType === FeedbackType.INSIGHTFUL) {
      stats.positiveCount++;
    } else if (feedbackType === FeedbackType.NOT_HELPFUL || feedbackType === FeedbackType.INCORRECT || feedbackType === FeedbackType.CONFUSING) {
      stats.negativeCount++;
    }
    
    stats.averageHelpfulness = stats.positiveCount / (stats.positiveCount + stats.negativeCount) || 0;
    
    // 保存上下文片段（仅保存前100个字符作为关键上下文）
    if (context && context.length > 0) {
      const contextSummary = context.substring(0, 100) + (context.length > 100 ? '...' : '');
      if (!stats.commonContexts.includes(contextSummary)) {
        stats.commonContexts = [...stats.commonContexts, contextSummary].slice(-5); // 保留最近的5个上下文
      }
    }
  });
  
  // 异步保存状态
  saveLearningSystemState().catch(() => {}); // 忽略保存错误
  
  return feedback;
}

/**
 * 检测和记录知识缺口
 */
export function detectKnowledgeGap(query: string, matchedModels: ThinkingModel[], matchThreshold: number = 0.5): KnowledgeGap | null {
  // 检查是否匹配度都很低，表明可能存在知识缺口
  const hasSignificantMatch = matchedModels.some(model => {
    const { score } = calculateQueryMatch(model, query);
    return score >= matchThreshold;
  });
  
  if (hasSignificantMatch) {
    return null; // 有足够匹配度的模型，不是知识缺口
  }
  
  // 提取可能的标签
  const keywords = query.toLowerCase().split(/\s+/)
    .filter(word => word.length > 3) // 忽略短词
    .slice(0, 5); // 最多取5个关键词
  
  // 检查是否已有类似的知识缺口
  let existingGap = systemState.knowledgeGaps.find(gap => {
    // 简单检查：如果有超过50%的关键词匹配，认为是相似的知识缺口
    const matchingKeywords = keywords.filter(keyword => 
      gap.description.toLowerCase().includes(keyword) || 
      gap.relatedQueries.some(q => q.toLowerCase().includes(keyword))
    );
    return matchingKeywords.length >= Math.max(1, Math.floor(keywords.length * 0.5));
  });
  
  const timestamp = Date.now();
  
  if (existingGap) {
    // 更新现有知识缺口
    existingGap.detectionCount++;
    existingGap.updatedAt = timestamp;
    if (!existingGap.relatedQueries.includes(query)) {
      existingGap.relatedQueries.push(query);
    }
    
    // 异步保存状态
    saveLearningSystemState().catch(() => {});
    
    return existingGap;
  } else {
    // 创建新的知识缺口
    const gapId = `gap_${timestamp}_${Math.floor(Math.random() * 10000)}`;
    const newGap: KnowledgeGap = {
      gapId,
      description: query,
      detectionCount: 1,
      relatedQueries: [query],
      possibleTags: keywords,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    systemState.knowledgeGaps.push(newGap);
    
    // 异步保存状态
    saveLearningSystemState().catch(() => {});
    
    return newGap;
  }
}

/**
 * 获取模型的使用统计
 */
export function getModelUsageStats(modelId: string): ModelUsageStats | null {
  return systemState.modelUsageStats[modelId] || null;
}

/**
 * 获取知识缺口列表
 */
export function getKnowledgeGaps(limit: number = 10): KnowledgeGap[] {
  // 按检测次数降序排序
  return [...systemState.knowledgeGaps]
    .sort((a, b) => b.detectionCount - a.detectionCount)
    .slice(0, limit);
}

/**
 * 获取模型的反馈历史
 */
export function getModelFeedbackHistory(modelId: string): UserFeedback[] {
  return systemState.userFeedbacks.filter(feedback => 
    feedback.modelIds.includes(modelId)
  );
}

/**
 * 分析模型使用模式并生成洞察
 */
export function analyzeModelUsage(): Record<string, any> {
  const allStats = Object.values(systemState.modelUsageStats);
  
  // 按使用频率排序的模型
  const mostUsedModels = [...allStats]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5)
    .map(stat => ({
      modelId: stat.modelId,
      usageCount: stat.usageCount
    }));
    
  // 按有效性排序的模型（有正面反馈且使用次数至少有3次）
  const mostEffectiveModels = [...allStats]
    .filter(stat => stat.usageCount >= 3)
    .sort((a, b) => b.averageHelpfulness - a.averageHelpfulness)
    .slice(0, 5)
    .map(stat => ({
      modelId: stat.modelId,
      helpfulness: stat.averageHelpfulness,
      usageCount: stat.usageCount
    }));
    
  // 按问题反馈排序的模型（可能需要改进的）
  const problemModels = [...allStats]
    .filter(stat => stat.usageCount >= 3 && stat.negativeCount > stat.positiveCount)
    .sort((a, b) => (b.negativeCount / b.usageCount) - (a.negativeCount / a.usageCount))
    .slice(0, 5)
    .map(stat => ({
      modelId: stat.modelId,
      negativeRatio: stat.negativeCount / stat.usageCount,
      negativeCount: stat.negativeCount,
      usageCount: stat.usageCount
    }));
    
  return {
    totalFeedbackCount: systemState.userFeedbacks.length,
    activeModelsCount: allStats.length,
    mostUsedModels,
    mostEffectiveModels,
    problemModels,
    knowledgeGapsCount: systemState.knowledgeGaps.length
  };
}

/**
 * 基于学习的模型推荐调整
 * 利用过去的使用统计来提高推荐质量
 */
export function adjustModelRecommendations(
  recommendedModels: { id: string; score: number }[],
  context: string
): { id: string; score: number; adjustment_reason?: string }[] {
  // 如果没有足够的反馈数据，直接返回原始推荐
  if (systemState.userFeedbacks.length < 5) {
    return recommendedModels;
  }
  
  return recommendedModels.map(rec => {
    const modelStats = systemState.modelUsageStats[rec.id];
    let adjustedScore = rec.score;
    let adjustmentReason: string | undefined = undefined;
    
    if (modelStats) {
      // 基于历史有效性调整分数
      if (modelStats.usageCount >= 3) {
        // 有效性增强
        if (modelStats.averageHelpfulness > 0.7) {
          adjustedScore *= 1.2; // 增加20%的分数
          adjustmentReason = "历史反馈表现优秀";
        } 
        // 有效性降低
        else if (modelStats.averageHelpfulness < 0.3) {
          adjustedScore *= 0.8; // 减少20%的分数
          adjustmentReason = "历史反馈表现不佳";
        }
      }
      
      // 检查上下文相似性
      const hasRelevantContext = modelStats.commonContexts.some(ctx => 
        context.includes(ctx.replace('...', '')) || 
        ctx.replace('...', '').includes(context.substring(0, 50))
      );
      
      if (hasRelevantContext) {
        adjustedScore *= 1.1; // 增加10%的分数
        adjustmentReason = adjustmentReason 
          ? `${adjustmentReason}，且在类似上下文中使用过` 
          : "在类似上下文中使用过";
      }
    }
    
    return {
      id: rec.id,
      score: adjustedScore,
      adjustment_reason: adjustmentReason
    };
  }).sort((a, b) => b.score - a.score);
}
