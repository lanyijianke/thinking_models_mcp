// 定义可视化数据的具体类型
export interface FlowchartDslData {
  dsl: string; 
}

export interface BarChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
  }>;
}

export interface TableData {
  headers: string[];
  rows: Array<Array<string | number | boolean>>; 
}

export interface ListData {
  items: Array<{
    text: string;
    subItems?: ListData['items']; 
  }>;
}

export interface ComparisonTableData {
  criteria: string[]; 
  items: Array<{
    name: string; 
    values: Array<string | number | boolean>; 
  }>;
}

export interface ThinkingModel {
  id: string;
  name: string;
  definition?: string;
  purpose?: string;
  category?: string;
  subcategories?: string[];
  tags?: string[];
  use_cases?: string[];
  common_problems_solved?: Array<{
    problem_description: string;
    keywords: string[];
    guiding_questions?: string[];
  }>;
  visualizations?: Array<{
    title: string;
    type: "flowchart_dsl" | "bar_chart_data" | "table_data" | "list_items" | "comparison_table";
    data: FlowchartDslData | BarChartData | TableData | ListData | ComparisonTableData;
    description?: string;
  }>;
  popular_science_teaching?: Array<{
    concept_name: string;
    explanation: string;
  }>;
  limitations?: Array<{
    limitation_name: string;
    description: string;
  }>;
  common_pitfalls?: Array<{
    pitfall_name: string;
    description: string;
  }>;
}

export interface LlmRelatedModel {
  id: string;
  name: string;
  relevance_score: number;
  reasons: string[];
}
