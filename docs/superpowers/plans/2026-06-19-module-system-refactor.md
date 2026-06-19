# Module System Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom HTML5 Drag & Drop with vue-draggable-plus and introduce a module registry to reduce boilerplate when adding new module types.

**Architecture:** 4 independent phases: (1) swap drag in EditorCanvas + ContainerModule to use `<VueDraggable>`, (2) create a centralized `src/registry/modules.ts` registry, (3) update ModuleLibrary + ModuleRenderer + PropertyPanel to consume the registry, (4) cleanup dead code.

**Tech Stack:** Vue 3, TypeScript, Pinia, vue-draggable-plus (already in dependencies)

---

### Task 1: Replace EditorCanvas drag with vue-draggable-plus

**Files:**
- Modify: `frontend/src/components/EditorCanvas.vue`
- Test: Run `npm run dev` and verify drag reorder and library→canvas drop still work

- [ ] **Step 1: Import VueDraggable and create a local working copy of rootChildren**

```typescript
// In EditorCanvas.vue <script setup>, add these imports and state
import { VueDraggable } from 'vue-draggable-plus'
import type { Module } from '@/types/document'
import { createModule } from '@/types/document'

const moduleList = ref<Module[]>([])

// Sync moduleList with document when it changes
watch(() => document.value.root.children, (children) => {
  moduleList.value = children || []
}, { immediate: true, deep: true })
```

- [ ] **Step 2: Replace the hand-written drag handlers with VueDraggable template**

Replace the `<div class="drop-canvas">` content with:

```vue
<VueDraggable
  v-model="moduleList"
  class="drop-canvas"
  :class="{ 'drag-active': isDragOverCanvas }"
  ghost-class="drag-ghost"
  @change="onDragChange"
  @dragover="onCanvasDragOver"
  @dragleave="onCanvasDragLeave"
  @drop="onCanvasDrop"
  animation="200"
>
  <!-- 空状态提示 -->
  <div v-if="isEmpty" class="empty-state" :key="'empty'">
    <div class="empty-icon">📝</div>
    <div class="empty-text">还没有任何内容</div>
    <div class="empty-hint">从左侧拖拽模块到这里开始排版</div>
  </div>

  <!-- 渲染所有模块 -->
  <ModuleItem
    v-for="child in moduleList"
    :key="child.id"
    :module="child"
  />
</VueDraggable>
```

- [ ] **Step 3: Add the change handler to sync back to store**

```typescript
// Replace onDropAtIndex, onModuleDragStart, onModuleDragEnd, onDropLineDragOver with these:
const isDragOverCanvas = ref(false)

function onCanvasDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOverCanvas.value = true
}

function onCanvasDragLeave() {
  isDragOverCanvas.value = false
}

function onCanvasDrop(event: DragEvent) {
  event.preventDefault()
  isDragOverCanvas.value = false

  const moduleType = event.dataTransfer?.getData('moduleType') as ModuleType
  const existingModuleId = event.dataTransfer?.getData('moduleId')

  if (existingModuleId) {
    // Reorder already handled by VueDraggable v-model
    return
  }

  if (moduleType) {
    const variant = event.dataTransfer?.getData('moduleVariant')
    const newModule = createModule(moduleType)
    if (variant) {
      (newModule.props as any).variant = variant
    }
    documentStore.addModule(newModule, undefined, moduleList.value.length)
  }
}

// Called by VueDraggable when order changes (via SortableJS onUpdate)
function onDragChange(evt: any) {
  if (evt.type === 'update' || evt.type === 'sort') {
    // Reorder the actual store to match moduleList order
    // VueDraggable already reordered moduleList, so we sync back
    const orderedIds = moduleList.value.map(m => m.id)
    const currentIds = (document.value.root.children || []).map(m => m.id)

    // Only sync if order actually changed (avoid loops)
    if (JSON.stringify(orderedIds) !== JSON.stringify(currentIds)) {
      documentStore.reorderRootChildren(orderedIds)
    }
  }
}
```

- [ ] **Step 4: Add `reorderRootChildren` action to documentStore**

In `frontend/src/stores/document.ts`, add after `moveModule`:

```typescript
function reorderRootChildren(orderedIds: string[]) {
  saveToHistory()

  const newDocument = JSON.parse(JSON.stringify(document.value))
  const children = newDocument.root.children || []
  const moduleMap = new Map(children.map((m: Module) => [m.id, m]))

  newDocument.root.children = orderedIds
    .map((id: string) => moduleMap.get(id))
    .filter(Boolean)

  newDocument.updatedAt = new Date().toISOString()
  document.value = newDocument
}
```

Add `reorderRootChildren` to the return statement.

- [ ] **Step 5: Add ghost class CSS and remove unused drop-line styles**

In `<style scoped>` of EditorCanvas.vue, add:

```css
.drag-ghost {
  opacity: 0.4;
  border: 2px dashed #409eff;
  background-color: rgba(64, 158, 255, 0.05);
  border-radius: 8px;
}
```

Remove `.module-slot`, `.drop-line`, `.drop-line[data-moving]`, `.drop-line::before`, `.drop-line.active::before` CSS rules (they are no longer needed).

- [ ] **Step 6: Remove unused imports and variables**

Remove: `const { getDraggingType, endDrag } = useDragState()`, `activeDropIndex`, `draggingModuleId`, all handlers that are no longer used (`onModuleDragStart`, `onModuleDragEnd`, `onDropLineDragOver`, `onDropAtIndex`, `getModuleTypeFromEvent`, `deselectAll`).

- [ ] **Step 7: Verify the dev build works**

Run: `cd frontend && npm run dev` — verify no errors and the editor loads. Test drag reorder and library drop on canvas. If vue-draggable-plus needs reinstall:
```bash
cd frontend && npm install
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/EditorCanvas.vue frontend/src/stores/document.ts
git commit -m "refactor: replace EditorCanvas drag with vue-draggable-plus"
```

---

### Task 2: Replace ContainerModule drag with vue-draggable-plus

**Files:**
- Modify: `frontend/src/components/modules/ContainerModule.vue`

- [ ] **Step 1: Import VueDraggable and add local module list**

```typescript
import { VueDraggable } from 'vue-draggable-plus'
```

Add after `isDragOverContainer`:
```typescript
const childModules = ref<Module[]>([])

watch(() => props.module.children, (children) => {
  childModules.value = children || []
}, { immediate: true, deep: true })
```

- [ ] **Step 2: Replace the container's child drag with VueDraggable**

Replace the children rendering in `<template>` (inside `v-if="!isPreviewMode"`):

```vue
<template v-if="!isPreviewMode">
  <VueDraggable
    v-model="childModules"
    ghost-class="child-drag-ghost"
    @change="onChildDragChange"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    animation="200"
  >
    <ModuleItem
      v-for="child in childModules"
      :key="child.id"
      :module="child"
    />

    <!-- 空容器提示 -->
    <div v-if="childModules.length === 0" class="empty-hint" :key="'empty'">
      <span>📦 拖拽模块到这里</span>
    </div>
  </VueDraggable>
</template>
```

- [ ] **Step 3: Simplify the drag handlers**

```typescript
function handleDragOver(event: DragEvent) {
  if (isPreviewMode.value) return
  event.preventDefault()
  event.stopPropagation()
  isDragOverContainer.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragOverContainer.value = false
}

function handleDrop(event: DragEvent) {
  if (isPreviewMode.value) return
  event.preventDefault()
  event.stopPropagation()
  isDragOverContainer.value = false

  const moduleType = (event.dataTransfer?.getData('moduleType') as ModuleType) || getDraggingType()
  if (moduleType) {
    const newModule = createModule(moduleType)
    documentStore.addModule(newModule, props.module.id, childModules.value.length)
  }
}

function onChildDragChange(evt: any) {
  if (evt.type === 'update' || evt.type === 'sort') {
    const orderedIds = childModules.value.map(m => m.id)
    documentStore.reorderChildModules(props.module.id, orderedIds)
  }
}
```

- [ ] **Step 4: Add `reorderChildModules` to documentStore**

In `frontend/src/stores/document.ts`:

```typescript
function reorderChildModules(parentId: string, orderedIds: string[]) {
  saveToHistory()

  const newDocument = JSON.parse(JSON.stringify(document.value))
  const parent = findModuleById(newDocument.root, parentId)
  if (!parent || !parent.children) return

  const moduleMap = new Map(parent.children.map((m: Module) => [m.id, m]))
  parent.children = orderedIds
    .map((id: string) => moduleMap.get(id))
    .filter(Boolean) as Module[]

  newDocument.updatedAt = new Date().toISOString()
  document.value = newDocument
}
```

Add `reorderChildModules` to the return statement.

- [ ] **Step 5: Remove unused code from ContainerModule**

Remove: `activeDropIndex`, `draggingModuleId`, `handleModuleDragStart`, `handleDropLineDragOver`, `handleDropAtIndex`, `getModuleTypeFromEvent` (keep `getDraggingType` usage), child drop-line CSS rules.

Add ghost class CSS:
```css
.child-drag-ghost {
  opacity: 0.4;
  border: 2px dashed #67c23a;
  background-color: rgba(103, 194, 58, 0.05);
  border-radius: 4px;
}
```

Remove unused CSS: `.child-slot`, `.child-drop-line`, `.child-drop-line::before`, `.child-drop-line.active::before`.

- [ ] **Step 6: Verify dev build**

Run: `cd frontend && npm run dev` — test adding modules inside a container, reordering within a container.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/modules/ContainerModule.vue frontend/src/stores/document.ts
git commit -m "refactor: replace ContainerModule drag with vue-draggable-plus"
```

---

### Task 3: Create module registry

**Files:**
- Create: `frontend/src/registry/modules.ts`
- Modify: `frontend/src/types/document.ts` (no changes — registry references existing types)

- [ ] **Step 1: Create the registry file**

`frontend/src/registry/modules.ts`:

```typescript
import type { Component } from 'vue'
import type { ModuleType, ModuleStyles } from '@/types/document'

export interface ModuleVariant {
  name: string
  variant: string
  description: string
  icon: string
}

export interface ModuleRegistration {
  type: ModuleType
  name: string
  group: string
  icon: string
  description: string
  component: () => Promise<{ default: Component }>
  propertyPanel: () => Promise<{ default: Component }>
  defaultProps: Record<string, any>
  defaultStyles: ModuleStyles
  variants?: ModuleVariant[]
}

export const moduleRegistry: Record<ModuleType, ModuleRegistration> = {
  text: {
    type: 'text',
    name: '文字',
    group: '基础组件',
    icon: '📝',
    description: '添加文本内容，支持富文本编辑',
    component: () => import('@/components/modules/TextModule.vue'),
    propertyPanel: () => import('@/components/property-editors/TextProperty.vue'),
    defaultProps: { content: '点击编辑文字', icon: '' },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'left', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    }
  },
  image: {
    type: 'image',
    name: '图片',
    group: '基础组件',
    icon: '🖼️',
    description: '上传并展示图片内容',
    component: () => import('@/components/modules/ImageModule.vue'),
    propertyPanel: () => import('@/components/property-editors/ImageProperty.vue'),
    defaultProps: { src: '', alt: '图片', caption: '', captionStyle: { fontSize: '13px', color: '#9ca3af', italic: false, textAlign: 'center' } },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'left', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    }
  },
  divider: {
    type: 'divider',
    name: '分割线',
    group: '基础组件',
    icon: '➖',
    description: '添加水平分割线分隔内容',
    component: () => import('@/components/modules/DividerModule.vue'),
    propertyPanel: () => import('@/components/property-editors/DividerProperty.vue'),
    defaultProps: { style: 'solid', color: '#e5e7eb' },
    defaultStyles: {
      margin: '16px 0', padding: '0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'left', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    }
  },
  button: {
    type: 'button',
    name: '按钮',
    group: '基础组件',
    icon: '🔘',
    description: '添加可点击的按钮组件',
    component: () => import('@/components/modules/ButtonModule.vue'),
    propertyPanel: () => import('@/components/property-editors/ButtonProperty.vue'),
    defaultProps: { text: '按钮文字', link: '', size: 'medium' },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'center', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    }
  },
  container: {
    type: 'container',
    name: '容器',
    group: '基础组件',
    icon: '📦',
    description: '添加容器用于包裹其他组件',
    component: () => import('@/components/modules/ContainerModule.vue'),
    propertyPanel: () => import('@/components/property-editors/ContainerProperty.vue'),
    defaultProps: { layout: 'two-column' },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'left', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    }
  },
  header: {
    type: 'header',
    name: '页首',
    group: '页首',
    icon: '📰',
    description: '页首预设模块',
    component: () => import('@/components/modules/HeaderModule.vue'),
    propertyPanel: () => import('@/components/property-editors/HeaderProperty.vue'),
    defaultProps: {
      title: '文章标题', subtitle: '副标题或摘要描述', author: '作者名称',
      date: new Date().toISOString().split('T')[0],
      showDate: true, showAuthor: true, variant: 'default'
    },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '24px 16px', backgroundColor: '#f8fafc',
      border: 'none', borderRadius: '8px', textAlign: 'center', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    },
    variants: [
      { name: '页首 · 经典', variant: 'default', description: '居中对齐的标题、副标题和元信息', icon: '📰' },
      { name: '页首 · 杂志', variant: 'magazine', description: '大字标题配红色装饰线，杂志封面感', icon: '🗞️' },
      { name: '页首 · 极简', variant: 'minimal', description: '左对齐无装饰，干净利落', icon: '📄' },
      { name: '页首 · 卡片', variant: 'card', description: '深色背景卡片，视觉冲击力强', icon: '🎴' }
    ]
  },
  footer: {
    type: 'footer',
    name: '页尾',
    group: '页尾',
    icon: '🏁',
    description: '页尾预设模块',
    component: () => import('@/components/modules/FooterModule.vue'),
    propertyPanel: () => import('@/components/property-editors/FooterProperty.vue'),
    defaultProps: {
      text: '感谢您的阅读，如果对你有帮助，欢迎点赞、在看、转发',
      copyright: '© 2024 版权所有', showDivider: true, variant: 'default'
    },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '16px', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'center', fontSize: '13px',
      color: '#9ca3af', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    },
    variants: [
      { name: '页尾 · 经典', variant: 'default', description: '分割线加感谢语和版权信息', icon: '🏁' },
      { name: '页尾 · 简约', variant: 'simple', description: '仅保留版权和简洁分隔线', icon: '📍' },
      { name: '页尾 · 品牌', variant: 'branded', description: 'Logo、社交点和品牌感设计', icon: '🏢' },
      { name: '页尾 · 互动', variant: 'cta', description: '引导点赞留言收藏的CTA设计', icon: '👍' }
    ]
  },
  toc: {
    type: 'toc',
    name: '目录',
    group: '目录',
    icon: '📑',
    description: '目录预设模块',
    component: () => import('@/components/modules/TocModule.vue'),
    propertyPanel: () => import('@/components/property-editors/TocProperty.vue'),
    defaultProps: {
      title: '文章目录',
      items: [
        { text: '第一章：引言', level: 0 }, { text: '1.1 背景介绍', level: 1 },
        { text: '1.2 核心观点', level: 1 }, { text: '第二章：详细分析', level: 0 },
        { text: '2.1 方法一', level: 1 }, { text: '2.2 方法二', level: 1 },
        { text: '第三章：总结', level: 0 }
      ],
      variant: 'default'
    },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '16px', backgroundColor: '#f8fafc',
      border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'left', fontSize: '16px',
      color: '#333333', fontWeight: 'normal', fontStyle: 'normal', lineHeight: '1.6'
    },
    variants: [
      { name: '目录 · 经典', variant: 'default', description: '带圆点层级缩进的目录列表', icon: '📑' },
      { name: '目录 · 编号', variant: 'numbered', description: '自动编号的有序目录列表', icon: '🔢' },
      { name: '目录 · 卡片', variant: 'card', description: '卡片容器包裹，带序号高亮', icon: '🃏' },
      { name: '目录 · 极简', variant: 'minimal', description: '细线分隔的极简目录', icon: '📋' }
    ]
  },
  heading: {
    type: 'heading',
    name: '章节标题',
    group: '章节标题',
    icon: '📌',
    description: '章节标题预设模块',
    component: () => import('@/components/modules/HeadingModule.vue'),
    propertyPanel: () => import('@/components/property-editors/HeadingProperty.vue'),
    defaultProps: { text: '章节标题', level: 1, variant: 'numbered', showNumbering: true },
    defaultStyles: {
      margin: '24px 0 16px 0', padding: '12px 0', backgroundColor: 'transparent',
      border: 'none', borderRadius: '0', textAlign: 'left', fontSize: '22px',
      color: '#111827', fontWeight: 'bold', fontStyle: 'normal', lineHeight: '1.4'
    },
    variants: [
      { name: '标题 · 编号风', variant: 'numbered', description: '左侧彩色竖条 + 编号前缀', icon: '📌' },
      { name: '标题 · 左侧竖条', variant: 'left-bar', description: '彩色竖条装饰，无编号', icon: '📍' },
      { name: '标题 · 居中装饰', variant: 'center', description: '居中大标题配上下装饰线', icon: '🎯' },
      { name: '标题 · 极简', variant: 'simple', description: '仅加大加粗文字', icon: '🔤' }
    ]
  },
  quote: {
    type: 'quote',
    name: '引用',
    group: '基础组件',
    icon: '💬',
    description: '添加引用文字块，适合引述观点',
    component: () => import('@/components/modules/QuoteModule.vue'),
    propertyPanel: () => import('@/components/property-editors/QuoteProperty.vue'),
    defaultProps: { content: '这是一段引用文字', author: '' },
    defaultStyles: {
      margin: '0 0 16px 0', padding: '16px 20px', backgroundColor: '#f8fafc',
      border: 'none', borderLeft: '4px solid #3b82f6', borderRadius: '0 8px 8px 0',
      textAlign: 'left', fontSize: '16px', color: '#333333', fontWeight: 'normal',
      fontStyle: 'italic', lineHeight: '1.6'
    }
  }
}

export function getModulesByGroup(): Map<string, ModuleRegistration[]> {
  const groups = new Map<string, ModuleRegistration[]>()
  const order = ['页首', '目录', '章节标题', '基础组件', '页尾']

  for (const groupName of order) {
    const items = Object.values(moduleRegistry).filter(m => m.group === groupName)
    if (items.length > 0) groups.set(groupName, items)
  }

  // Add any remaining groups not in the order
  for (const reg of Object.values(moduleRegistry)) {
    if (!order.includes(reg.group) && !groups.has(reg.group)) {
      groups.set(reg.group, [reg])
    }
  }

  return groups
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd frontend && npx vue-tsc --noEmit` — fix any type issues. The registry references component paths that don't exist yet (property-editors), which is fine — they'll be created in Task 6. The lazy imports won't be resolved at type-check time.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/registry/modules.ts
git commit -m "feat: add centralized module registry"
```

---

### Task 4: Update ModuleLibrary to consume registry

**Files:**
- Modify: `frontend/src/components/ModuleLibrary.vue`

- [ ] **Step 1: Replace hardcoded module list with registry import**

In `<script setup>`, replace the entire `modules: ModuleItem[]` array and `groupedModules` computed with:

```typescript
import { moduleRegistry, getModulesByGroup } from '@/registry/modules'

interface GroupedModules {
  name: string
  items: Array<{
    type: string
    name: string
    description: string
    icon: string
    variant?: string
  }>
}

const groupedModules = computed<GroupedModules[]>(() => {
  const groups = getModulesByGroup()
  const result: GroupedModules[] = []

  groups.forEach((items, name) => {
    const resolved: GroupedModules['items'] = []
    for (const reg of items) {
      if (reg.variants && reg.variants.length > 0) {
        // Add each variant as a separate item
        for (const v of reg.variants) {
          resolved.push({
            type: reg.type,
            name: v.name,
            description: v.description,
            icon: v.icon,
            variant: v.variant
          })
        }
      } else {
        // Single module without variants
        resolved.push({
          type: reg.type,
          name: reg.name,
          description: reg.description,
          icon: reg.icon
        })
      }
    }
    result.push({ name, items: resolved })
  })

  return result
})
```

- [ ] **Step 2: Update the template to use new groupedModules structure**

The template already iterates `groupedModules` as `[groupName, groupItems]`. Update to match the new structure:

```vue
<div
  v-for="group in groupedModules"
  :key="group.name"
  class="module-group"
>
  <!-- group header uses group.name -->
  <!-- items use group.items -->
</div>
```

`groupedModules` is now an array of `{ name, items }` objects instead of tuples.

- [ ] **Step 3: Remove unused imports**

Remove `createModule` import and `HeaderVariant`, `FooterVariant`, `TocVariant`, `HeadingVariant` type imports. The `handleClickAdd` function still uses `createModule` — keep that.

- [ ] **Step 4: Verify the build**

Run: `cd frontend && npm run dev` — verify ModuleLibrary shows all modules correctly grouped.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ModuleLibrary.vue
git commit -m "refactor: ModuleLibrary consumes module registry"
```

---

### Task 5: Update ModuleRenderer to use registry

**Files:**
- Modify: `frontend/src/components/ModuleRenderer.vue`

- [ ] **Step 1: Replace hardcoded component map with dynamic resolution**

```typescript
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { Module } from '@/types/document'
import { moduleRegistry } from '@/registry/modules'

interface Props {
  module: Module
}

const props = defineProps<Props>()

const currentComponent = computed(() => {
  const reg = moduleRegistry[props.module.type]
  return reg ? defineAsyncComponent(reg.component) : null
})
</script>
```

Remove all 10 explicit imports of individual module components.

- [ ] **Step 2: Add fallback for unknown module types in template**

```vue
<template>
  <component
    v-if="currentComponent"
    :is="currentComponent"
    :module="module"
  />
  <div v-else class="unknown-module">
    未知模块类型: {{ module.type }}
  </div>
</template>
```

Remove `import TextModule from './modules/TextModule.vue'` and all similar imports.

- [ ] **Step 3: Verify the build**

Run: `cd frontend && npm run dev` — verify all module types render correctly.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ModuleRenderer.vue
git commit -m "refactor: ModuleRenderer uses dynamic registry resolution"
```

---

### Task 6: Split PropertyPanel into per-module editors

**Files:**
- Create: `frontend/src/components/property-editors/TextProperty.vue`
- Create: `frontend/src/components/property-editors/ImageProperty.vue`
- Create: `frontend/src/components/property-editors/DividerProperty.vue`
- Create: `frontend/src/components/property-editors/ButtonProperty.vue`
- Create: `frontend/src/components/property-editors/ContainerProperty.vue`
- Create: `frontend/src/components/property-editors/HeaderProperty.vue`
- Create: `frontend/src/components/property-editors/FooterProperty.vue`
- Create: `frontend/src/components/property-editors/TocProperty.vue`
- Create: `frontend/src/components/property-editors/HeadingProperty.vue`
- Create: `frontend/src/components/property-editors/QuoteProperty.vue`
- Modify: `frontend/src/components/PropertyPanel.vue`

- [ ] **Step 1: Extract TextProperty.vue**

Create `frontend/src/components/property-editors/TextProperty.vue`:

```vue
<script setup lang="ts">
import { useDocumentStore } from '@/stores/document'
import { storeToRefs } from 'pinia'

const documentStore = useDocumentStore()
const { selectedModule } = storeToRefs(documentStore)

function updateProps(props: Record<string, any>) {
  if (selectedModule.value) {
    documentStore.updateModuleProps(selectedModule.value.id, props)
  }
}
</script>

<template>
  <div class="space-y-4">
    <h4 class="text-xs font-medium text-gray-500 uppercase">文字内容</h4>
    <div>
      <label class="block text-sm text-gray-600 mb-1">图标 (Emoji)</label>
      <input
        type="text"
        :value="(selectedModule?.props as any)?.icon || ''"
        @change="updateProps({ icon: ($event.target as HTMLInputElement).value })"
        class="w-full px-3 py-2 border rounded text-sm"
        placeholder="如 📢 ✨ 💡（选填）"
      />
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">内容</label>
      <textarea
        :value="(selectedModule?.props as any)?.content"
        @change="updateProps({ content: ($event.target as HTMLTextAreaElement).value })"
        class="w-full px-3 py-2 border rounded text-sm min-h-[100px]"
        placeholder="输入文字内容..."
      ></textarea>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Extract remaining property editors**

Create the remaining 9 property editor files following the same pattern. Each extracts its corresponding `v-if` block from the current PropertyPanel.vue.

Key editors to extract:

- **ImageProperty.vue** — src input, alt text, caption, captionStyle (fontSize, color, italic, textAlign)
- **DividerProperty.vue** — style select (solid/dashed/dotted), color picker
- **ButtonProperty.vue** — text input, link input
- **ContainerProperty.vue** — layout select (single/two-column/three-column), child count display
- **HeaderProperty.vue** — variant select, title, subtitle, author, date, showAuthor/showDate checkboxes
- **FooterProperty.vue** — variant select, text textarea, copyright input, showDivider checkbox
- **TocProperty.vue** — variant select, title input, items list with add/remove/edit
- **HeadingProperty.vue** — variant select, text input, level select, showNumbering checkbox
- **QuoteProperty.vue** — content textarea, author input

Each editor follows the same store interaction pattern: `useDocumentStore()`, `selectedModule`, `updateModuleProps`.

- [ ] **Step 3: Simplify PropertyPanel.vue**

Replace the entire script and template sections with a dynamic registry-based approach:

```vue
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { moduleRegistry } from '@/registry/modules'
import { storeToRefs } from 'pinia'

const documentStore = useDocumentStore()
const { selectedModule } = storeToRefs(documentStore)

const propertyEditor = computed(() => {
  if (!selectedModule.value) return null
  const reg = moduleRegistry[selectedModule.value.type]
  return reg ? defineAsyncComponent(reg.propertyPanel) : null
})
</script>

<template>
  <div class="property-panel bg-white border-l h-full overflow-y-auto">
    <div class="p-4 border-b">
      <h3 class="font-semibold text-gray-700">属性设置</h3>
    </div>

    <!-- No module selected state -->
    <div v-if="!selectedModule" class="p-6 text-center text-gray-400">
      <!-- SVG icon... -->
      <p class="text-sm">选中模块以编辑属性</p>
    </div>

    <!-- Selected module properties -->
    <div v-else class="p-4 space-y-6">
      <!-- Module Type Info -->
      <div class="pb-4 border-b border-gray-100">
        <span class="text-xs font-medium text-gray-500 uppercase">模块类型</span>
        <div class="font-medium text-gray-800 mt-1">{{ moduleRegistry[selectedModule.type]?.name || selectedModule.type }}</div>
      </div>

      <!-- Common Style Controls (shared across all modules) -->
      <div class="space-y-4">
        <h4 class="text-xs font-medium text-gray-500 uppercase">样式设置</h4>
        <!-- Background Color -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">背景颜色</label>
          <div class="flex gap-2">
            <input type="color" :value="selectedModule.styles.backgroundColor || '#ffffff'"
              @input="documentStore.updateModuleStyles(selectedModule.id, { backgroundColor: ($event.target as HTMLInputElement).value })"
              class="w-10 h-10 rounded border cursor-pointer" />
            <input type="text" :value="selectedModule.styles.backgroundColor || '#ffffff'"
              @change="documentStore.updateModuleStyles(selectedModule.id, { backgroundColor: ($event.target as HTMLInputElement).value })"
              class="flex-1 px-3 py-2 border rounded text-sm" />
          </div>
        </div>
        <!-- Padding with sliders -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">内边距</label>
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-5">上</span>
              <input type="range" min="0" max="80" :value="parseInt(selectedModule.styles.padding?.split(' ')[0] || '0')"
                @input="updatePadding('top', ($event.target as HTMLInputElement).value)"
                class="flex-1 h-1.5 accent-blue-500" />
              <span class="text-xs text-gray-500 w-10 text-right">{{ parseInt(selectedModule.styles.padding?.split(' ')[0] || '0') }}px</span>
            </div>
            <!-- ...right, bottom, left similar... -->
          </div>
        </div>
        <!-- ...other common styles: margin, border, borderRadius, font-size, font-family, etc. -->
      </div>

      <!-- Module-specific property editor (loaded from registry) -->
      <div class="pt-4 border-t border-gray-100">
        <component :is="propertyEditor" />
      </div>
    </div>
  </div>
</template>
```

Keep the common style controls (backgroundColor, padding, margin, border, borderRadius, etc.) but remove all the `v-if="selectedModule.type === 'text'"` sections. Those are replaced by the dynamic `<component :is="propertyEditor" />`.

- [ ] **Step 4: Verify the build**

Run: `cd frontend && npm run dev` — verify selecting different module types shows the correct property editor. Test editing a property for text, image, header modules.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/property-editors/ frontend/src/components/PropertyPanel.vue
git commit -m "refactor: decompose PropertyPanel into per-module registry editors"
```

---

### Task 7: Cleanup dead code

**Files:**
- Delete: `frontend/src/composables/useDragState.ts`
- Check: `frontend/src/components/EditorCanvas.vue` — confirm no remaining refs to useDragState
- Check: `frontend/src/components/modules/ContainerModule.vue` — confirm no remaining refs to useDragState

- [ ] **Step 1: Find remaining references to useDragState**

Search: `rg "useDragState" frontend/src/` — should show no results after all refactoring is complete.

- [ ] **Step 2: Delete useDragState.ts**

```bash
rm frontend/src/composables/useDragState.ts
```

- [ ] **Step 3: Remove unused CSS from EditorCanvas.vue**

Verify `.module-slot`, `.drop-line`, `.drop-line[data-moving]`, `.drop-line::before`, `.drop-line.active::before` have been removed.

- [ ] **Step 4: Remove unused CSS from ContainerModule.vue**

Verify `.child-slot`, `.child-drop-line`, `.child-drop-line::before`, `.child-drop-line.active::before` have been removed.

- [ ] **Step 5: Verify the full build**

```bash
cd frontend && npx vue-tsc --noEmit && npm run build
```

- [ ] **Step 6: Manual QA checklist**

Test these scenarios in the dev server:
1. Drag a module from ModuleLibrary to canvas — adds at position
2. Reorder modules in EditorCanvas by dragging — smooth ghost animation
3. Drag a module into a ContainerModule — adds inside container
4. Reorder modules within a ContainerModule
5. Click a module to select — PropertyPanel shows correct editor
6. Edit a property — changes render in canvas
7. Delete a module — removes from canvas
8. Undo/redo after drag operations
9. Export HTML — produces correct output

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove useDragState composable and unused drag CSS"
```
