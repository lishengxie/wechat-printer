# WeChat Public Account Layout System - Design Spec

**Date:** 2026-06-17
**Author:** Claude Code
**Status:** Draft - Ready for Review

## Overview

A drag-and-drop based layout system for WeChat public accounts, similar to Xiiumi (秀米) editor. Users can visually compose articles using reusable modules, with 2-level nesting support and rich formatting options.

## Technology Stack

- **Frontend:** Vue 3 + TypeScript + Vite + TailwindCSS + Vue Draggable Plus
- **Backend:** Golang + Gin + SQLite
- **State Management:** Pinia
- **Rich Text:** Contenteditable (native) for inline text editing

## 1. System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vue3)                      │
├─────────────────┬───────────────────┬───────────────────────┤
│  Editor Canvas  │   Module Library  │   Property Panel      │
│  (drag & drop   │   (module types   │   (selected module    │
│   area)         │    to drag in)    │    formatting)        │
├─────────────────┴───────────────────┴───────────────────────┤
│                    Module Rendering Engine                  │
│         (renders JSON document → interactive Vue UI)        │
├─────────────────────────────────────────────────────────────┤
│                    Document State Store                     │
│         (Pinia store for undo/redo, selection, changes)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND (Golang)                     │
├─────────────────────────────────────────────────────────────┤
│  Gin REST API  │  SQLite DB  │  Image Storage  │  HTML      │
│  Endpoints     │  (layouts)  │                 │  Generator │
└─────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **JSON as Source of Truth:** The entire document is a serializable JSON tree
2. **Module Isolation:** Each module type is self-contained as a Vue component
3. **2-Level Nesting Limit:** Only container modules can have children, preventing deep complexity
4. **Unidirectional Data Flow:** All changes flow through the central document store

## 2. Document Structure

### TypeScript Interfaces

```typescript
interface Document {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  root: Module
}

interface Module {
  id: string                    // Unique ID for drag/selection tracking
  type: ModuleType
  props: Record<string, any>    // Module-specific properties
  children?: Module[]           // ONLY for container type
  styles: ModuleStyles
}

type ModuleType = 'container' | 'text' | 'image' | 'divider' | 'button'

interface ModuleStyles {
  margin?: string
  padding?: string
  backgroundColor?: string
  border?: string
  borderRadius?: string
  textAlign?: 'left' | 'center' | 'right'
  fontSize?: string
  color?: string
  fontWeight?: string
  lineHeight?: string
}
```

### Module Type Definitions

| Module Type | Can Have Children? | Props |
|------------|-------------------|-------|
| `container` | Yes (max 1 level) | `layout: 'single' \| 'two-column' \| 'three-column'` |
| `text` | No | `content: string` (rich text HTML) |
| `image` | No | `src: string`, `alt: string`, `width: string`, `height: string` |
| `divider` | No | `style: 'solid' \| 'dashed' \| 'dotted'`, `color: string` |
| `button` | No | `text: string`, `link: string`, `size: 'small' \| 'medium' \| 'large'` |

### Nesting Validation Rules

- Only `container` modules have the `children` property
- Container children MUST be non-container modules (enforced on drop)
- No recursive containers - prevents >2 level nesting

## 3. Frontend Editor Components

### Component Hierarchy

```
EditorPage
├── ModuleLibrary (left sidebar)
│   ├── ModuleDraggable (per type)
│   └── Category Tabs
│
├── EditorCanvas (center content area)
│   ├── ModuleDropZone (top-level)
│   └── ModuleRenderer (recursive)
│       ├── ModuleWrapper (selection, hover, drag handles)
│       └── ModuleComponent (TextModule, ImageModule, etc.)
│
└── PropertyPanel (right sidebar)
    ├── SelectedModuleInfo
    ├── StyleEditor (common CSS controls)
    └── ModuleSpecificEditor (type-specific props)
```

### Key Interaction Flows

#### Drag & Drop
1. User initiates drag from ModuleLibrary or existing module
2. Drop zones appear between modules and inside containers
3. Visual indicator distinguishes "between" vs "inside container" drop
4. On drop: validate nesting, update document state

#### Selection & Editing
1. Click module → show selection border + drag handles
2. Property panel updates to selected module
3. Double-click text modules → enter inline edit mode (contenteditable)

#### Undo/Redo
- Pinia store with history stack (limit: 50 steps)
- Each operation pushes document snapshot
- Typing operations debounced (500ms) to avoid history flood

## 4. Backend API

### Project Structure

```
backend/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── handler/
│   │   ├── layout.go
│   │   └── image.go
│   ├── model/
│   │   └── layout.go
│   ├── store/
│   │   └── sqlite.go
│   └── service/
│       └── html_generator.go
└── go.mod
```

### REST Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `GET` | `/api/layouts` | List all layouts | No (MVP) |
| `GET` | `/api/layouts/:id` | Get single layout | No |
| `POST` | `/api/layouts` | Create new layout | No |
| `PUT` | `/api/layouts/:id` | Update layout | No |
| `DELETE` | `/api/layouts/:id` | Delete layout | No |
| `POST` | `/api/upload/image` | Upload image | No |
| `POST` | `/api/export/html` | Generate HTML | No |

### Database Schema

```sql
CREATE TABLE layouts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  document JSON NOT NULL,
  thumbnail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### HTML Generation Service

1. Accepts JSON document as input
2. Recursively renders each module to semantic HTML
3. Inlines ALL CSS styles (WeChat strips external stylesheets)
4. Sanitizes output: removes WeChat-incompatible tags/properties
5. Returns single HTML string ready for copy-paste

## 5. Implementation Plan

### Phase 1 (Weeks 1-4) - MVP

#### Week 1: Foundation
- [ ] Scaffold Vue3 + Vite + TS + Tailwind frontend
- [ ] Scaffold Golang + Gin + SQLite backend
- [ ] Define JSON document schema
- [ ] Basic Pinia store setup
- [ ] Static module rendering (no interactions)

#### Week 2: Core Editor
- [ ] Integrate Vue Draggable Plus
- [ ] Implement drag from ModuleLibrary
- [ ] Implement drop onto canvas and between modules
- [ ] Module selection system
- [ ] Basic property panel framework

#### Week 3: Module Types
- [ ] Text module with inline editing
- [ ] Image module with upload
- [ ] Container module (2-column layout)
- [ ] Divider and button modules
- [ ] Style editor controls (colors, padding, alignment)

#### Week 4: Backend & Polish
- [ ] CRUD API endpoints
- [ ] Save/Load UI flows
- [ ] HTML generation service
- [ ] Undo/Redo implementation
- [ ] Export to HTML UI
- [ ] Cross-browser testing + WeChat paste verification

### Testing Strategy

- **Unit Tests:** Document operations, HTML generation
- **Component Tests:** Each module type renders correctly
- **Integration Tests:** Drag & drop workflows, save/load roundtrip
- **Manual:** Actual paste into WeChat public account editor

## 6. Success Criteria (MVP)

- [ ] User can drag 5+ module types onto canvas
- [ ] User can reorder modules via drag
- [ ] User can nest modules inside containers (2 levels max)
- [ ] User can edit common styles (colors, padding, alignment)
- [ ] User can save layouts to backend
- [ ] User can load previously saved layouts
- [ ] Exported HTML renders correctly when pasted into WeChat editor

## 7. Future Considerations (Post-MVP)

- User authentication
- Template library (pre-built layouts)
- More module types (video, audio, gallery, countdown)
- Collaboration features (multi-user editing)
- Direct WeChat API publishing
- Custom CSS for advanced users
