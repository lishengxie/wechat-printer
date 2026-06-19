# Layout-to-Article Migration Design

## Goal
Move the visual typesetting (layout editing) capability into the Article tab. Layouts become "templates" used only when creating a new article.

## Decision: Approach 1 — Article Owns Content

## Backend Changes

### Database
- Add `content TEXT` column to `articles` table (stores JSON document, same format as `layouts.content`)

### Models
- `model.Article`: add `Content string`
- `model.CreateArticleRequest`: add `Content string`
- `model.UpdateArticleRequest`: add `Content string`

### Store
- `CreateArticle`, `UpdateArticle`, `GetArticleByID`, `GetArticlesByUser`: include `content` in SQL queries

### Handler
- `ArticleHandler.Create` / `Update`: accept and persist content field
- No API endpoint changes; response shape gains `content` field

## Frontend Changes

### API (`services/api.ts`)
- `Article` interface: add `content?: string`
- `ArticleCreateInput` / `ArticleUpdateInput`: add `content?: string`

### Navigation (`AppShell.vue`)
- Remove "排版" tab. Only "文章" and "用户管理" remain.

### Routing (`router/index.ts`)
- Remove `/dashboard/layouts`
- Remove `/dashboard/articles/new` and `/dashboard/articles/:id/edit` (old metadata-only form)
- Editor routes:
  - `/editor/article/:articleId` — edit article layout content
  - `/editor/template/:layoutId` — edit template (kept but not in nav)

### Article List Page
- Cards show "编辑排版" instead of "编辑"
- Top "新建文章" opens a modal: title (required) + optional template selector
- After creation, auto-navigate to `/editor/article/:id`

### Editor Page (`EditorPage.vue`)
- Detect mode from route path (`/editor/article/*` vs `/editor/template/*`)
- Article mode: load article via API → parse `content` into document store → save PUTs to `/articles/:id`
- Template mode: keep existing behavior (PUT to `/layouts/:id`)
- Toolbar left: show editable article title input (article mode only)
- Right sidebar: add "文章信息" tab (author, summary, cover image) when in article mode

### Deleted
- `ArticleEditorPage.vue` (old form-only page absorbed into editor)

### Template Management
- `LayoutListPage.vue` renamed to `TemplateListPage.vue`
- Accessible from ArticleList via "模板库" button
- Operations: preview, "use this template to create article", new/edit/delete template
- Edit navigates to `/editor/template/:id`

## Data Flow

New Article:
1. User clicks "新建文章" → modal opens
2. Fills title, optionally picks a template
3. POST `/articles` with title + (if template chosen) template's content copied
4. Navigate to `/editor/article/:id`
5. Editor loads article, parses content into store
6. User edits visually, clicks Save → PUT `/articles/:id` with updated content + metadata

## Files Modified
- `backend/internal/model/article.go`
- `backend/internal/store/sqlite.go`
- `backend/internal/handler/article.go`
- `frontend/src/services/api.ts`
- `frontend/src/components/AppShell.vue`
- `frontend/src/router/index.ts`
- `frontend/src/pages/ArticleListPage.vue`
- `frontend/src/pages/EditorPage.vue`
- `frontend/src/pages/LayoutListPage.vue` (rename + adjust)
- Delete: `frontend/src/pages/ArticleEditorPage.vue`
