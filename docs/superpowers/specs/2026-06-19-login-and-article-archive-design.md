# Login and Article Archive - Design Spec

**Date:** 2026-06-19
**Author:** Claude Code
**Status:** Draft - Ready for Review

## Overview

Add local account/password authentication with JWT and an article archive system to the existing WeChat public account layout editor. The article system separates "layout templates" from "published articles" and enforces user-scoped data access.

## Technology Stack

- **Frontend:** Vue 3 + TypeScript + Vite + TailwindCSS + Pinia
- **Backend:** Golang + Gin + SQLite + bcrypt + JWT
- **State Management:** Pinia (add auth store)

## 1. System Architecture

### High-Level Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vue3)                       │
├────────────┬───────────────┬──────────────┬──────────────────┤
│  Login     │  Dashboard    │   Article    │    User Mgmt     │
│  Page      │  / Articles   │   Editor     │   (Admin Only)   │
│            │  / Layouts    │              │                  │
└────────────┴───────────────┴──────────────┴──────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                        BACKEND (Golang/Gin)                  │
├──────────────────┬──────────────────┬────────────────────────┤
│  Auth API        │  Layout API       │   Article API          │
│  /api/auth/*     │  /api/layouts/*   │   /api/articles/*      │
│                  │                   │                        │
│  JWT Middleware  │  + user_id filter │   CRUD + status        │
├──────────────────┴──────────────────┴────────────────────────┤
│  SQLite                                                      │
│  users │ layouts │ articles                                  │
└──────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **User-scoped data:** All layouts and articles are owned by a user. Users only see their own data; admins see all.
2. **Soft delete everywhere:** Deletion only sets `deleted = 1`. Data is never physically removed.
3. **Separation of concerns:** Layouts are reusable templates; articles are publishable documents with metadata.
4. **JWT stateless auth:** Token contains `user_id` and `role`. Expires in 7 days.

## 2. Database Schema

### Tables

```sql
-- Users table
CREATE TABLE users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',  -- 'admin' | 'user'
    deleted       INTEGER NOT NULL DEFAULT 0,     -- 0=active, 1=soft-deleted
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Layouts table (existing + user_id + deleted)
CREATE TABLE layouts (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    content     TEXT NOT NULL,
    css         TEXT,
    html        TEXT,
    deleted     INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Articles table (new)
CREATE TABLE articles (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    layout_id   TEXT NOT NULL,
    title       TEXT NOT NULL,
    author      TEXT,
    summary     TEXT,
    cover_image TEXT,
    status      TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'published'
    deleted     INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (layout_id) REFERENCES layouts(id)
);
```

### Soft Delete Strategy

- All queries default to `WHERE deleted = 0`.
- DELETE endpoints perform `UPDATE ... SET deleted = 1`.
- Admin may later view/recover soft-deleted items via a recycle bin feature.

## 3. Backend API Design

### Auth Endpoints

| Method | Route | Body | Response | Auth |
|--------|-------|------|----------|------|
| `POST` | `/api/auth/login` | `{username, password}` | `{token, user: {id, username, role}}` | No |
| `POST` | `/api/auth/register` | `{username, password, role}` | `{id, username, role}` | Admin only |

### Layout Endpoints (modified from existing)

| Method | Route | Changes |
|--------|-------|---------|
| `GET` | `/api/layouts` | Returns current user's layouts; admin returns all. |
| `GET` | `/api/layouts/:id` | Ownership check before returning. |
| `POST` | `/api/layouts` | Auto binds `user_id` from JWT. |
| `PUT` | `/api/layouts/:id` | Only owner or admin can update. |
| `DELETE` | `/api/layouts/:id` | Soft delete; checks ownership. |

### Article Endpoints (new)

| Method | Route | Body | Description |
|--------|-------|------|-------------|
| `GET` | `/api/articles` | — | List current user's articles (admin = all). Supports `?status=draft`. |
| `GET` | `/api/articles/:id` | — | Get article + embedded layout data. |
| `POST` | `/api/articles` | `{title, author?, summary?, cover_image?, layout_id\|layout_data}` | Create article. Can reference existing layout or create a new one inline. |
| `PUT` | `/api/articles/:id` | `{title?, author?, summary?, cover_image?, status?, layout_id?}` | Update article metadata. |
| `DELETE` | `/api/articles/:id` | — | Soft delete. |

### JWT Middleware

- All `/api/*` except `/api/auth/login` require `Authorization: Bearer <token>`.
- Token payload: `{ user_id, role, exp }`.
- Expiration: 7 days.
- On validation failure, return `401` with `{"error": "unauthorized"}`.

## 4. Frontend Design

### Route Structure

| Route | Page | Auth Required | Admin Only |
|-------|------|---------------|------------|
| `/login` | LoginPage | No | No |
| `/dashboard` | Dashboard (redirects to `/dashboard/articles`) | Yes | No |
| `/dashboard/articles` | ArticleList | Yes | No |
| `/dashboard/articles/new` | ArticleEditor (new) | Yes | No |
| `/dashboard/articles/:id/edit` | ArticleEditor (existing) | Yes | No |
| `/dashboard/layouts` | LayoutList | Yes | No |
| `/editor/:layoutId` | LayoutEditor (existing editor) | Yes | No |
| `/admin/users` | UserManagement | Yes | Yes |

### Page Descriptions

**LoginPage**
- Username and password inputs.
- On success, store JWT in `localStorage`, initialize Pinia auth store, redirect to `/dashboard`.
- Show error on invalid credentials.

**ArticleList**
- Card grid of user's articles.
- Each card: title, status badge (draft/published), updated time.
- Actions: edit, delete (with confirmation).
- Top button: "New Article".

**ArticleEditor**
- Form fields: title (required), author, summary (textarea), cover image URL/upload.
- Layout selector: dropdown of existing layouts, or "Create new layout" button.
- "Create new layout" opens `/editor/:newLayoutId` in new tab or inline; on save, return and auto-select it.
- Save article → API call → redirect to ArticleList.

**LayoutList**
- Card grid of user's layouts.
- Actions: edit (opens `/editor/:id`), delete, duplicate.
- Top button: "New Layout" (blank).

**UserManagement (Admin Only)**
- Table of all users.
- Create user: modal with username, password, role selector.
- Delete user: soft delete with confirmation.
- Non-admin users hitting this route are redirected to `/dashboard`.

### State Management (Pinia)

**Auth Store (`stores/auth.ts`)**
```typescript
interface AuthState {
  token: string | null
  user: { id: string; username: string; role: 'admin' | 'user' } | null
  isAuthenticated: boolean
}

// Actions: login(credentials), logout(), restoreFromStorage()
// Getters: isAdmin
```

**HTTP Client Update (`services/api.ts`)**
- Interceptor: attach `Authorization: Bearer <token>` to all requests.
- On `401`, clear auth store and redirect to `/login`.

### Navigation / Layout Shell

- A new `AppShell.vue` wraps authenticated pages with:
  - Top nav: logo, "Articles", "Layouts", "Users" (admin only), logout button.
  - User info display (username, role badge).
- Login page has no shell (centered card only).

## 5. Data Flow

### Creating a New Article (Full Flow)

1. User clicks "New Article" on Dashboard.
2. Fills title, author, summary; selects "Create new layout".
3. Clicks "Edit Layout" → navigates to `/editor/:layoutId`.
4. In editor, user designs layout; clicks "Save".
5. Returns to ArticleEditor; layout_id is pre-filled.
6. User clicks "Save Article" → `POST /api/articles`.
7. Redirect to ArticleList.

### Login Flow

1. User submits credentials on `/login`.
2. Backend validates, returns JWT.
3. Frontend stores JWT, initializes auth store.
4. Router guard checks `isAuthenticated` on all protected routes.

## 6. Security Considerations

- Passwords hashed with `bcrypt` (cost factor 10).
- JWT secret stored in environment variable; not committed.
- All endpoints except login require valid token.
- SQL injection prevented via parameterized queries (existing pattern).
- CORS remains open for local dev; configurable via env for production.

## 7. Migration Plan

### Existing Data

- The existing `layouts` table has no `user_id`.
- Migration strategy: add `user_id` as nullable initially, create a default admin user, assign all existing layouts to that admin user, then enforce `NOT NULL`.

### Database Migration Steps

1. Add `user_id` and `deleted` columns to `layouts`.
2. Create `users` table; insert default admin (username: `admin`, password: `admin123`, role: `admin`).
3. Update all existing `layouts` rows to set `user_id = admin_id`.
4. Create `articles` table.
5. Alter `layouts.user_id` to `NOT NULL`.

## 8. Success Criteria

- [ ] User can log in with username/password and receive a JWT.
- [ ] Authenticated requests are rejected without a valid token.
- [ ] Each user only sees their own layouts and articles.
- [ ] Admin can create new users and view all users' data.
- [ ] Articles have independent metadata (title, author, summary, status) and reference a layout.
- [ ] Deleting a layout or article performs a soft delete.
- [ ] Existing layout editor continues to work within the new auth-protected flow.

## 9. Future Considerations

- Recycle bin for soft-deleted items (admin can restore).
- Password change / reset functionality.
- WeChat OAuth login as an alternative.
- Article publishing directly to WeChat public account API.
- Layout sharing / template marketplace.
