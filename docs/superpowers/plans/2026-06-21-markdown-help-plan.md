# Markdown Import Help Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-app help page that documents the Markdown import feature, reachable both from a sidebar menu item and a "?" button next to the import button on the article list page.

**Architecture:** Static `.md` file imported via Vite's `?raw` suffix, parsed with the existing `marked` dependency, rendered via `v-html` in a dedicated Vue page component. Two entry points (sidebar nav + list page button) both `router.push` to the same SPA route.

**Tech Stack:** Vue 3 + TypeScript + Vue Router + Element Plus + marked (already in deps), Vite `?raw` import.

**Spec:** `docs/superpowers/specs/2026-06-21-markdown-help-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `frontend/src/types/markdown.d.ts` | Create | Type declaration for `*.md?raw` imports |
| `frontend/src/assets/help/markdown-import.md` | Create | Help document source (Chinese) |
| `frontend/src/pages/HelpMarkdownPage.vue` | Create | Render the help doc with marked + v-html |
| `frontend/src/router/index.ts` | Modify | Add `/dashboard/help/markdown` child route |
| `frontend/src/components/AppShell.vue` | Modify | Add "帮助" nav item with QuestionFilled icon |
| `frontend/src/pages/ArticleListPage.vue` | Modify | Add "?" circle button next to import button |

---

### Task 1: Add `*.md?raw` type declaration

**Files:**
- Create: `frontend/src/types/markdown.d.ts`

- [ ] **Step 1: Create the type declaration file**

```ts
declare module '*.md?raw' {
  const content: string
  export default content
}
```

- [ ] **Step 2: Verify TypeScript picks it up**

The `frontend/tsconfig.json` already includes `src/**/*.d.ts`, so no config change needed.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/markdown.d.ts
git commit -m "feat(frontend): add type declaration for raw markdown imports"
```

---

### Task 2: Create the help document source

**Files:**
- Create: `frontend/src/assets/help/markdown-import.md`

- [ ] **Step 1: Create the directory and write the help document**

Write the following exact content to `frontend/src/assets/help/markdown-import.md`:

````markdown
# Markdown 导入使用说明

公众号编辑器支持把 `.md` 文件一键导入为可视化的模块化文章。除了标准 Markdown 写法，我们还提供 `:::type` 围栏语法来直接生成引用、按钮、分隔线等高级模块。

## 快速开始

1. 准备一个 `.md` 文件（UTF-8 编码，CRLF 或 LF 行结尾均可）。
2. 在"我的文章"页面点击 **📄 导入 Markdown**，选择文件。
3. 导入成功后会自动跳转到编辑器，可继续调整模块顺序与样式。

> 文件超过 1 MB 仍可导入，但解析会稍慢。本地图片（非 `http(s)://` / `data:` / `blob:`）不会被上传，需在编辑器中手动替换。

## 标准 Markdown 映射

| 你写的 | 解析为 |
| --- | --- |
| `# 标题` / `## 标题` … | heading 模块（level = #数量） |
| 普通段落 | text 模块（保留 `**粗体**` `*斜体*` `` `行内代码` `` 等内联格式） |
| `> 引用文字` | quote 模块 |
| 单独成段的 `![alt](src)` | image 模块 |
| `---` 或 `***` | divider 模块 |
| 代码块（三个反引号） | text 模块（包裹 `<pre><code>`） |
| 有序 / 无序列表 | text 模块（用 `•` 拼接行） |

段落里嵌图片不会被识别为独立 image 模块，会保留为段落里的 `<img>`。

## `:::` 自定义模块语法

通用格式：

```
:::type key="value" key2="value2"
可选的内容文本
:::
```

规则：

- 开围栏与闭围栏可以有任意前导空白（缩进的 `.md` 也能识别）。
- 属性值必须用**双引号**括起。
- 不识别的 `type` 会降级为 text 模块，内容为占位文字。
- 闭围栏 `:::` 必须独占一行。

## 支持的模块类型

### quote — 引用

属性：`author`（作者署名）。内容文本作为引文正文。

```
:::quote author="爱因斯坦"
想象力比知识更重要
:::
```

### image — 图片

属性：`src`（必填）、`alt`、`caption`。

```
:::image src="https://picsum.photos/640/360" alt="风景" caption="示例图"
:::
```

### divider — 分隔线

属性：`style`（`solid` / `dashed` / `dotted`）、`color`。

```
:::divider style="dashed"
:::
```

### button — 按钮

属性：`text`（按钮文字）、`link`（跳转链接）、`size`（`small` / `medium` / `large`）。

```
:::button text="立即购买" link="https://example.com" size="large"
:::
```

### heading — 标题

属性：`text`（也可写在内容里）、`level`（1-6）、`variant`、`showNumbering`（`true` / `false`）。

```
:::heading text="第一章" level="2"
:::
```

### header — 文章页眉

属性：`title`、`subtitle`、`author`、`variant`。

```
:::header title="本周精选" subtitle="编辑推荐" author="编辑部"
:::
```

### footer — 文章页脚

属性：`text`、`copyright`、`variant`。

```
:::footer text="感谢阅读" copyright="© 2026 公众号"
:::
```

### toc — 目录

属性：`title`、`variant`。

```
:::toc title="目录"
:::
```

## 常见问题

**为什么我的 `:::xxx` 没识别？**
- 检查闭围栏 `:::` 是否独占一行。
- 检查属性值是否用双引号括起（`key="value"`，不是 `key='value'` 也不是 `key=value`）。
- 不在支持列表里的 `type` 会被当成 text 模块，并显示 `[未知模块类型: xxx]` 占位。

**为什么图片显示是占位？**
导入服务只把 `http(s)://`、`data:`、`blob:` 视为有效的远程图片地址。本地路径（如 `./img/cover.png`）只统计数量并提示，不会上传，需在编辑器中替换为已上传图片的 URL。

**Windows 保存的 .md 也能导入吗？**
可以。导入服务会自动把 `\r\n` 归一化为 `\n`。

## 完整示例

把下面这段保存为 `demo.md` 并导入，体验所有模块类型：

```markdown
# 欢迎阅读

这是一段**粗体**和*斜体*的文字，还有`行内代码`。

:::quote author="爱因斯坦"
想象力比知识更重要
:::

:::image src="https://picsum.photos/640/360" alt="风景"
:::

:::divider style="dashed"
:::

## 第一章

普通段落内容。

:::button text="立即购买" link="https://example.com" size="large"
:::
```
````

- [ ] **Step 2: Commit**

```bash
git add frontend/src/assets/help/markdown-import.md
git commit -m "docs(frontend): add markdown import help document"
```

---

### Task 3: Create the HelpMarkdownPage component

**Files:**
- Create: `frontend/src/pages/HelpMarkdownPage.vue`

- [ ] **Step 1: Write the page component**

Write the following exact content to `frontend/src/pages/HelpMarkdownPage.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import helpDoc from '@/assets/help/markdown-import.md?raw'

const html = computed(() => marked.parse(helpDoc, { async: false }) as string)
</script>

<template>
  <div class="help-page">
    <div class="help-doc" v-html="html"></div>
  </div>
</template>

<style scoped>
.help-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 8px 0 32px;
}
.help-doc {
  background: var(--el-bg-color);
  padding: 32px 40px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-primary);
  line-height: 1.7;
}
.help-doc :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-light);
}
.help-doc :deep(h2) {
  font-size: 18px;
  font-weight: 600;
  margin: 28px 0 12px;
}
.help-doc :deep(h3) {
  font-size: 15px;
  font-weight: 600;
  margin: 20px 0 8px;
  color: var(--el-text-color-regular);
}
.help-doc :deep(p) {
  margin: 8px 0;
}
.help-doc :deep(ul),
.help-doc :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}
.help-doc :deep(li) {
  margin: 4px 0;
}
.help-doc :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 3px solid var(--el-color-primary);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}
.help-doc :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
}
.help-doc :deep(pre) {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 12px 16px;
  overflow-x: auto;
  margin: 12px 0;
}
.help-doc :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 13px;
}
.help-doc :deep(table) {
  border-collapse: collapse;
  margin: 12px 0;
  width: 100%;
}
.help-doc :deep(th),
.help-doc :deep(td) {
  border: 1px solid var(--el-border-color-light);
  padding: 8px 12px;
  text-align: left;
  font-size: 14px;
}
.help-doc :deep(th) {
  background: var(--el-fill-color-light);
  font-weight: 600;
}
.help-doc :deep(hr) {
  border: none;
  border-top: 1px solid var(--el-border-color-light);
  margin: 24px 0;
}
.help-doc :deep(strong) {
  font-weight: 600;
}
</style>
```

Notes:
- `marked.parse(..., { async: false })` ensures the synchronous string return type so `computed` can use it without Promise handling.
- `:deep(...)` selectors are required because the rendered HTML lives inside `v-html` which is not affected by scoped styles by default.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/HelpMarkdownPage.vue
git commit -m "feat(frontend): add markdown import help page component"
```

---

### Task 4: Add the help route

**Files:**
- Modify: `frontend/src/router/index.ts`

- [ ] **Step 1: Add the new route under `/dashboard`**

Find the `/dashboard` block in `frontend/src/router/index.ts` (around lines 17-41). It currently has children: `''` (redirect), `articles`, `templates`, `ai-config`. Add a new child after `ai-config`:

```ts
{
  path: 'help/markdown',
  name: 'HelpMarkdown',
  component: () => import('@/pages/HelpMarkdownPage.vue')
}
```

The full updated `/dashboard` block should look like:

```ts
{
  path: '/dashboard',
  component: () => import('@/components/AppShell.vue'),
  children: [
    {
      path: '',
      redirect: '/dashboard/articles'
    },
    {
      path: 'articles',
      name: 'ArticleList',
      component: () => import('@/pages/ArticleListPage.vue')
    },
    {
      path: 'templates',
      name: 'TemplateList',
      component: () => import('@/pages/TemplateListPage.vue')
    },
    {
      path: 'ai-config',
      name: 'AIConfig',
      component: () => import('@/pages/AIConfigPage.vue')
    },
    {
      path: 'help/markdown',
      name: 'HelpMarkdown',
      component: () => import('@/pages/HelpMarkdownPage.vue')
    }
  ]
}
```

- [ ] **Step 2: Verify the dev server picks it up**

If a dev server is running, browse to `/dashboard/help/markdown` — the page should render the help document.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/router/index.ts
git commit -m "feat(frontend): add /dashboard/help/markdown route"
```

---

### Task 5: Add "帮助" item to sidebar nav

**Files:**
- Modify: `frontend/src/components/AppShell.vue`

- [ ] **Step 1: Update the icon import**

In `frontend/src/components/AppShell.vue` line 5, change:

```ts
import { Notebook, List, Cpu, User } from '@element-plus/icons-vue'
```

to:

```ts
import { Notebook, List, Cpu, User, QuestionFilled } from '@element-plus/icons-vue'
```

- [ ] **Step 2: Add the help nav item**

In the same file, find the `navItems` computed (around lines 14-19). Update it to insert "帮助" before the admin item:

```ts
const navItems = computed(() => [
  { path: '/dashboard/articles', label: '文章', icon: Notebook },
  { path: '/dashboard/templates', label: '模板库', icon: List },
  { path: '/dashboard/ai-config', label: 'AI 助手', icon: Cpu },
  { path: '/dashboard/help/markdown', label: '帮助', icon: QuestionFilled },
  ...(isAdmin.value ? [{ path: '/admin/users', label: '用户管理', icon: User }] : [])
])
```

- [ ] **Step 3: Verify the menu shows up**

If a dev server is running, the sidebar should now show a "帮助" item with a question-mark circle icon. Clicking it should navigate to the help page.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/AppShell.vue
git commit -m "feat(frontend): add help nav item to sidebar"
```

---

### Task 6: Add "?" button next to import button on article list

**Files:**
- Modify: `frontend/src/pages/ArticleListPage.vue`

- [ ] **Step 1: Import the icon**

In `frontend/src/pages/ArticleListPage.vue`, after the existing imports (around line 7), add:

```ts
import { QuestionFilled } from '@element-plus/icons-vue'
```

- [ ] **Step 2: Add the openHelp method**

In the `<script setup>` block, add a function near the other handlers (e.g. just before `onMounted(loadData)` on line 134):

```ts
function openHelp() {
  router.push('/dashboard/help/markdown')
}
```

- [ ] **Step 3: Add the help button to the template**

In the template, locate the `.page-actions` block (around lines 141-146):

```html
<div class="page-actions">
  <el-button :loading="importingMd" @click="handleImportMd">
    📄 导入 Markdown
  </el-button>
  <el-button type="primary" @click="showCreateModal = true">+ 新建文章</el-button>
</div>
```

Insert a tooltip-wrapped circle button immediately after the import button:

```html
<div class="page-actions">
  <el-button :loading="importingMd" @click="handleImportMd">
    📄 导入 Markdown
  </el-button>
  <el-tooltip content="查看 Markdown 导入说明" placement="top">
    <el-button :icon="QuestionFilled" circle size="small" @click="openHelp" />
  </el-tooltip>
  <el-button type="primary" @click="showCreateModal = true">+ 新建文章</el-button>
</div>
```

- [ ] **Step 4: Verify the button shows up and navigates**

If a dev server is running, the article list page should show a small "?" circle button right after the import button. Hover shows the tooltip; click navigates to the help page.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ArticleListPage.vue
git commit -m "feat(frontend): add help button next to markdown import"
```

---

### Task 7: Final integration check

**Files:** (no edits — verification only)

- [ ] **Step 1: Build check**

Per `MEMORY.md`, do TypeScript checking via `npx vite build` (vue-tsc is broken on Node 24).

```bash
cd frontend && npx vite build
```

Expected: build succeeds with no errors. Specifically, no "Cannot find module '*.md?raw'" or similar TypeScript errors.

- [ ] **Step 2: Manual smoke test**

Start the dev server (`npm run dev` from `frontend/`) and verify:

1. Navigate to `/dashboard/articles`. The "📄 导入 Markdown" button now has a small "?" circle button to its right with a tooltip on hover.
2. Click the "?" button. It navigates to `/dashboard/help/markdown` and the help document renders with proper headings, tables, code blocks, blockquotes.
3. Click the sidebar "帮助" menu item. Same page renders. The menu item is highlighted as active.
4. Use the "完整示例" markdown from the help document — copy it to a file `demo.md`, click "📄 导入 Markdown", select the file. After import the editor should show a heading, paragraph, quote, image, divider, heading, paragraph, button — matching the help doc's claims.

- [ ] **Step 3: Final commit (if any fixes were needed)**

If the smoke test surfaced any issues, fix them and commit. Otherwise no commit needed.

---

## Self-Review Notes

- **Spec coverage check:**
  - Two entry points (sidebar + list page button) — Tasks 5, 6 ✓
  - Help doc covers快速开始 / 标准映射表 / `:::` 通用语法 / 模块属性参考 / FAQ / 完整示例 — Task 2 ✓
  - Vite `?raw` import + marked rendering — Tasks 1, 3 ✓
  - Type declaration — Task 1 ✓
  - Route registration — Task 4 ✓
  - No syntax highlighting / TOC / multi-language — confirmed not in any task ✓
- **Placeholder scan:** No "TBD" / "TODO" / unspecified handlers. All code blocks complete.
- **Type consistency:** `QuestionFilled` icon used consistently in Tasks 5 and 6. Route name `HelpMarkdown` and path `/dashboard/help/markdown` used identically across Tasks 4, 5, 6.
