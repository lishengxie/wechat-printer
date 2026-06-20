# Element Plus UI 迁移设计

## 概述

将项目前端 UI 从原生 HTML 元素 + Tailwind CSS 替换为 Element Plus 组件库，采用按需导入方式。本次实现分两阶段：A（基础框架与通用组件）和 B（编辑器核心控件）。

## 安装与配置

```json
// 依赖
"element-plus": "^2.x"
"unplugin-vue-components": "^0.x"  // dev
"unplugin-element-plus": "^0.x"    // dev
```

`vite.config.ts` 添加 `ElementPlusResolver` 和 `unplugin-element-plus` 插件，实现组件和样式的自动按需加载。

## 阶段 A：基础框架

### 1. 按钮替换

所有原生 `<button>` 替换为 `<el-button>`，保持语义：

| 原生类 | Element Plus |
|---|---|
| `btn-primary` | `<el-button type="primary">` |
| `btn-secondary` | `<el-button>`（默认） |
| `action-btn` | `<el-button text>` 或 `<el-button>` + 自定义样式 |
| `btn-small` | `<el-button size="small">` |
| `btn-small danger` | `<el-button size="small" type="danger">` |
| `btn-small primary` | `<el-button size="small" type="primary">` |

涉及页面：所有页面（LoginPage、ArticleListPage、TemplateListPage、UserManagementPage、EditorPage、AIConfigPage）

### 2. 表单控件替换

| 原生 | Element Plus |
|---|---|
| `<input type="text">` | `<el-input>` |
| `<input type="password">` | `<el-input type="password" show-password>` |
| `<select><option>` | `<el-select><el-option>` |
| 表单布局（.form-group） | `<el-form>` + `<el-form-item>` |

涉及页面：LoginPage（登录表单）、UserManagementPage（新建用户表单）、ArticleListPage（新建文章表单）、AIConfigPage（API 配置表单）

### 3. 弹窗/对话框替换

所有原生手写模态框替换为 `<el-dialog>`：

- ArticleListPage：新建文章弹窗
- UserManagementPage：新建用户弹窗
- EditorPage：导出 HTML 弹窗

### 4. 导航替换

AppShell.vue 的侧边栏导航替换为 `<el-menu>` + `<el-menu-item>` + `<el-sub-menu>`（如需要），保持路由导航逻辑。

### 5. 数据展示组件

| 场景 | Element Plus |
|---|---|
| 加载状态 | `v-loading` 指令 |
| 空状态 | `<el-empty>` |
| 表格 | `<el-table>` + `<el-table-column>`（用户管理页） |
| 标签/徽章 | `<el-tag>`（文章/模板状态、预设标签） |
| 提示消息 | `<el-message>`（保存成功/失败提示） |
| 警告提示 | `<el-alert>`（错误信息显示） |

### 6. 布局样式调整

- 替换 `bg-white`、`border-l`、`border-b` 等 Tailwind 类为 Element Plus 布局组件或自定义 CSS
- 保持现有三栏布局结构（左侧模块库 - 中间画布 - 右侧属性面板）
- `.property-panel` 等容器保留自定义 CSS，只替换内部控件

## 阶段 B：编辑器核心控件

### 7. 编辑器工具栏

EditorPage.vue 顶部操作按钮组：
- 使用 `<el-button-group>` 包裹预览/示例/AI/撤销/重做按钮
- 保存和导出使用 `<el-button type="primary">` 和对应配色
- 保持现有功能逻辑不变

### 8. 属性面板控件

PropertyPanel.vue 中的手写控件替换：

| 原生 | Element Plus |
|---|---|
| `<input type="color">` + 文本输入 | `<el-color-picker>` |
| `<input type="range">` 上/右/下/左滑块 | `<el-slider>` (4个垂直排列) |
| `<select>` 字体/字号/字重/行高 | `<el-select>` |
| `<button>` 左/中/右对齐 | `<el-radio-group>` + `<el-radio-button>` |
| `<input>` 边框/圆角文本输入 | `<el-input>` 或 `<el-select>` 选项 |

状态管理不变：继续调用 `documentStore.updateModuleStyles()` / `documentStore.updateModuleProps()`。

### 9. 模块库折叠分组

ModuleLibrary.vue：
- 手写折叠面板替换为 `<el-collapse>` + `<el-collapse-item>`
- 内部模块项目保留原生 `draggable="true"` 拖拽逻辑不变
- 保持点击添加功能不变

### 10. AI 聊天对话框

AIChatDialog.vue：
- 对话框容器替换为 `<el-dialog>`
- 消息输入框替换为 `<el-input type="textarea">`
- 发送按钮替换为 `<el-button type="primary">`

## 不变的部分

- 编辑器画布（EditorCanvas.vue、ContainerModule.vue）的拖拽逻辑完全不碰
- 模块渲染（ModuleRenderer、各 Module 组件）的内部渲染逻辑不变
- Pinia store 结构和数据流不变
- 后端代码不变
- PreviewCanvas.vue 保持原样（预览模式模拟手机样式，不涉及 Element Plus）

## 样式处理

- 各组件 scoped style 中的自定义 CSS 保留，只删除被 Element Plus 替代的部分
- Element Plus 组件依赖其内置样式（由按需导入插件自动加载）
- 逐步移除不再使用的 Tailwind 类
- 迁移过程中可能出现布局微调，逐个页面验收

## 变更文件清单

按依赖顺序：

1. `frontend/package.json` - 添加依赖
2. `frontend/vite.config.ts` - 添加按需导入插件
3. `frontend/src/main.ts` - 导入 Element Plus 全局样式
4. `frontend/src/components/AppShell.vue` - 导航替换
5. `frontend/src/pages/LoginPage.vue` - 表单替换
6. `frontend/src/pages/ArticleListPage.vue` - 按钮/弹窗/空状态/标签替换
7. `frontend/src/pages/TemplateListPage.vue` - 按钮/空状态/标签替换
8. `frontend/src/pages/UserManagementPage.vue` - 表格/按钮/弹窗替换
9. `frontend/src/pages/AIConfigPage.vue` - 表单/按钮替换
10. `frontend/src/pages/EditorPage.vue` - 工具栏/弹窗替换
11. `frontend/src/components/ModuleLibrary.vue` - 折叠面板替换
12. `frontend/src/components/PropertyPanel.vue` - 控件替换
13. `frontend/src/components/AIChatDialog.vue` - 对话框替换
