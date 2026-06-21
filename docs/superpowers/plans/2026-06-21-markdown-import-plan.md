# Markdown 文件导入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable importing .md files from the article list page, parsing markdown + custom `:::` syntax into editor modules, and auto-creating an article with redirect to the editor.

**Architecture:** Client-side parsing using `marked` library. A new service (`markdown-importer.ts`) handles file reading, markdown parsing (`:::` via regex pre-split + `marked.lexer` for standard tokens), image detection, document construction, and article creation via existing API.

**Tech Stack:** Vue 3, TypeScript, `marked` (new dependency), existing `api.ts` service

---

### Task 1: Install `marked` dependency

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install marked**

Run from `frontend/` directory:

```bash
cd frontend && npm install marked
```

Expected: `marked` added to `dependencies` in `package.json` and `node_modules/` updated.

- [ ] **Step 2: Verify TypeScript picks it up**

```bash
cd frontend && npx tsc --noEmit --strict src/services/markdown-importer.ts 2>&1 || echo "File doesn't exist yet, that's fine"
```

Expected: No errors (or only "file not found" since importer doesn't exist yet).

---

### Task 2: Create `markdown-importer.ts` service

**Files:**
- Create: `frontend/src/services/markdown-importer.ts`

This is the core service. It handles:
1. Splitting markdown content into `:::` blocks and plain markdown segments
2. Parsing standard markdown segments via `marked.lexer()` → modules
3. Parsing `:::` blocks directly → modules
4. Detecting local image paths for user notification
5. Building a Document and creating an article via API

- [ ] **Step 1: Create the service file with imports and types**

```typescript
// frontend/src/services/markdown-importer.ts
import { marked } from 'marked'
import type { Tokens } from 'marked'
import { createModule, createEmptyDocument } from '@/types/document'
import type { Document, Module } from '@/types/document'
import api from './api'

export interface ImportResult {
  document: Document
  localImageCount: number
}

// Regex for ::: block:  :::type key="value"\ncontent\n:::
// Captures: type name, attribute string, content text
const MODULE_BLOCK_RE = /^:::(\w+)((?:\s+\w+="[^"]*")*)\s*\n?([\s\S]*?)\n:::/gm
const ATTR_RE = /(\w+)="([^"]*)"/g
```

- [ ] **Step 2: Add attribute parser helper**

```typescript
function parseAttrs(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  let match: RegExpExecArray | null
  while ((match = ATTR_RE.exec(attrStr)) !== null) {
    attrs[match[1]] = match[2]
  }
  return attrs
}
```

- [ ] **Step 3: Add `:::` block to Module converter**

```typescript
function createModuleFromBlock(
  type: string,
  attrs: Record<string, string>,
  content: string
): Module {
  switch (type) {
    case 'text': {
      const mod = createModule('text')
      mod.props.content = content || attrs.content || ''
      if (attrs.icon) mod.props.icon = attrs.icon
      return mod
    }
    case 'image': {
      const mod = createModule('image')
      mod.props.src = attrs.src || ''
      mod.props.alt = attrs.alt || ''
      if (attrs.caption) mod.props.caption = attrs.caption
      return mod
    }
    case 'divider': {
      const mod = createModule('divider')
      if (attrs.style && ['solid', 'dashed', 'dotted'].includes(attrs.style)) {
        ;(mod.props as any).style = attrs.style
      }
      if (attrs.color) mod.props.color = attrs.color
      return mod
    }
    case 'button': {
      const mod = createModule('button')
      mod.props.text = attrs.text || '按钮'
      mod.props.link = attrs.link || ''
      if (attrs.size && ['small', 'medium', 'large'].includes(attrs.size)) {
        mod.props.size = attrs.size as 'small' | 'medium' | 'large'
      }
      return mod
    }
    case 'header': {
      const mod = createModule('header')
      if (attrs.title) mod.props.title = attrs.title
      if (attrs.subtitle) mod.props.subtitle = attrs.subtitle
      if (attrs.author) mod.props.author = attrs.author
      if (attrs.variant) {
        ;(mod.props as any).variant = attrs.variant
      }
      return mod
    }
    case 'footer': {
      const mod = createModule('footer')
      if (attrs.text) mod.props.text = attrs.text
      if (attrs.copyright) mod.props.copyright = attrs.copyright
      if (attrs.variant) {
        ;(mod.props as any).variant = attrs.variant
      }
      return mod
    }
    case 'heading': {
      const mod = createModule('heading')
      mod.props.text = attrs.text || content || '标题'
      if (attrs.level) mod.props.level = Math.min(Math.max(parseInt(attrs.level) || 1, 1), 6)
      if (attrs.variant) {
        ;(mod.props as any).variant = attrs.variant
      }
      if (attrs.showNumbering !== undefined) {
        mod.props.showNumbering = attrs.showNumbering === 'true'
      }
      return mod
    }
    case 'quote': {
      const mod = createModule('quote')
      mod.props.content = content || attrs.content || ''
      if (attrs.author) mod.props.author = attrs.author
      return mod
    }
    case 'toc': {
      const mod = createModule('toc')
      if (attrs.title) mod.props.title = attrs.title
      if (attrs.variant) {
        ;(mod.props as any).variant = attrs.variant
      }
      return mod
    }
    default: {
      // Unknown type: fallback to text module, keep content as-is
      const mod = createModule('text')
      mod.props.content = content || `[未知模块类型: ${type}]`
      return mod
    }
  }
}
```

- [ ] **Step 4: Add marked tokens → Module converter**

```typescript
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function convertMarkedTokens(tokens: Tokens.Generic[]): Module[] {
  const modules: Module[] = []

  for (const token of tokens) {
    switch (token.type) {
      case 'paragraph': {
        // Convert inline markdown to HTML (bold, italic, links, etc.)
        const html = marked.parseInline(token.text)
        const mod = createModule('text')
        mod.props.content = html
        modules.push(mod)
        break
      }
      case 'heading': {
        const hToken = token as Tokens.Heading
        const mod = createModule('heading')
        mod.props.text = hToken.text
        mod.props.level = hToken.depth
        mod.props.variant = 'simple'
        mod.props.showNumbering = false
        modules.push(mod)
        break
      }
      case 'blockquote': {
        const bqToken = token as Tokens.Blockquote
        const html = marked.parseInline(bqToken.text)
        const mod = createModule('quote')
        mod.props.content = html
        modules.push(mod)
        break
      }
      case 'hr': {
        modules.push(createModule('divider'))
        break
      }
      case 'code': {
        const cToken = token as Tokens.Code
        const mod = createModule('text')
        mod.props.content = `<pre><code>${escapeHtml(cToken.text)}</code></pre>`
        modules.push(mod)
        break
      }
      case 'list': {
        const lToken = token as Tokens.List
        let html = ''
        for (const item of lToken.items) {
          html += `• ${marked.parseInline(item.text)}<br/>`
        }
        const mod = createModule('text')
        mod.props.content = html
        modules.push(mod)
        break
      }
      case 'space':
        break
      default:
        break
    }
  }

  return modules
}
```

- [ ] **Step 5: Add segmentation logic — split content into `:::` blocks and plain markdown**

```typescript
interface Segment {
  type: 'md' | 'module-block'
  content: string
  moduleType?: string
  attrs?: Record<string, string>
}

function splitSegments(content: string): Segment[] {
  const segments: Segment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // Reset regex state
  MODULE_BLOCK_RE.lastIndex = 0

  while ((match = MODULE_BLOCK_RE.exec(content)) !== null) {
    // Add preceding markdown segment
    if (match.index > lastIndex) {
      const mdPart = content.slice(lastIndex, match.index).trim()
      if (mdPart) {
        segments.push({ type: 'md', content: mdPart })
      }
    }

    const attrs = parseAttrs(match[2] || '')
    segments.push({
      type: 'module-block',
      content: (match[3] || '').trim(),
      moduleType: match[1],
      attrs
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining markdown
  if (lastIndex < content.length) {
    const mdPart = content.slice(lastIndex).trim()
    if (mdPart) {
      segments.push({ type: 'md', content: mdPart })
    }
  }

  return segments
}
```

- [ ] **Step 6: Add local image detection**

```typescript
function countLocalImages(modules: Module[]): number {
  let count = 0
  for (const mod of modules) {
    if (mod.type === 'image' && mod.props.src) {
      const src = (mod.props as any).src as string
      if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('blob:')) {
        count++
      }
    }
    if (mod.children) {
      count += countLocalImages(mod.children)
    }
  }
  return count
}
```

- [ ] **Step 7: Add the main `importMarkdown` function**

```typescript
export async function importMarkdown(file: File): Promise<ImportResult> {
  // Read file
  const content = await file.text()

  if (!content.trim()) {
    throw new Error('文件内容为空')
  }

  // Extract title from filename
  const title = file.name.replace(/\.md$/i, '')

  // Split into segments
  const segments = splitSegments(content)
  const modules: Module[] = []

  for (const segment of segments) {
    if (segment.type === 'module-block') {
      const mod = createModuleFromBlock(
        segment.moduleType!,
        segment.attrs || {},
        segment.content
      )
      if (mod) modules.push(mod)
    } else {
      // Parse standard markdown with marked
      const tokens = marked.lexer(segment.content)
      const mdModules = convertMarkedTokens(tokens)
      modules.push(...mdModules)
    }
  }

  // Build the document
  const doc = createEmptyDocument(title)
  doc.root.children = modules

  // Count local images for notification
  const localImageCount = countLocalImages(modules)

  return { document: doc, localImageCount }
}

export async function importAndCreateArticle(file: File): Promise<string> {
  const { document: doc, localImageCount } = await importMarkdown(file)

  // Create article via API
  const article = await api.createArticle({
    title: doc.title,
    content: JSON.stringify(doc)
  })

  // Return article ID for redirect
  return article.id
}
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/services/markdown-importer.ts
git commit -m "feat: add markdown import service with marked parser"
```

---

### Task 3: Update `ArticleListPage.vue` with import button

**Files:**
- Modify: `frontend/src/pages/ArticleListPage.vue`

- [ ] **Step 1: Add import imports and state**

Add to `<script setup>` section, after the existing imports:

```typescript
import { importAndCreateArticle } from '@/services/markdown-importer'
import { ElMessage } from 'element-plus'

const importingMd = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
```

Replace the existing `ElMessage` import — check if it's already imported. If it's not imported at top level, add it. Looking at the current file, it already imports `ElMessage` from `element-plus`. So just add the other imports.

- [ ] **Step 2: Add the import handler function**

Add after the `closeModal` function:

```typescript
function triggerImportMd() {
  // Create a hidden file input
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.md'
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > 1024 * 1024) {
      ElMessage.info('文件较大（超过 1MB），解析可能需要几秒钟')
    }

    importingMd.value = true
    try {
      const articleId = await importAndCreateArticle(file)
      ElMessage.success(`"${file.name.replace(/\.md$/i, '')}" 导入成功`)
      // Navigate to editor
      const router = (await import('vue-router')).useRouter()
      // Can't use useRouter() outside setup, so redirect via window.location
      // Actually, we can access the router. Let's use a different approach:
      // Import router directly
      const routerInstance = await import('@/router')
      routerInstance.default.push(`/editor/article/${articleId}`)
    } catch (e: any) {
      ElMessage.error('导入失败: ' + (e.message || '未知错误'))
    } finally {
      importingMd.value = false
      // Clean up the input element
      input.remove()
    }
  }
  input.click()
}
```

Wait, this is problematic because we import router dynamically. Better to do it at the top of the file. Let me check the current imports — the file already imports `useRouter`. Let me use the router ref directly.

Looking at the existing code:
```typescript
const router = useRouter()
```

So `router` is already available. Here's the correct import handler:

```typescript
async function handleImportMd() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.md'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return

    importingMd.value = true
    try {
      const articleId = await importAndCreateArticle(file)
      const title = file.name.replace(/\.md$/i, '')
      ElMessage.success(`"${title}" 导入成功`)
      // Reload list
      await loadData()
      // Navigate to editor
      router.push(`/editor/article/${articleId}`)
    } catch (e: any) {
      ElMessage.error('导入失败: ' + (e.message || '未知错误'))
    } finally {
      importingMd.value = false
      input.remove()
    }
  }
  input.click()
}
```

- [ ] **Step 3: Add the import button to template**

In the template, after the "新建文章" button:

```html
<el-button
  :loading="importingMd"
  @click="handleImportMd"
>
  📄 导入 Markdown
</el-button>
```

Also add the `importingMd` ref to the script section:

```typescript
const importingMd = ref(false)
```

- [ ] **Step 4: Verify the build compiles**

Run from `frontend/`:

```bash
cd frontend && npx vue-tsc --noEmit 2>&1 | head -20
```

Expected: No type errors. Note: `vue-tsc` may have Node 24 compatibility issues noted in MEMORY.md — if it fails due to the known `Search string not found` error, use `npx vite build` instead.

```bash
cd frontend && npx vite build 2>&1 | tail -10
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ArticleListPage.vue
git commit -m "feat: add Markdown import button to article list page"
```

---

### Task 4: Verify full integration

- [ ] **Step 1: Run the Vite build**

```bash
cd frontend && npx vite build 2>&1
```

Expected: Build succeeds. Output includes: `✓ built in X.Xs`

- [ ] **Step 2: Create a test .md file to verify parser works**

```bash
cat > /tmp/test-import.md << 'TESTEOF'
# 欢迎阅读

这是一段**普通段落**，包含*斜体*和`代码`。

:::image src="https://picsum.photos/640/360" alt="示例图片"
:::

:::quote author="爱因斯坦"
想象力比知识更重要
:::

:::divider style="dashed"
:::

## 第一章

列表项：
- 项目一
- 项目二
- 项目三

:::button text="了解更多" link="https://example.com" size="large"
:::
TESTEOF
echo "Test file created"
```

- [ ] **Step 3: Commit any remaining changes**

```bash
git add -A
git commit -m "feat: complete markdown import feature"
```
