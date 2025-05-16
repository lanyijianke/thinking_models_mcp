/**
 * 推理过程模块 - 实现思维模型推理过程的透明化
 */

import { ThinkingModel } from './types.js';
import { log } from './utils.js';

/**
 * 推理过程记录结构
 */
export interface ReasoningStep {
  stepId: number;          // 步骤ID
  description: string;     // 步骤描述
  evidence: string[];      // 支持证据
  confidence: number;      // 置信度(0-1)
  modelIds?: string[];     // 应用的思维模型ID
  nextSteps?: number[];    // 后续步骤ID
}

/**
 * 推理路径结构
 */
export interface ReasoningPath {
  pathId: string;
  steps: ReasoningStep[];
  conclusion: string;
  confidenceScore: number;
}

/**
 * 格式化推理路径为可读的结构化文本
 */
export function formatReasoningPath(path: ReasoningPath, models: Record<string, ThinkingModel>): string {
  let output = `# 推理路径 ${path.pathId}\n\n`;
  output += `## 结论\n${path.conclusion}\n\n`;
  output += `## 整体置信度: ${(path.confidenceScore * 100).toFixed(1)}%\n\n`;
  output += `## 推理步骤\n\n`;
  
  for (const step of path.steps) {
    output += `### 步骤 ${step.stepId}: ${step.description}\n`;
    output += `- 置信度: ${(step.confidence * 100).toFixed(1)}%\n`;
    
    if (step.modelIds && step.modelIds.length > 0) {
      output += "- 应用的思维模型:\n";
      for (const modelId of step.modelIds) {
        const model = models[modelId];
        if (model) {
          output += `  - ${model.name}: ${model.definition || '无定义'}\n`;
        } else {
          output += `  - ${modelId} (未找到模型信息)\n`;
        }
      }
    }
    
    if (step.evidence && step.evidence.length > 0) {
      output += "- 支持证据:\n";
      for (const evidence of step.evidence) {
        output += `  - ${evidence}\n`;
      }
    }
    
    output += "\n";
  }
  
  return output;
}

/**
 * 创建一个新的推理路径
 */
export function createReasoningPath(initialStep: string, modelIds: string[] = []): ReasoningPath {
  const pathId = `path_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  return {
    pathId,
    steps: [
      {
        stepId: 1,
        description: initialStep,
        evidence: [],
        confidence: 0.8,
        modelIds
      }
    ],
    conclusion: "",
    confidenceScore: 0.8
  };
}

/**
 * 向推理路径添加新的步骤
 */
export function addReasoningStep(
  path: ReasoningPath,
  description: string,
  evidence: string[] = [],
  confidence: number = 0.8,
  modelIds: string[] = []
): ReasoningPath {
  const newPath = { ...path };
  const newStepId = newPath.steps.length + 1;
  
  newPath.steps.push({
    stepId: newStepId,
    description,
    evidence,
    confidence,
    modelIds
  });
  
  // 更新上一步的nextSteps引用
  if (newPath.steps.length > 1) {
    const lastStep = newPath.steps[newPath.steps.length - 2];
    lastStep.nextSteps = [...(lastStep.nextSteps || []), newStepId];
  }
  
  // 重新计算整体置信度 (简单取平均)
  const totalConfidence = newPath.steps.reduce((sum, step) => sum + step.confidence, 0);
  newPath.confidenceScore = totalConfidence / newPath.steps.length;
  
  return newPath;
}

/**
 * 设置推理路径的结论
 */
export function setReasoningConclusion(path: ReasoningPath, conclusion: string): ReasoningPath {
  return {
    ...path,
    conclusion
  };
}

/**
 * 可视化推理路径为图形描述（用于前端渲染）
 */
export function visualizeReasoningPath(path: ReasoningPath): Record<string, any> {
  // 生成可视化数据结构
  const nodes = path.steps.map(step => ({
    id: `step_${step.stepId}`,
    label: `步骤 ${step.stepId}`,
    title: step.description,
    value: step.confidence
  }));
  
  // 添加结论节点
  if (path.conclusion) {
    nodes.push({
      id: 'conclusion',
      label: '结论',
      title: path.conclusion,
      value: path.confidenceScore
    });
  }
  
  // 生成连接
  const edges = [];
  
  for (let i = 0; i < path.steps.length - 1; i++) {
    const currentStep = path.steps[i];
    const nextStep = path.steps[i + 1];
    
    edges.push({
      from: `step_${currentStep.stepId}`,
      to: `step_${nextStep.stepId}`,
      arrows: 'to'
    });
  }
  
  // 最后一步连接到结论
  if (path.conclusion) {
    const lastStep = path.steps[path.steps.length - 1];
    edges.push({
      from: `step_${lastStep.stepId}`,
      to: 'conclusion',
      arrows: 'to'
    });
  }
  
  return {
    nodes,
    edges
  };
}
