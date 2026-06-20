# Markdown 文件导入设计文档

## 概述

支持从文章列表页导入 Markdown 文件，自动解析为标准 Markdown 语法和自定义 `:::` 标签语法，生成对应的模块（Module）并创建一篇新文章，然后跳转到编辑器。

## 整体流程

```
ArticleListPage
  │  点击「导入 Markdown」按钮
  │  → 文件选择器 accept=".md"
  │  → 读取文件内容
  ▼
markdown-importer.ts（核心服务）
  │  1. marked 解析 Markdown → tokens 树
  │  2. 自定义 marked 扩展处理 ::: 语法
  │  3. tokens → Module[] 转换
  │  4. 提取本地图片路径 → 标记待上传，通知用户后续手动处理
  ▼
  API: createArticle({ title, content: JSON.stringify(document) })
  ▼
  router.push → /editor/article/{articleId}
```

## 前端变更清单

### 新增文件

- `frontend/src/services/markdown-importer.ts` — 核心导入/解析服务

### 修改文件

- `frontend/src/pages/ArticleListPage.vue` — 添加"导入 Markdown"按钮和文件选择逻辑

### 新增依赖

- `marked` — Markdown 解析库（用于标准语法解析和内联格式 HTML 转换）

## Markdown → 模块映射

### 标准 Markdown 语法

| Markdown | 模块类型 | 映射说明 |
|---|---|---|
| `# 标题` ~ `###### 标题` | `heading` | `level`=1~6，`text`=标题文字，`variant='simple'` |
| 空行分隔的文本段落 | `text` | 内联语法自动转 HTML：**bold** → `<strong>`，*italic* → `<em>`，`` `code` `` → `<code>`，`[link](url)` → `<a>` |
| `> 引用内容` | `quote` | 多行引用合并到 `content`，内联语法同样转 HTML |
| `![alt](src)` | `image` | `src`=图片 URL，`alt`=描述文字 |
| `---` `***` `___` | `divider` | 水平分割线 |

### 自定义 `:::` 标签语法

```
:::type key1="value1" key2="value2"
内容（可选，根据类型可能需要）
:::
```

| `:::` type | 模块 | 支持属性 |
|---|---|---|
| `text` | `text` | `icon`（可选）|
| `image` | `image` | `src` `alt` `caption` |
| `divider` | `divider` | `style`(solid/dashed/dotted) `color` |
| `button` | `button` | `text` `link` `size`(small/medium/large) |
| `header` | `header` | `title` `subtitle` `author` `variant` |
| `footer` | `footer` | `text` `copyright` `variant` |
| `heading` | `heading` | `text` `level` `variant` |
| `quote` | `quote` | `content` `author` |
| `toc` | `toc` | `title` `variant` |

规则：
- `:::` 围栏之间的文本（如果有）作为模块的 content 或相关内容属性
- 属性键值对写在同一行：`key="value"`，支持多个
- 不认识的类型降级为 `text` 模块，保留原始内容
- 标准 `#` 标题语法和 `:::heading` 都支持

## 文件名为标题

- 导入时取文件名（去除 `.md` 扩展名）作为文章标题
- Markdown 内容中的 `# 标题` 作为 `heading` 模块，不影响文章标题

## 图片处理

- 网络 URL 图片（http/https）：直接保留为 `image` 模块的 `src`
- 本地路径图片（相对路径或绝对路径）：在导入完成时通过 `ElMessage.info` 提示用户"发现 X 张本地图片，可在编辑器中上传替换"，图片 `src` 保留原路径
- 不在解析阶段进行图片上传，避免流程过长

## UI 变更

### ArticleListPage.vue

在"新建文章"按钮旁添加"导入 Markdown"按钮：

```
[+ 新建文章] [📄 导入 Markdown]
```

点击行为：
1. 触发 `<input type="file" accept=".md">`
2. 读取文件 → 调 `markdown-importer.ts`
3. 解析期间按钮显示 loading
4. 完成后自动跳转到编辑器；失败则 `ElMessage.error` 提示

## 错误处理

| 场景 | 处理 |
|---|---|
| 非 .md 文件 | accept 限制 + 额外校验 |
| 空文件 | ElMessage.warning |
| 解析异常 | try-catch，ElMessage.error('Markdown 解析失败') |
| 创建文章失败 | ElMessage.error，不跳转 |
| 超大文件（>1MB） | ElMessage.info 提示可能需要稍等 |
| 不认识 `:::xxx` | 降级为 text 模块 |
