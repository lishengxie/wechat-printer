# 模板系统改造设计文档

## 概述

将排版模板从按类型聚合的 `StyleDefinitions` 改造为存储完整的 Document（模块树 + 样式），
支持文章创建时选择示例文章和模板，以及在编辑器中按模块粒度从模板挑样式。

## 背景

当前模板（Layout）的 `content` 字段存储的是 `StyleDefinitions`：
```json
{ "text": { "fontSize": "16px", "color": "#333" }, "heading": { "fontSize": "22px" } }
```

文章（Article）的 `content` 字段存储完整的 Document（模块树）。

创建文章时可选模板，但只能整体应用所有模块样式，无法精细控制。
"示例文章"功能通过前端硬编码的 `loadTestData()` 提供，只有一篇。

## 设计

### 1. 数据模型

**Layout.content**：从 `StyleDefinitions` 改为存完整 Document JSON。

```
旧：{ text: { fontSize: "16px" }, heading: { fontSize: "22px" } }
新：{ id, title, root: { id, type: "container", children: [{ id, type: "header", props, styles }, ...] } }
```

**Article.layout_id**：关联当前模板的字段已有，无需变动。

**示例文章**：前端预设的 Document，将 `loadTestData()` 扩展为多篇预置文章（作为 presets 存在于前端代码中）。
暂时不存后端，后续可按需迁移为后端 preset Layout。

后端改动最小：`Layout.Content` 字段本身是 string，仅 `model/layout.go` 中调整 `CreateLayoutRequest.Content` 的 `binding` 可选项。

### 2. 文章创建流程

新建文章弹窗包含：
- 标题（必填）
- 示例文章（标签按钮形式单选，选项包含预设文章 + 一个"空白"选项）
- 应用模板（下拉或标签选择，可选 "不选"）
- 创建并编辑按钮

**数据流**：

| 选择 | 行为 |
|------|------|
| 示例文章 + 模板 | 克隆示例 Document → 按 `module.type` 遍历匹配模板模块 → 合并模板模块的 `styles` 到文章模块（不合并 `props`） |
| 仅示例文章 | 直接使用示例文章的 Document |
| 仅模板 | 克隆模板的 Document 作为内容起点（placeholder 内容） |
| 都不选 | 创建空容器 Document |

**合并规则（示例 + 模板）**：
```
for each module in article:
  templateModule = find template module where type == module.type
  if templateModule:
    module.styles = { ...templateModule.styles }
```

由于每种模块类型在模板中只有一个实例，按 type 匹配直接得到唯一的样式源。

### 3. 编辑器：按模块挑样式

在属性面板新增"模板"分区（仅文章模式下显示）：

- 显示当前关联模板的名称和标签
- 展示与选中模块同类型的模板模块的样式摘要（关键样式标签如 bg、fontSize、align）
- 一个"应用"按钮，点击后将模板模块的 `styles` 合并到当前模块

**API**：`documentStore.applyTemplateModuleStyles(templateDoc, selectedModuleId)`：
1. 遍历 templateDoc.root 找到 `type === selectedModule.type` 的模块
2. 调用 `updateModuleStyles(selectedModuleId, templateModule.styles)`

### 4. 工具栏调整

- **"🎨 切换模板"**：改为关联模板选择操作。点击弹出模板列表，选择后设置文章的 `layout_id`（不自动应用样式）。用户随后通过属性面板按模块挑样式。
- **"📋 加载示例"**：移除该按钮。

### 5. 模板编辑

模板编辑模式（`/editor/layout/:id`）和文章编辑模式共用同一套编辑器界面和保存 UI。区别：
- 文章模式存 `article.content = JSON.stringify(document)`
- 模板模式存 `layout.content = JSON.stringify(document)`（不再需要遍历收集 per-type styles）

### 6. 示例文章预设

前端 `stores/document.ts` 中增加多篇预设示例文章：
- 产品评测文（使用现有测试数据改造）
- 可后续继续添加

示例文章选择结果通过 `documentStore.setDocument()` 加载。

## 改动文件

### 前端（5 文件）

| 文件 | 改动 |
|------|------|
| `services/api.ts` | `Layout` 接口: `styles: StyleDefinitions` → `document: Document`；更新 `backendToFrontend()`；移除 `StyleDefinitions` 类型（如无其他引用） |
| `stores/document.ts` | 替换 `applyTemplateStyles(styles)` 为 `applyTemplateFromDocument(templateDoc)` 和 `applyTemplateModuleStyles(templateDoc, moduleId)`；扩展 `loadTestData()` 为多篇预设或改为 `loadExampleArticles()` |
| `pages/ArticleListPage.vue` | 创建弹窗增加示例文章选择区域（标签按钮），模板选择保持；创建时传 `layout_id`，初始 Document 根据选择在编辑器端计算 |
| `pages/EditorPage.vue` | 移除"加载示例"按钮；切换模板改为只关联（设 layout_id）不自动应用；从 URL template 参数初始化改为从 `article.layout_id` 加载关联模板；跟踪当前关联模板供属性面板使用 |
| `components/PropertyPanel.vue` | 文章模式下新增"模板"分区，显示同类型模块样式预览和应用按钮 |

### 后端（1 文件）

| 文件 | 改动 |
|------|------|
| `model/layout.go` | `CreateLayoutRequest.Content` 去掉 `binding:"required"`（新建模板时内容为空，保存时才有文档） |

## 不做的事情

- 不改造后端 API 路由和数据库 schema（Content 字段格式变化对接口透明）
- 不添加后端示例文章存储（先做前端预设）
- 不改造模板列表页（模板仍通过 TemplateListPage 管理）
- 不处理模板权限、版本控制等

## 后续可能

- 示例文章迁移为后端 preset Layout
- 模板市场 / 第三方模板
- 模板版本管理
