/**
 * 天机思维模型 - 模型详情页面功能
 * 提供模型数据加载、渲染和可视化功能
 */

// 模型数据缓存
const modelCache = {};

/**
 * 从服务器加载模型详情
 * @param {string} modelId 模型ID
 * @returns {Promise} 模型数据Promise
 */
async function loadModelData(modelId) {
    // 检查缓存
    if (modelCache[modelId]) {
        return modelCache[modelId];
    }
    
    try {
        // 在实际应用中，这里应该调用MCP API
        // 例如: const response = await fetch(`/api/models/${modelId}`);
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 获取预设的模型数据（在实际应用中应从API获取）
        const data = getMockModelData(modelId);
        
        // 缓存数据
        modelCache[modelId] = data;
        
        return data;
    } catch (err) {
        console.error("加载模型数据失败:", err);
        throw new Error("无法加载模型数据，请稍后再试");
    }
}

/**
 * 渲染流程图
 * @param {string} elementId 容器元素ID
 * @param {string} dsl 流程图DSL代码
 */
function renderFlowchart(elementId, dsl) {
    // 在实际应用中，这里应该使用Mermaid.js等库渲染流程图
    // 例如: mermaid.render(elementId, dsl);
    
    const container = document.getElementById(elementId);
    if (!container) return;
    
    // 临时显示原始DSL代码
    container.innerHTML = `
        <div class="alert alert-info">
            <p class="mb-2"><strong>流程图DSL代码:</strong></p>
            <pre class="mb-0"><code>${dsl}</code></pre>
            <p class="mt-2 mb-0 text-muted small">注: 在实际应用中，这里将显示渲染后的流程图</p>
        </div>
    `;
}

/**
 * 渲染柱状图
 * @param {string} elementId 画布元素ID
 * @param {Object} chartData 图表数据
 */
function renderBarChart(elementId, chartData) {
    const ctx = document.getElementById(elementId);
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: chartData.datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: chartData.title
                }
            }
        }
    });
}

/**
 * 渲染表格
 * @param {string} elementId 容器元素ID
 * @param {Object} tableData 表格数据
 */
function renderTable(elementId, tableData) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    let tableHtml = `
        <table class="table table-bordered">
            <thead>
                <tr>
    `;
    
    // 添加表头
    tableData.headers.forEach(header => {
        tableHtml += `<th>${header}</th>`;
    });
    
    tableHtml += `
                </tr>
            </thead>
            <tbody>
    `;
    
    // 添加数据行
    tableData.rows.forEach(row => {
        tableHtml += `<tr>`;
        row.forEach(cell => {
            tableHtml += `<td>${cell}</td>`;
        });
        tableHtml += `</tr>`;
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHtml;
}

/**
 * 获取模拟模型数据（在实际应用中应从API获取）
 * @param {string} modelId 模型ID
 * @returns {Object} 模型数据
 */
function getMockModelData(modelId) {
    // 这只是一个示例数据，实际应用中应从API获取
    const mockModels = {
        "first_principles_thinking": {
            id: "first_principles_thinking",
            name: "第一性原理思维",
            definition: "一种通过分解复杂问题至最基本元素，再从基础重建解决方案的思维方法。",
            purpose: "帮助突破常规思维限制，识别并挑战基本假设，从根本原理出发寻求创新解决方案。",
            category: "问题解决与创新",
            subcategories: ["创新思维工具"],
            tags: ["创新", "思维方式", "问题解决", "基本原理", "科学方法"],
            source: "源自物理学家理查德·费曼的教学方法",
            author: "Elon Musk广泛推广了这一思维模式在商业创新中的应用",
            use_cases: [
                "突破行业传统思维模式，创造颠覆性创新",
                "解决看似不可能的复杂技术挑战",
                "重新设计低效的业务流程或系统",
                "质疑并改进已有产品或服务的核心功能"
            ],
            example: "特斯拉在电动汽车开发中的应用：不是简单改进现有汽车设计，而是从能源存储、传动系统等基本原理出发，重新思考电动汽车应该如何设计和构建，从而创造了全新的产品类别。",
            teaching: [
                {
                    concept_name: "基本原理拆解",
                    explanation: "将问题分解为其最基本的元素和原理，去除所有假设和传统观念。"
                },
                {
                    concept_name: "从零构建",
                    explanation: "基于这些基本元素，重新构建解决方案，不受既有模式限制。"
                },
                {
                    concept_name: "迭代验证",
                    explanation: "通过实验和数据不断验证和改进解决方案，确保其基于有效原理。"
                }
            ],
            visualizations: {
                flowchart: [
                    {
                        title: "第一性原理思维流程",
                        dsl: "graph TD;\nA[识别问题] --> B[分解至基本元素];\nB --> C[质疑现有假设];\nC --> D[基于基本原理重建];\nD --> E[创新解决方案];"
                    }
                ],
                bar_chart: [
                    {
                        title: "常规思维vs第一性原理思维",
                        labels: ["创新潜力", "实施难度", "思维深度", "解决效果"],
                        datasets: [
                            {
                                label: "常规思维",
                                data: [40, 30, 35, 45],
                                backgroundColor: "rgba(54, 162, 235, 0.6)"
                            },
                            {
                                label: "第一性原理思维",
                                data: [85, 70, 90, 80],
                                backgroundColor: "rgba(255, 99, 132, 0.6)"
                            }
                        ]
                    }
                ],
                table: [
                    {
                        title: "第一性原理思维与其他思维方法比较",
                        headers: ["思维方法", "起点", "思考路径", "优势", "局限性"],
                        rows: [
                            ["第一性原理", "基本事实和原理", "自下而上构建", "突破性创新", "时间成本高"],
                            ["类比思维", "相似经验", "横向迁移", "实施快速", "创新有限"],
                            ["演绎推理", "普遍原则", "逻辑推导", "结构严谨", "受限于前提"]
                        ]
                    }
                ]
            },
            limitations: [
                {
                    limitation_name: "高认知负荷",
                    description: "需要深入领域知识和较强的抽象思维能力，对初学者有一定难度。"
                },
                {
                    limitation_name: "时间成本",
                    description: "从基本原理重建解决方案通常比采用现有方法需要更多时间。"
                },
                {
                    limitation_name: "适用性限制",
                    description: "并非所有问题都适合用第一性原理思维解决，有时渐进式改良更合适。"
                }
            ],
            related_models: [
                {
                    id: "five_whys",
                    name: "五个为什么分析",
                    description: "通过连续提问'为什么'来发现问题根本原因的方法"
                },
                {
                    id: "lateral_thinking",
                    name: "横向思维",
                    description: "打破传统思维模式，从不同角度寻求创新解决方案"
                },
                {
                    id: "occams_razor",
                    name: "奥卡姆剃刀原理",
                    description: "在多种可能的解释中，最简单的那个通常是正确的"
                }
            ]
        },
        "five_whys": {
            id: "five_whys",
            name: "五个为什么分析",
            definition: '通过连续五次追问"为什么"，逐层深入挖掘问题的根本原因的分析方法。',
            purpose: "帮助发现并解决问题的真正根源，而非仅处理表面现象。",
            category: "问题解决与创新",
            subcategories: ["分析与解构工具"],
            tags: ["问题分析", "根因分析", "质量管理", "流程改进"],
            source: "源自丰田生产系统，由丰田创始人丰田佐吉和丰田英二开发",
            use_cases: [
                "产品质量问题根因分析",
                "业务流程改进和优化",
                "项目失败或延误的原因识别",
                "客户投诉处理和服务改进"
            ],
            example: "假设电子商务网站出现订单下降：第一个为什么：为什么订单量下降？答：用户在结账页面离开。第二个为什么：为什么用户在结账页面离开？答：结账过程复杂。第三个为什么：为什么结账过程复杂？答：要求填写太多信息。第四个为什么：为什么要求填写这么多信息？答：市场部要收集用户数据。第五个为什么：为什么需要在结账时收集这些数据？答：没有其他更好的方式收集数据。根本解决方案：重新设计结账流程，将非必要数据收集移至订单完成后的可选环节。",
            visualizations: {
                flowchart: [
                    {
                        title: "五个为什么分析流程",
                        dsl: "graph TD;\nA[识别表面问题] --> B[第一个为什么];\nB --> C[第二个为什么];\nC --> D[第三个为什么];\nD --> E[第四个为什么];\nE --> F[第五个为什么];\nF --> G[识别根本原因];\nG --> H[制定解决方案];"
                    }
                ]
            },
            limitations: [
                {
                    limitation_name: "过度简化",
                    description: "可能过度简化复杂问题，忽略多因素交互作用。"
                },
                {
                    limitation_name: "主观性",
                    description: "分析过程受提问者知识背景和视角限制，可能导致偏见。"
                },
                {
                    limitation_name: "固定次数限制",
                    description: "不一定恰好需要五个为什么，有时需要更少或更多次追问。"
                }
            ],
            related_models: [
                {
                    id: "problem_tree_analysis",
                    name: "问题树分析",
                    description: "将问题解构为树状结构，分析原因和影响"
                },
                {
                    id: "fishbone_diagram",
                    name: "鱼骨图分析",
                    description: "又称因果图，用于识别问题的多种可能原因"
                }
            ]
        }
    };
    
    // 返回请求的模型数据，如果不存在则创建一个通用模型
         return mockModels[modelId] || {
         id: modelId,
         name: `思维模型 ${modelId}`,
         definition: "这是一个示例模型定义。在实际应用中，应从API获取真实数据。",
         purpose: "这是模型的目的描述。在实际应用中，这里将显示关于此模型用途的详细信息。",
         category: "通用模型",
         subcategories: ["示例"],
         tags: ["演示", "示例"],
         use_cases: [
             "这是第一个应用场景示例",
             "这是第二个应用场景示例"
         ],
         example: "这是一个模型应用示例。在实际应用中，这里将展示模型的具体使用案例。"
     };
}

// 导出公共方法
window.ModelDetail = {
    loadModelData,
    renderFlowchart,
    renderBarChart,
    renderTable
}; 