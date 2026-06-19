# Layout-to-Article Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move layout editing into articles: article stores its own content JSON; layouts become reusable templates.

**Architecture:** Add `content` column to `articles` table. EditorPage detects mode from route and saves to either article or layout endpoint. ArticleList becomes the primary hub; template management is secondary.

**Tech Stack:** Go (Gin, SQLite), Vue 3 (Pinia, vue-router)

---

### Task 1: Backend — Add `content` to Article model and DB schema

**Files:**
- Modify: `backend/internal/model/article.go`
- Modify: `backend/internal/store/sqlite.go`

- [ ] **Step 1: Update model**

Add `Content` field to `Article` struct and both request structs:

```go
type Article struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	LayoutID   string    `json:"layout_id"`
	Title      string    `json:"title"`
	Author     string    `json:"author"`
	Summary    string    `json:"summary"`
	CoverImage string    `json:"cover_image"`
	Content    string    `json:"content"`
	Status     string    `json:"status"`
	Deleted    int       `json:"-"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type CreateArticleRequest struct {
	Title      string `json:"title" binding:"required"`
	LayoutID   string `json:"layout_id"`
	Author     string `json:"author"`
	Summary    string `json:"summary"`
	CoverImage string `json:"cover_image"`
	Content    string `json:"content"`
}

type UpdateArticleRequest struct {
	Title      string `json:"title"`
	LayoutID   string `json:"layout_id"`
	Author     string `json:"author"`
	Summary    string `json:"summary"`
	CoverImage string `json:"cover_image"`
	Content    string `json:"content"`
	Status     string `json:"status" binding:"omitempty,oneof=draft published"`
}
```

- [ ] **Step 2: Add `content` column migration in store**

In `initTables()`, after the articles table `CREATE TABLE IF NOT EXISTS` block, add an ALTER to add the column if missing:

```go
_, _ = s.db.Exec(`ALTER TABLE articles ADD COLUMN content TEXT DEFAULT ''`)
```

SQLite does not support `IF NOT EXISTS` for `ADD COLUMN`, so just ignore the error (or use a pragma check). Simplest:

```go
// Attempt to add content column if it doesn't exist (safe to ignore error if already present)
_, _ = s.db.Exec(`ALTER TABLE articles ADD COLUMN content TEXT DEFAULT ''`)
```

- [ ] **Step 3: Update store SQL for articles**

Update all article SQL in `sqlite.go`:

`CreateArticle`:
```go
article := &model.Article{ ... Content: req.Content ... }
_, err := s.db.Exec(
    `INSERT INTO articles (id, user_id, layout_id, title, author, summary, cover_image, content, status, deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    article.ID, article.UserID, article.LayoutID, article.Title, article.Author,
    article.Summary, article.CoverImage, article.Content, article.Status, article.Deleted, article.CreatedAt, article.UpdatedAt,
)
```

`GetArticleByID` — add `content` to SELECT and Scan:
```go
query := `SELECT id, user_id, layout_id, title, author, summary, cover_image, content, status, deleted, created_at, updated_at FROM articles WHERE id = ? AND deleted = 0`
err := s.db.QueryRow(query, id).Scan(
    &article.ID, &article.UserID, &article.LayoutID, &article.Title, &article.Author,
    &article.Summary, &article.CoverImage, &article.Content, &article.Status, &article.Deleted,
    &article.CreatedAt, &article.UpdatedAt,
)
```

`GetArticlesByUser` — same SELECT/Scan change.

`UpdateArticle` — add content:
```go
if req.Content != "" {
    article.Content = req.Content
}
_, err = s.db.Exec(
    `UPDATE articles SET title = ?, layout_id = ?, author = ?, summary = ?, cover_image = ?, content = ?, status = ?, updated_at = ? WHERE id = ?`,
    article.Title, article.LayoutID, article.Author, article.Summary, article.CoverImage, article.Content, article.Status, article.UpdatedAt, id,
)
```

- [ ] **Step 4: Commit**

```bash
git add backend/internal/model/article.go backend/internal/store/sqlite.go
git commit -m "feat(backend): add content field to articles model and store"
```

---

### Task 2: Backend — Update article handler to persist content

**Files:**
- Modify: `backend/internal/handler/article.go`

- [ ] **Step 1: No code change needed if handler just passes request to store**

Verify `Create` and `Update` already bind the full request struct and pass it to `db.CreateArticle` / `db.UpdateArticle`. Since `Content` is part of the request struct, binding will pick it up automatically. Confirm no explicit field-by-field copying exists.

- [ ] **Step 2: Commit (or skip if no changes)**

If no changes, move on.

---

### Task 3: Frontend — Update API types and article endpoints

**Files:**
- Modify: `frontend/src/services/api.ts`

- [ ] **Step 1: Add content field to types**

```ts
export interface Article {
  id: string
  user_id: string
  layout_id: string
  title: string
  author: string
  summary: string
  cover_image: string
  content: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export interface ArticleCreateInput {
  title: string
  layout_id?: string
  author?: string
  summary?: string
  cover_image?: string
  content?: string
}

export interface ArticleUpdateInput {
  title?: string
  layout_id?: string
  author?: string
  summary?: string
  cover_image?: string
  content?: string
  status?: 'draft' | 'published'
}
```

- [ ] **Step 2: Update create/update payload**

No change needed to the API methods if they already spread the input object into the body (they do via `JSON.stringify(data)`), but verify:

`createArticle` and `updateArticle` already do `body: JSON.stringify(data)` so they will automatically include the new `content` field when present.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat(frontend): add content field to Article types and API"
```

---

### Task 4: Frontend — Remove "排版" from navigation

**Files:**
- Modify: `frontend/src/components/AppShell.vue`

- [ ] **Step 1: Remove layout nav item**

Change `navItems` computed to:

```ts
const navItems = computed(() => [
  { path: '/dashboard/articles', label: '文章' },
  ...(isAdmin.value ? [{ path: '/admin/users', label: '用户管理' }] : [])
])
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AppShell.vue
git commit -m "feat(ui): remove layout tab from top navigation"
```

---

### Task 5: Frontend — Update routes

**Files:**
- Modify: `frontend/src/router/index.ts`

- [ ] **Step 1: Replace article edit/new routes and layout list**

```ts
{
  path: '/dashboard',
  component: () => import('@/components/AppShell.vue'),
  children: [
    { path: '', redirect: '/dashboard/articles' },
    { path: 'articles', name: 'ArticleList', component: () => import('@/pages/ArticleListPage.vue') },
    // removed: articles/new, articles/:id/edit, layouts
  ]
},
{
  path: '/editor/article/:articleId',
  name: 'ArticleEditor',
  component: () => import('@/pages/EditorPage.vue')
},
{
  path: '/editor/template/:layoutId',
  name: 'TemplateEditor',
  component: () => import('@/pages/EditorPage.vue')
},
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/router/index.ts
git commit -m "feat(routing): add article/template editor routes, remove layout list"
```

---

### Task 6: Frontend — Transform ArticleListPage into the main hub

**Files:**
- Modify: `frontend/src/pages/ArticleListPage.vue`

- [ ] **Step 1: Update card actions and add template modal**

Replace the card "编辑" button with "编辑排版":
```vue
<button class="btn-small" @click="editArticleContent(article.id)">编辑排版</button>
```

Add `editArticleContent` function:
```ts
function editArticleContent(id: string) {
  router.push(`/editor/article/${id}`)
}
```

Keep `deleteArticle`.

Change top button to open a modal instead of navigating:
```vue
<button class="btn-primary" @click="showCreateModal = true">+ 新建文章</button>
```

Add modal state and refs:
```ts
const showCreateModal = ref(false)
const newTitle = ref('')
const newLayoutId = ref('')
const layouts = ref<Layout[]>([])

async function createArticleFromModal() {
  if (!newTitle.value) return
  let content = ''
  if (newLayoutId.value) {
    const layout = await api.getLayout(newLayoutId.value)
    content = JSON.stringify(layout.document)
  }
  const article = await api.createArticle({
    title: newTitle.value,
    content
  })
  showCreateModal.value = false
  newTitle.value = ''
  newLayoutId.value = ''
  router.push(`/editor/article/${article.id}`)
}
```

Load layouts in `onMounted` for the dropdown:
```ts
layouts.value = await api.listLayouts()
```

Add modal markup in template (simple centered dialog with title input, layout select, confirm/cancel).

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/ArticleListPage.vue
git commit -m "feat(articles): article list as main hub with create modal"
```

---

### Task 7: Frontend — EditorPage supports article and template modes

**Files:**
- Modify: `frontend/src/pages/EditorPage.vue`

- [ ] **Step 1: Detect mode from route**

```ts
const route = useRoute()
const isArticleMode = route.path.startsWith('/editor/article/')
const entityId = isArticleMode ? route.params.articleId as string : route.params.layoutId as string
```

- [ ] **Step 2: Add article metadata state**

```ts
const articleMeta = ref({
  title: '',
  author: '',
  summary: '',
  cover_image: '',
  status: 'draft' as 'draft' | 'published'
})
```

- [ ] **Step 3: Load data on mount**

Replace existing blank initialization with:

```ts
onMounted(async () => {
  if (isArticleMode) {
    const article = await api.getArticle(entityId)
    articleMeta.value = {
      title: article.title,
      author: article.author,
      summary: article.summary,
      cover_image: article.cover_image,
      status: article.status
    }
    if (article.content) {
      try {
        const doc = JSON.parse(article.content)
        documentStore.setDocument(doc)
      } catch {
        documentStore.setDocument(createEmptyDocument(article.title))
      }
    } else {
      documentStore.setDocument(createEmptyDocument(article.title))
    }
  } else {
    // template mode: load layout
    const layout = await api.getLayout(entityId)
    documentStore.setDocument(layout.document)
  }
})
```

- [ ] **Step 4: Save logic branching**

Change `handleSave` to branch:

```ts
async function handleSave() {
  isSaving.value = true
  saveMessage.value = ''
  try {
    if (isArticleMode) {
      await api.updateArticle(entityId, {
        title: articleMeta.value.title || documentStore.document.title,
        author: articleMeta.value.author,
        summary: articleMeta.value.summary,
        cover_image: articleMeta.value.cover_image,
        content: JSON.stringify(documentStore.document)
      })
    } else {
      await api.updateLayout(entityId, {
        name: documentStore.document.title,
        document: documentStore.document
      })
    }
    saveMessage.value = '保存成功！'
    setTimeout(() => saveMessage.value = '', 3000)
  } catch (error) {
    saveMessage.value = '保存失败'
    console.error(error)
  } finally {
    isSaving.value = false
  }
}
```

- [ ] **Step 5: Toolbar title input**

In template toolbar left, conditionally show article title input:
```vue
<div v-if="isArticleMode" class="article-title-input">
  <input v-model="articleMeta.title" placeholder="文章标题" />
</div>
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/EditorPage.vue
git commit -m "feat(editor): support article and template editing modes"
```

---

### Task 8: Frontend — Add article metadata to PropertyPanel

**Files:**
- Modify: `frontend/src/components/PropertyPanel.vue`
- Modify: `frontend/src/pages/EditorPage.vue` (to pass props/provide)

- [ ] **Step 1: In EditorPage, provide articleMeta**

```ts
provide('isArticleMode', isArticleMode)
provide('articleMeta', articleMeta)
```

- [ ] **Step 2: In PropertyPanel, inject and show metadata fields**

```ts
const isArticleMode = inject('isArticleMode', false)
const articleMeta = inject('articleMeta', ref({ title:'', author:'', summary:'', cover_image:'' }))
```

Add conditional section in template:
```vue
<div v-if="isArticleMode" class="panel-section">
  <h4>文章信息</h4>
  <label>作者 <input v-model="articleMeta.author" /></label>
  <label>摘要 <textarea v-model="articleMeta.summary" rows="2" /></label>
  <label>封面图URL <input v-model="articleMeta.cover_image" /></label>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PropertyPanel.vue frontend/src/pages/EditorPage.vue
git commit -m "feat(editor): add article metadata panel"
```

---

### Task 9: Frontend — Rename LayoutListPage to TemplateListPage

**Files:**
- Modify: `frontend/src/pages/LayoutListPage.vue` (rename to `TemplateListPage.vue`)
- Modify: `frontend/src/router/index.ts`

- [ ] **Step 1: Rename file**

```bash
cd frontend/src/pages
mv LayoutListPage.vue TemplateListPage.vue
```

- [ ] **Step 2: Update page content**

Open `TemplateListPage.vue` and change:
- `<h2>我的排版</h2>` → `<h2>排版模板</h2>`
- "还没有排版" → "还没有模板"
- "未命名排版" → "未命名模板"
- In card actions, change "编辑" to "编辑模板"
- Add a button "用此模板创建文章" in card actions:

```vue
<button class="btn-small primary" @click="createArticleFromTemplate(layout.id)">用此模板创建文章</button>
```

```ts
async function createArticleFromTemplate(layoutId: string) {
  const layout = await api.getLayout(layoutId)
  const article = await api.createArticle({
    title: layout.name,
    content: JSON.stringify(layout.document)
  })
  router.push(`/editor/article/${article.id}`)
}
```

- [ ] **Step 3: Add template library route**

In `router/index.ts`, under dashboard children add:
```ts
{ path: 'templates', name: 'TemplateList', component: () => import('@/pages/TemplateListPage.vue') }
```

- [ ] **Step 4: Add "模板库" link in ArticleListPage**

In `ArticleListPage.vue` header, next to "新建文章", add:
```vue
<button class="btn-secondary" @click="router.push('/dashboard/templates')">模板库</button>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LayoutListPage.vue frontend/src/pages/TemplateListPage.vue frontend/src/router/index.ts frontend/src/pages/ArticleListPage.vue
git commit -m "feat(templates): rename layout list to template list, add create-from-template"
```

---

### Task 10: Frontend — Delete old ArticleEditorPage

**Files:**
- Delete: `frontend/src/pages/ArticleEditorPage.vue`

- [ ] **Step 1: Remove file**

```bash
git rm frontend/src/pages/ArticleEditorPage.vue
git commit -m "chore: remove standalone ArticleEditorPage, absorbed into EditorPage"
```

---

### Task 11: Verification

- [ ] **Step 1: Build check**

```bash
cd frontend && npm run build
cd ../backend && go build ./cmd/api/
```

- [ ] **Step 2: Manual smoke test**

1. Start backend
2. Start frontend
3. Login
4. "新建文章" → enter title → create → should land in editor with empty document
5. Add some modules, save
6. Go back to article list → click "编辑排版" → should load previously saved content
7. "模板库" → "用此模板创建文章" → should create article with copied content
8. Verify article content is independent (edit one doesn't affect the other)

- [ ] **Step 3: Final commit (or just verify)**

