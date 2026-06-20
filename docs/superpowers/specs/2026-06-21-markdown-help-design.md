# Markdown 导入使用说明（站内帮助）设计

## 背景

项目已实现 Markdown 导入功能（`frontend/src/services/markdown-importer.ts`），支持标准 Markdown 与自定义 `:::type ... :::` 围栏语法。但用户无从得知围栏语法的存在与可用属性，需要一份站内帮助文档说明用法。

## 目标

- 让用户在导入场景下能立即找到使用说明。
- 完整覆盖：标准 Markdown 映射规则、`:::` 围栏通用格式、每种模块的属性参考、常见问题、完整示例。
- 文档维护与组件代码解耦：改文档只动 `.md`，不动 Vue。

## 非目标

- 不覆盖编辑器拖拽、属性面板、AI 配置等 UI 交互细节（那些自解释，由界面承担）。
- 不做目录侧边栏（TOC）、语法高亮、多语言、交互式"在线试解析"。

## 架构

### 入口（双入口、单页面）

1. **侧边栏菜单项**："帮助"，所有登录用户可见。
2. **文章列表页"📄 导入 Markdown"按钮右侧的 ❓ 圆形图标按钮**。

两处都跳转到同一路由 `/dashboard/help/markdown`，使用 `router.push` 在 SPA 内导航。

### 渲染方式

帮助文档源文件为中文 Markdown，构建时通过 Vite 的 `?raw` 后缀以字符串形式 import 进 Vue 组件，由 `marked`（项目已依赖）解析为 HTML，组件内 `v-html` 渲染。

不引入语法高亮库；代码块靠浏览器默认 `monospace` 字体 + scoped CSS 给一点边框/背景。

## 文件清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `frontend/src/assets/help/markdown-import.md` | 新建 | 帮助文档源文件 |
| `frontend/src/pages/HelpMarkdownPage.vue` | 新建 | 帮助页组件 |
| `frontend/src/types/markdown.d.ts` | 新建 | `declare module '*.md?raw'` 类型声明 |
| `frontend/src/router/index.ts` | 修改 | 在 `/dashboard` 子路由下新增 `help/markdown` |
| `frontend/src/components/AppShell.vue` | 修改 | `navItems` 增加"帮助"项，使用 `QuestionFilled` 图标 |
| `frontend/src/pages/ArticleListPage.vue` | 修改 | 导入按钮旁新增 ❓ 圆形按钮 |

## 帮助文档结构

文件：`frontend/src/assets/help/markdown-import.md`

章节顺序：

1. **快速开始**
   - 三步说明：写 `.md` 文件 → 点击"📄 导入 Markdown"选择文件 → 在编辑器中调整。
   - 提示文件大小超过 1 MB 会有提示但仍可导入；本地图片不会上传，需在编辑器中手动替换。

2. **标准 Markdown 映射表**

   | Markdown 写法 | 解析为模块 |
   |---|---|
   | `# 标题`、`## 标题` 等 | heading 模块（variant=simple，level=深度） |
   | 普通段落 | text 模块（内联 `**粗体**` `*斜体*` `` `行内代码` `` 保留为 HTML） |
   | `> 引用文字` | quote 模块 |
   | 单独成段的 `![alt](src)` | image 模块（其他情况保留为段落内联图片） |
   | `---` 或 `***` | divider 模块 |
   | 代码块（` ``` `） | text 模块（包裹 `<pre><code>`） |
   | 有序/无序列表 | text 模块（用 `•` 拼接） |

3. **`:::` 自定义模块语法**

   通用格式：
   ```
   :::type key="value" key2="value2"
   可选的内容文本
   :::
   ```

   规则：
   - 开围栏与闭围栏可有任意前导空白（缩进的 .md 也能识别）。
   - 属性值必须用双引号括起。
   - 不识别的 `type` 会降级为 text 模块，内容为占位文字。
   - 文件可使用 CRLF 或 LF 行结尾。

4. **支持的模块类型与属性参考**

   逐个列出（每个给 1 个最小可用示例）：

   - **quote**：`author`，内容文本作为引文正文
   - **image**：`src`、`alt`、`caption`
   - **divider**：`style`（solid/dashed/dotted）、`color`
   - **button**：`text`、`link`、`size`（small/medium/large）
   - **heading**：`text`（或写在内容里）、`level`（1-6）、`variant`、`showNumbering`
   - **header**：`title`、`subtitle`、`author`、`variant`
   - **footer**：`text`、`copyright`、`variant`
   - **toc**：`title`、`variant`

5. **常见问题**

   - 为什么 `:::xxx` 没识别？检查闭围栏是否独占一行，属性值是否双引号；不识别的 type 会变 text。
   - 为什么图片是占位？非 `http(s)://` / `data:` / `blob:` 的本地路径不会上传，需在编辑器中替换。
   - 中文段落里的 `*` 不会被错误识别为斜体吗？marked 默认遵循 CommonMark，多数情况下 OK；如有问题可改用 `**粗体**` 或 HTML 标签。

6. **完整示例**

   一段可直接复制粘贴的 `.md`，覆盖标题、段落、引用、图片、分隔线、按钮等模块。

## 关键实现细节

### `HelpMarkdownPage.vue`

```ts
import helpDoc from '@/assets/help/markdown-import.md?raw'
import { marked } from 'marked'

const html = computed(() => marked.parse(helpDoc) as string)
```

模板：

```html
<div class="help-page">
  <div class="help-doc" v-html="html"></div>
</div>
```

scoped 样式覆盖 `h1/h2/h3/p/code/pre/table/ul/ol`，使版面与其他页面一致：内容居中，max-width 800px，背景白色，code/pre 给浅灰底 + 圆角。

### 类型声明

`frontend/src/types/markdown.d.ts`：

```ts
declare module '*.md?raw' {
  const content: string
  export default content
}
```

确认该 `.d.ts` 路径在 `tsconfig.json` 的 include 范围内（项目目前 include `src/**/*`，已覆盖）。

### 路由

`frontend/src/router/index.ts` 中 `/dashboard` 下新增子路由：

```ts
{
  path: 'help/markdown',
  name: 'HelpMarkdown',
  component: () => import('@/pages/HelpMarkdownPage.vue')
}
```

### 侧边栏菜单

`frontend/src/components/AppShell.vue` 的 `navItems` 在 admin 项之前追加：

```ts
{ path: '/dashboard/help/markdown', label: '帮助', icon: QuestionFilled }
```

图标从 `@element-plus/icons-vue` 引入。

### 列表页按钮

`frontend/src/pages/ArticleListPage.vue` 的 `.page-actions` 中，在"📄 导入 Markdown"按钮**右侧紧邻**插入：

```html
<el-tooltip content="查看 Markdown 导入说明" placement="top">
  <el-button :icon="QuestionFilled" circle size="small" @click="openHelp" />
</el-tooltip>
```

`openHelp` 即 `router.push('/dashboard/help/markdown')`。

## 风险与缓解

- **`marked.parse` 输出 HTML 直接 v-html**：源文件由我们维护、随构建打包，不接受任何用户输入，无 XSS 风险。
- **文档与代码漂移**：每次改 `markdown-importer.ts` 的语法行为时需同步更新 `.md` 文件。建议在 importer 文件顶部加一行注释指向帮助文档路径作为提醒（不在本次范围，留给后续）。

## 测试计划

- 手动：访问 `/dashboard/help/markdown`，验证文档完整渲染、章节链接（如有）可用。
- 手动：从文章列表页点 ❓ 按钮 与 从侧边栏点"帮助"菜单 — 都能跳到同一页面。
- 手动：按帮助文档中的"完整示例"复制粘贴保存为 `.md`，导入文章列表页，验证生成的模块数量与类型符合文档描述。

## 不做的事

- 不引入 highlight.js / shiki。
- 不做目录侧边栏。
- 不做多语言。
- 不在帮助页内做"在线试解析"。
- 不修改 `markdown-importer.ts`（本次仅做文档与入口；importer 行为以现有实现为准）。
