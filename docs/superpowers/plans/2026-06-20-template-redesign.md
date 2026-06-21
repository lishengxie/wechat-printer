# Template Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign templates from per-type StyleDefinitions to full Document storage, add example article and template selection at article creation, and enable per-module style picking from templates in the editor.

**Architecture:** Template `Layout.content` now stores a full Document (module tree + styles) instead of `{ type → styles }` map. Article creation dialog gains example article tag picker. PropertyPanel shows a template section for per-module style application. Backward compat handled for existing StyleDefinitions data.

**Tech Stack:** Vue 3 + Pinia + Element Plus (frontend), Go + Gin (backend), SQLite

---

### Task 1: Backend — Remove `binding:"required"` from CreateLayoutRequest.Content

**Files:**
- Modify: `backend/internal/model/layout.go:22`

- [ ] **Step 1: Remove the required binding on Content**

Current code at line 22-25:
```go
type CreateLayoutRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Content     string `json:"content" binding:"required"`
	CSS         string `json:"css"`
}
```

Change `Content` field to remove `binding:"required"`:
```go
type CreateLayoutRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Content     string `json:"content"`
	CSS         string `json:"css"`
}
```

This is needed because templates are now created empty (no Document yet) and filled in during editing. The backend handler already handles empty content gracefully — it defaults to `""`.

- [ ] **Step 2: Verify the backend still compiles**

Run: `cd backend && go build ./...`
Expected: clean build, no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/internal/model/layout.go
git commit -m "fix: remove required binding on CreateLayoutRequest.Content for new template model"
```

---

### Task 2: Frontend — Update Layout type in api.ts

**Files:**
- Modify: `frontend/src/services/api.ts`

- [ ] **Step 1: Replace `StyleDefinitions` with `Document` in Layout interface**

Remove the `StyleDefinitions` type (line 5) and the old `Layout` interface (lines 19-27). Add the `Document` import and rewrite:

Current (lines 1-27):
```typescript
import type { Document, ModuleStyles } from '@/types/document'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

export type StyleDefinitions = Record<string, ModuleStyles>

export interface Layout {
  id: string
  name: string
  description?: string
  styles: StyleDefinitions
  isPreset: boolean
  createdAt: string
  updatedAt: string
}
```

New:
```typescript
import type { Document, ModuleStyles, ModuleType } from '@/types/document'
import { createModule, createEmptyDocument } from '@/types/document'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

export interface Layout {
  id: string
  name: string
  description?: string
  document: Document | null
  isPreset: boolean
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Update `LayoutCreateInput` and `LayoutUpdateInput`**

Replace `styles: StyleDefinitions` with `document?: Document`:

```typescript
export interface LayoutCreateInput {
  name: string
  description?: string
  document?: Document
}
export interface LayoutUpdateInput {
  name?: string
  description?: string
  document?: Document
}
```

- [ ] **Step 3: Rewrite `backendToFrontend` with backward compat**

Replace the existing `backendToFrontend` function (lines 152-168):

```typescript
import type { ModuleType } from '@/types/document'

function convertStyleDefsToDocument(styles: Record<string, ModuleStyles>): Document {
  const doc = createEmptyDocument('模板')
  for (const [type, style] of Object.entries(styles)) {
    const mod = createModule(type as ModuleType)
    mod.styles = style
    doc.root.children!.push(mod)
  }
  return doc
}

function backendToFrontend(backend: BackendLayout): Layout {
  let document: Document | null = null
  try {
    const parsed = JSON.parse(backend.content)
    // Detect old format (keyed by module type strings) vs new format (has 'root')
    if (parsed && parsed.root) {
      document = parsed as Document
    } else if (parsed && typeof parsed === 'object') {
      // Old StyleDefinitions format — convert
      document = convertStyleDefsToDocument(parsed as Record<string, ModuleStyles>)
    }
  } catch {
    // Invalid JSON, leave as null
  }
  return {
    id: backend.id,
    name: backend.name,
    description: backend.description,
    document,
    isPreset: !!backend.is_preset,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at
  }
}
```

- [ ] **Step 4: Update `createLayout` and `updateLayout`**

In the `createLayout` API method, change `content: JSON.stringify(data.styles)` to `content: data.document ? JSON.stringify(data.document) : ''`:

```typescript
async createLayout(data: LayoutCreateInput): Promise<Layout> {
  const response = await request<{ data: BackendLayout }>('/layouts', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      description: data.description || '',
      content: data.document ? JSON.stringify(data.document) : '',
      css: ''
    })
  })
  return backendToFrontend(response.data)
},
```

Similarly in `updateLayout`:
```typescript
async updateLayout(id: string, data: LayoutUpdateInput): Promise<Layout> {
  const response = await request<{ data: BackendLayout }>(`/layouts/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: data.name,
      description: data.description || '',
      content: data.document ? JSON.stringify(data.document) : undefined,
      css: ''
    })
  })
  return backendToFrontend(response.data)
},
```

- [ ] **Step 5: Remove unused `StyleDefinitions` export**

Check that no other files import `StyleDefinitions` from api.ts. If not, it can be removed entirely (the old type alias is no longer part of the `Layout` interface). `ModuleStyles` is still used internally for `convertStyleDefsToDocument` and should remain.

- [ ] **Step 6: Verify frontend type-check**

Run: `cd frontend && npx vue-tsc --noEmit 2>&1 | head -40`
Expected: type errors are only about the files we haven't changed yet (EditorPage, etc.), not about api.ts itself.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "refactor: change Layout type from styles to document with backward compat"
```

---

### Task 3: Document Store — New template methods + example articles

**Files:**
- Modify: `frontend/src/stores/document.ts`

- [ ] **Step 1: Add `applyTemplateFromDocument` method**

Replace the existing `applyTemplateStyles` (lines 560-577) with two new methods:

```typescript
function applyTemplateFromDocument(templateDocument: Document) {
  saveToHistory()
  const newDoc = JSON.parse(JSON.stringify(document.value))

  // Build moduleType → styles map from template
  const stylesByType: Record<string, ModuleStyles> = {}
  function collect(module: Module) {
    if (module.styles && Object.keys(module.styles).length > 0) {
      stylesByType[module.type] = { ...module.styles }
    }
    if (module.children) {
      module.children.forEach(collect)
    }
  }
  collect(templateDocument.root)

  // Apply to current document
  function traverse(module: Module) {
    const moduleStyles = stylesByType[module.type]
    if (moduleStyles) {
      module.styles = { ...module.styles, ...moduleStyles }
    }
    if (module.children) {
      module.children.forEach(traverse)
    }
  }
  traverse(newDoc.root)

  newDoc.updatedAt = new Date().toISOString()
  document.value = newDoc
}

function applyTemplateModuleStyles(templateDocument: Document, targetModuleId: string) {
  const targetModule = findModuleById(document.value.root, targetModuleId)
  if (!targetModule) return

  // Find the matching module in template by type
  let templateModule: Module | null = null
  function findTemplateModule(module: Module) {
    if (module.type === targetModule.type) {
      templateModule = module
    }
    if (module.children && !templateModule) {
      module.children.forEach(findTemplateModule)
    }
  }
  findTemplateModule(templateDocument.root)

  if (templateModule && templateModule.styles) {
    updateModuleStyles(targetModuleId, templateModule.styles)
  }
}
```

- [ ] **Step 2: Restructure `loadTestData` to be a named example article factory**

Rename `loadTestData` to `getProductReviewExample` and make it return a Document instead of setting state directly:

```typescript
function getProductReviewExample(): Document {
  const doc = createEmptyDocument('【深度评测】2024年度旗舰产品发布全解析')
  // ... all existing module creation code from loadTestData ...
  // Same content but returns doc instead of setting document.value
  return doc
}

function loadExampleArticle(exampleId: string) {
  switch (exampleId) {
    case 'product-review':
      setDocument(getProductReviewExample())
      break
    default:
      setDocument(createEmptyDocument())
  }
}
```

Move ALL module creation code (lines 74-353) inside `getProductReviewExample` and return `doc` at the end instead of assigning to `document.value`. Keep the `container` type checking in mind — `loadTestData` sets `root` to a container with `single` layout and creates children as `text`, `image`, etc. modules.

- [ ] **Step 3: Update the return object**

Add the new methods to the return object and remove the old `applyTemplateStyles` reference. The `loadTestData` can be kept but reimplemented as a wrapper:
```typescript
function loadTestData() {
  const doc = getProductReviewExample()
  setDocument(doc)
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/stores/document.ts
git commit -m "feat: add template document methods and example article factory"
```

---

### Task 4: Article List Page — Add example article picker to create dialog

**Files:**
- Modify: `frontend/src/pages/ArticleListPage.vue`

- [ ] **Step 1: Add example articles data**

Add a computed or const with the available example articles (before the component setup):
```typescript
const EXAMPLE_ARTICLES = [
  { id: 'product-review', name: '产品评测文' },
  { id: 'blank', name: '空白文章' }
] as const
```

- [ ] **Step 2: Add example selection state**

Add to setup:
```typescript
const selectedExample = ref('product-review') // default to product review? Or '' for none?
```

The default should be `'blank'` for new users (no preset) but let's default to `''` meaning "let the user pick". Actually, let's default to `'blank'` so clicking "创建并编辑" immediately works.

- [ ] **Step 3: Update the dialog template**

Replace the dialog content (lines 134-166) with:

```vue
    <el-dialog
      v-model="showCreateModal"
      title="新建文章"
      width="480px"
      @close="closeModal"
    >
      <el-form label-position="top">
        <el-form-item label="标题 *">
          <el-input v-model="newTitle" placeholder="文章标题" />
        </el-form-item>
        <el-form-item label="示例文章">
          <div class="example-tags">
            <el-tag
              v-for="ex in EXAMPLE_ARTICLES"
              :key="ex.id"
              :type="selectedExample === ex.id ? 'primary' : 'info'"
              :effect="selectedExample === ex.id ? 'dark' : 'plain'"
              style="cursor: pointer; margin-right: 8px; margin-bottom: 4px;"
              @click="selectedExample = ex.id"
            >
              {{ ex.name }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="应用模板（可选）">
          <el-select v-model="newLayoutId" placeholder="选择模板" clearable style="width: 100%">
            <el-option label="不选" value="" />
            <el-option
              v-for="layout in layouts"
              :key="layout.id"
              :label="layout.name"
              :value="layout.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeModal">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createArticleFromModal">
          {{ creating ? '创建中...' : '创建并编辑' }}
        </el-button>
      </template>
    </el-dialog>
```

- [ ] **Step 4: Update `createArticleFromModal` to pass layout_id and example param**

Update line 51-72:
```typescript
async function createArticleFromModal() {
  if (!newTitle.value.trim()) {
    ElMessage.warning('请填写文章标题')
    return
  }
  if (creating.value) return
  creating.value = true
  try {
    const article = await api.createArticle({
      title: newTitle.value.trim(),
      content: '',
      layout_id: newLayoutId.value || undefined
    })
    showCreateModal.value = false

    const params = new URLSearchParams()
    if (selectedExample.value && selectedExample.value !== 'blank') {
      params.set('example', selectedExample.value)
    }
    if (newLayoutId.value) {
      params.set('template', newLayoutId.value)
    }
    const qs = params.toString()

    newTitle.value = ''
    newLayoutId.value = ''
    selectedExample.value = 'blank'
    router.push(`/editor/article/${article.id}${qs ? '?' + qs : ''}`)
  } catch (e: any) {
    ElMessage.error('创建失败: ' + e.message)
  } finally {
    creating.value = false
  }
}
```

- [ ] **Step 5: Clear selection in `closeModal`**

Add `selectedExample.value = 'blank'` to the closeModal function.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/ArticleListPage.vue
git commit -m "feat: add example article picker to article creation dialog"
```

---

### Task 5: Editor Page — Remove load example, change template switching

**Files:**
- Modify: `frontend/src/pages/EditorPage.vue`

- [ ] **Step 1: Remove "加载示例" button and its handler**

Remove line 256-258 from the template:
```vue
<el-button @click="documentStore.loadTestData">
  📋 加载示例
</el-button>
```

Also remove any `loadTestData` references.

- [ ] **Step 2: Update template switching to only associate, not auto-apply**

Replace the `applyTemplate` function (lines 66-78):
```typescript
async function selectTemplate(tmpl: Layout) {
  if (applyingTemplate.value) return
  applyingTemplate.value = true
  try {
    // Just associate the template with the article, don't auto-apply styles
    associatedTemplate.value = tmpl
    if (isArticleMode) {
      articleMeta.value.layout_id = tmpl.id  // Track in article meta
    }
    ElMessage.success(`已关联「${tmpl.name}」，可在属性面板中按模块应用样式`)
    showStylePicker.value = false
  } catch (e: any) {
    ElMessage.error('关联模板失败: ' + e.message)
  } finally {
    applyingTemplate.value = false
  }
}
```

- [ ] **Step 3: Add `associatedTemplate` ref and provide it**

Add at line 58 (after showStylePicker):
```typescript
const associatedTemplate = ref<Layout | null>(null)
provide('associatedTemplate', associatedTemplate)
```

- [ ] **Step 4: Update template dialog to use `selectTemplate`**

In the template dialog (lines 323-343), change:
```vue
@click="applyTemplate(tmpl)"
```
to:
```vue
@click="selectTemplate(tmpl)"
```

- [ ] **Step 5: Update the template list loading to handle URL params**

Update onMounted (lines 92-144). Replace the `templateId = route.query.template` block to also handle `example` param:

```typescript
  // Load associated template if article has layout_id
  if (isArticleMode && articleMeta.value.layout_id) {
    try {
      const tmpl = await api.getLayout(articleMeta.value.layout_id)
      if (tmpl.document) {
        associatedTemplate.value = tmpl
      }
    } catch (e) {
      console.warn('Failed to load associated template:', e)
    }
  }

  // Handle URL template param (from creation) — apply styles, then associate
  const templateId = route.query.template as string
  if (templateId) {
    try {
      const tmpl = availableTemplates.value.find(t => t.id === templateId)
        || await api.getLayout(templateId)
      if (tmpl.document) {
        documentStore.applyTemplateFromDocument(tmpl.document)
        associatedTemplate.value = tmpl
      }
    } catch (e) {
      console.warn('Failed to apply template:', e)
    }
  }

  // Handle URL example param (from creation)
  const exampleId = route.query.example as string
  if (exampleId) {
    documentStore.loadExampleArticle(exampleId)
  } else if (!templateId) {
    // No example, no template — ensure empty doc (article already loaded its own content)
    // Only do this if article.content was empty
  }

  // If both example and template were provided, template styles should have been
  // applied AFTER example document was loaded. Re-order if both exist:
  if (exampleId && templateId && associatedTemplate.value?.document) {
    // Re-apply: first load example, then apply template
    documentStore.loadExampleArticle(exampleId)
    documentStore.applyTemplateFromDocument(associatedTemplate.value.document)
  }
```

Wait, the ordering is tricky. Let me simplify. Since example and template can both come from URL params, the safest order is:
1. Load example document (if example param)
2. Apply template styles (if template param)

Actually, there's a conflict: the article content is loaded from the API first (lines 93-112). Then we potentially override it with example/template. Let me restructure the onMounted:

```typescript
onMounted(async () => {
  // Load layouts list
  await loadTemplates()

  if (isArticleMode) {
    try {
      const article = await api.getArticle(entityId)
      articleMeta.value = {
        title: article.title,
        author: article.author,
        summary: article.summary,
        cover_image: article.cover_image,
        status: article.status
      }

      // Check URL params first (from creation flow)
      const exampleId = route.query.example as string
      const templateId = route.query.template as string

      if (exampleId) {
        // Creation flow with example article → load preset
        documentStore.loadExampleArticle(exampleId)
      } else if (article.content) {
        // Normal load: parse saved article content
        try {
          const doc = JSON.parse(article.content)
          documentStore.setDocument(doc)
        } catch {
          documentStore.setDocument(createEmptyDocument(article.title))
        }
      } else {
        documentStore.setDocument(createEmptyDocument(article.title))
      }

      // Apply template styles if URL param specified
      if (templateId) {
        const tmpl = availableTemplates.value.find(t => t.id === templateId)
          || await api.getLayout(templateId)
        if (tmpl.document) {
          documentStore.applyTemplateFromDocument(tmpl.document)
          associatedTemplate.value = tmpl
        }
      } else if (article.layout_id) {
        // Load associated template from article data
        try {
          const tmpl = await api.getLayout(article.layout_id)
          if (tmpl.document) {
            associatedTemplate.value = tmpl
          }
        } catch (e) {
          console.warn('Failed to load associated template:', e)
        }
      }
    } catch (e: any) {
      ElMessage.error('加载文章失败: ' + e.message)
      router.push('/dashboard/articles')
    }
  } else {
    // Template mode
    try {
      const layout = await api.getLayout(entityId)
      if (layout.document) {
        documentStore.setDocument(layout.document)
      } else {
        documentStore.setDocument(createEmptyDocument(layout.name))
      }
    } catch (e: any) {
      ElMessage.error('加载模板失败: ' + e.message)
      router.push('/dashboard/templates')
    }
  }
})
```

- [ ] **Step 6: Update template save logic for template mode**

In `handleSave` (lines 146-181), update the template mode block (lines 157-172):

Current:
```typescript
} else {
  // 模板模式：从当前文档提取各模块类型的样式定义，保存为样式模板
  const styles: Record<string, any> = {}
  function collectStyles(module: any) {
    if (module.styles && Object.keys(module.styles).length > 0) {
      styles[module.type] = { ...module.styles }
    }
    if (module.children) {
      module.children.forEach(collectStyles)
    }
  }
  collectStyles(documentStore.document.root)
  await api.updateLayout(entityId, {
    name: documentStore.document.title,
    styles
  })
}
```

New:
```typescript
} else {
  // 模板模式：保存完整 Document
  await api.updateLayout(entityId, {
    name: documentStore.document.title,
    document: documentStore.document
  })
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/EditorPage.vue
git commit -m "feat: update editor for new template model (remove load example, associate-only template switching)"
```

---

### Task 6: Property Panel — Add template section for per-module style application

**Files:**
- Modify: `frontend/src/components/PropertyPanel.vue`

- [ ] **Step 1: Add imports at the top**

```typescript
import { inject, ref, computed, type Ref } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { ElMessage } from 'element-plus'
import type { Layout } from '@/services/api'
```

- [ ] **Step 2: Add template section logic**

After the existing script setup, add:
```typescript
const documentStore = useDocumentStore()
const isArticleMode = inject<boolean>('isArticleMode', false)
const associatedTemplate = inject<Ref<Layout | null>>('associatedTemplate', ref(null))

const selectedModule = computed(() => documentStore.selectedModule)

const templateModuleStyles = computed(() => {
  if (!isArticleMode || !associatedTemplate.value?.document || !selectedModule.value) return null

  const templateDoc = associatedTemplate.value.document
  const targetType = selectedModule.value.type

  // Find module of same type in template
  function findInTemplate(module: any): any | null {
    if (module.type === targetType) return module
    if (module.children) {
      for (const child of module.children) {
        const found = findInTemplate(child)
        if (found) return found
      }
    }
    return null
  }

  const found = findInTemplate(templateDoc.root)
  return found ? found.styles : null
})

function applyTemplateStyle() {
  if (!associatedTemplate.value?.document || !selectedModule.value) return

  const prev = documentStore.selectedModuleId
  if (!prev) return

  documentStore.applyTemplateModuleStyles(associatedTemplate.value.document, prev)
  ElMessage.success('已应用模板样式')
}
```

- [ ] **Step 3: Add template section to the template**

Find the PropertyPanel's current template structure and add a "模板" section. The exact insertion point depends on the existing template — it should go near the bottom of the property panel, after all module-specific properties.

Add this block inside the main content area (before any closing `</div>` or after the last property editor component):

```vue
<!-- 模板样式应用（仅文章模式） -->
<template v-if="isArticleMode && associatedTemplate && templateModuleStyles">
  <div class="property-section">
    <div class="section-header">
      <span class="section-title">
        <el-tag size="small" type="success" effect="light" style="margin-right: 4px;">模板</el-tag>
        {{ associatedTemplate.name }}
      </span>
    </div>
    <div class="template-style-card" v-if="templateModuleStyles">
      <div class="template-style-header">
        <span class="template-module-type">{{ selectedModule?.type }} 模块样式</span>
        <el-button size="small" type="primary" plain @click="applyTemplateStyle">
          应用
        </el-button>
      </div>
      <div class="template-style-tags">
        <el-tag
          v-for="(value, key) in templateModuleStyles"
          :key="key"
          size="small"
          hit
          style="margin: 2px;"
        >
          {{ key }}: {{ value }}
        </el-tag>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Add styles for template section**

Add scoped CSS:
```css
.property-section { padding: 12px; border-top: 1px solid var(--el-border-color-light); }
.section-header { margin-bottom: 8px; }
.section-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); display: flex; align-items: center; }
.template-style-card { background: var(--el-fill-color-light); border-radius: 8px; padding: 10px; }
.template-style-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.template-module-type { font-size: 12px; font-weight: 600; color: var(--el-text-color-regular); }
.template-style-tags { display: flex; flex-wrap: wrap; gap: 2px; }
```

- [ ] **Step 5: Verify by checking for existing property editor imports**

Read the PropertyPanel.vue to check what's already imported. The existing file likely already has imports for `defineProps`/`computed` etc from Vue. Ensure no duplicate imports.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/PropertyPanel.vue
git commit -m "feat: add template style picker to PropertyPanel for per-module application"
```

---

### Task 7: Template List Page — Update references from styles to document

**Files:**
- Modify: `frontend/src/pages/TemplateListPage.vue`

- [ ] **Step 1: Remove `styles: {}` from createLayout call**

Line 54 sends `styles: {}` — change to:
```typescript
await api.createLayout({
  name: newName.value.trim(),
  description: newDescription.value.trim()
})
```

No need to send empty styles/document.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/TemplateListPage.vue
git commit -m "fix: remove empty styles from template creation call"
```
