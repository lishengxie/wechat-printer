# WeChat Public Account Layout System - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a drag-and-drop based layout editor for WeChat public accounts with 2-level nesting support, module system, and HTML export.

**Architecture:** Component-based Vue3 frontend with JSON document as source of truth, Golang backend with SQLite persistence. Frontend handles all editor interactions, backend handles storage and clean HTML generation.

**Tech Stack:** Vue 3 + TypeScript + Vite + TailwindCSS + Pinia + Vue Draggable Plus | Golang + Gin + SQLite

---

## Phase 1: Frontend Foundation

### Task 1: Scaffold Vue3 + Vite + TypeScript Project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.ts`
- Create: `frontend/src/App.vue`
- Create: `frontend/src/style.css`

- [ ] **Step 1: Initialize npm project**

```bash
mkdir -p frontend && cd frontend
npm init -y
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install vue@latest pinia@latest vue-draggable-plus@latest
npm install --save-dev vite@latest @vitejs/plugin-vue@latest typescript@latest vue-tsc@latest tailwindcss@latest postcss@latest autoprefixer@latest @types/node@latest
```

- [ ] **Step 3: Create package.json**

```json
{
  "name": "wechat-layout-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.1.7",
    "vue-draggable-plus": "^0.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vue-tsc": "^1.8.0",
    "@types/node": "^20.10.0"
  }
}
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] **Step 5: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 6: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: Initialize TailwindCSS**

```bash
npx tailwindcss init -p
```

- [ ] **Step 8: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 9: Create src/style.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
```

- [ ] **Step 10: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>公众号排版系统</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 11: Create src/main.ts**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

- [ ] **Step 12: Create src/App.vue**

```vue
<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <h1 class="text-xl font-bold text-gray-800">公众号排版系统</h1>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="text-center text-gray-500 py-12">
        <p class="text-lg">项目脚手架已完成</p>
        <p class="text-sm mt-2">继续实现下一个任务</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
</script>
```

- [ ] **Step 13: Create .gitignore in frontend**

```
node_modules
dist
dist-ssr
*.local
.DS_Store
```

- [ ] **Step 14: Test the setup**

```bash
cd frontend
npm run dev
```
Expected: Server starts on port 3000, page loads successfully

---

### Task 2: Define TypeScript Types for Document Structure

**Files:**
- Create: `frontend/src/types/document.ts`

- [ ] **Step 1: Create the types file**

```typescript
export type ModuleType = 'container' | 'text' | 'image' | 'divider' | 'button'

export interface ModuleStyles {
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

export interface ContainerModuleProps {
  layout: 'single' | 'two-column' | 'three-column'
}

export interface TextModuleProps {
  content: string
}

export interface ImageModuleProps {
  src: string
  alt: string
  width?: string
  height?: string
}

export interface DividerModuleProps {
  style: 'solid' | 'dashed' | 'dotted'
  color: string
}

export interface ButtonModuleProps {
  text: string
  link: string
  size: 'small' | 'medium' | 'large'
}

export type ModuleSpecificProps =
  | ContainerModuleProps
  | TextModuleProps
  | ImageModuleProps
  | DividerModuleProps
  | ButtonModuleProps

export interface Module {
  id: string
  type: ModuleType
  props: ModuleSpecificProps
  children?: Module[]
  styles: ModuleStyles
}

export interface Document {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  root: Module
}

// Type guards
export function isContainerModule(module: Module): boolean {
  return module.type === 'container'
}

export function canHaveChildren(moduleType: ModuleType): boolean {
  return moduleType === 'container'
}

// Helper to generate unique IDs
export function generateId(): string {
  return 'module_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9)
}

// Default styles
export function getDefaultStyles(): ModuleStyles {
  return {
    margin: '0 0 16px 0',
    padding: '0',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '0',
    textAlign: 'left',
    fontSize: '16px',
    color: '#333333',
    fontWeight: 'normal',
    lineHeight: '1.6'
  }
}

// Create new module factory
export function createModule(type: 'text'): Module & { props: TextModuleProps }
export function createModule(type: 'image'): Module & { props: ImageModuleProps }
export function createModule(type: 'divider'): Module & { props: DividerModuleProps }
export function createModule(type: 'button'): Module & { props: ButtonModuleProps }
export function createModule(type: 'container'): Module & { props: ContainerModuleProps; children: Module[] }
export function createModule(type: ModuleType): Module {
  const id = generateId()

  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        props: { content: '点击编辑文字' } as TextModuleProps,
        styles: getDefaultStyles()
      }
    case 'image':
      return {
        id,
        type: 'image',
        props: { src: '', alt: '图片' } as ImageModuleProps,
        styles: getDefaultStyles()
      }
    case 'divider':
      return {
        id,
        type: 'divider',
        props: { style: 'solid' as const, color: '#e5e7eb' } as DividerModuleProps,
        styles: { ...getDefaultStyles(), margin: '16px 0' }
      }
    case 'button':
      return {
        id,
        type: 'button',
        props: { text: '按钮文字', link: '', size: 'medium' as const } as ButtonModuleProps,
        styles: { ...getDefaultStyles(), textAlign: 'center' }
      }
    case 'container':
      return {
        id,
        type: 'container',
        props: { layout: 'two-column' as const } as ContainerModuleProps,
        children: [],
        styles: getDefaultStyles()
      }
    default:
      throw new Error(`Unknown module type: ${type}`)
  }
}

// Create empty document
export function createEmptyDocument(title: string = '未命名排版'): Document {
  const root = createModule('container')
  root.props.layout = 'single'
  return {
    id: generateId(),
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    root
  }
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd frontend
npx tsc --noEmit
```
Expected: No TypeScript errors

---

### Task 3: Create Pinia Document Store

**Files:**
- Create: `frontend/src/stores/document.ts`

- [ ] **Step 1: Create the document store**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Document, Module, ModuleStyles, ModuleSpecificProps } from '@/types/document'
import { createEmptyDocument, createModule, isContainerModule, generateId } from '@/types/document'

export const useDocumentStore = defineStore('document', () => {
  // State
  const document = ref<Document>(createEmptyDocument())
  const selectedModuleId = ref<string | null>(null)
  const history = ref<Document[]>([])
  const historyIndex = ref(-1)
  const MAX_HISTORY = 50

  // Computed
  const selectedModule = computed(() => {
    if (!selectedModuleId.value) return null
    return findModuleById(document.value.root, selectedModuleId.value)
  })

  // Helper: Find module recursively by ID
  function findModuleById(root: Module, id: string): Module | null {
    if (root.id === id) return root
    if (root.children) {
      for (const child of root.children) {
        const found = findModuleById(child, id)
        if (found) return found
      }
    }
    return null
  }

  // Helper: Find parent of a module
  function findParentModule(root: Module, id: string, parent: Module | null = null): Module | null {
    if (root.id === id) return parent
    if (root.children) {
      for (const child of root.children) {
        const found = findParentModule(child, id, root)
        if (found) return found
      }
    }
    return null
  }

  // Helper: Save current state to history
  function saveToHistory() {
    // Remove future states if we're not at the end
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // Deep clone current document
    const snapshot = JSON.parse(JSON.stringify(document.value))
    history.value.push(snapshot)

    // Limit history size
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
  }

  // Actions
  function setDocument(doc: Document) {
    document.value = doc
    history.value = []
    historyIndex.value = -1
    selectedModuleId.value = null
  }

  function selectModule(id: string | null) {
    selectedModuleId.value = id
  }

  function addModule(newModule: Module, parentId?: string, index?: number) {
    saveToHistory()

    if (parentId) {
      const parent = findModuleById(document.value.root, parentId)
      if (parent && parent.children) {
        const insertIndex = index !== undefined ? index : parent.children.length
        parent.children.splice(insertIndex, 0, newModule)
      }
    } else {
      // Add to root container
      const insertIndex = index !== undefined ? index : document.value.root.children!.length
      document.value.root.children!.splice(insertIndex, 0, newModule)
    }

    document.value.updatedAt = new Date().toISOString()
  }

  function removeModule(id: string) {
    if (id === document.value.root.id) return // Cannot remove root

    saveToHistory()

    const parent = findParentModule(document.value.root, id)
    if (parent && parent.children) {
      const index = parent.children.findIndex(m => m.id === id)
      if (index !== -1) {
        parent.children.splice(index, 1)
      }
    }

    if (selectedModuleId.value === id) {
      selectedModuleId.value = null
    }

    document.value.updatedAt = new Date().toISOString()
  }

  function moveModule(moduleId: string, newParentId: string | null, newIndex: number) {
    saveToHistory()

    const module = findModuleById(document.value.root, moduleId)
    if (!module) return

    // Remove from old parent
    const oldParent = findParentModule(document.value.root, moduleId)
    if (oldParent && oldParent.children) {
      const oldIndex = oldParent.children.findIndex(m => m.id === moduleId)
      if (oldIndex !== -1) {
        oldParent.children.splice(oldIndex, 1)
      }
    }

    // Add to new parent
    const newParent = newParentId
      ? findModuleById(document.value.root, newParentId)
      : document.value.root

    if (newParent && newParent.children) {
      newParent.children.splice(newIndex, 0, module)
    }

    document.value.updatedAt = new Date().toISOString()
  }

  function updateModuleStyles(id: string, styles: Partial<ModuleStyles>) {
    saveToHistory()

    const module = findModuleById(document.value.root, id)
    if (module) {
      module.styles = { ...module.styles, ...styles }
    }

    document.value.updatedAt = new Date().toISOString()
  }

  function updateModuleProps(id: string, props: Partial<ModuleSpecificProps>) {
    saveToHistory()

    const module = findModuleById(document.value.root, id)
    if (module) {
      module.props = { ...module.props, ...props } as ModuleSpecificProps
    }

    document.value.updatedAt = new Date().toISOString()
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      document.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      document.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    }
  }

  function canUndo() {
    return historyIndex.value > 0
  }

  function canRedo() {
    return historyIndex.value < history.value.length - 1
  }

  return {
    // State
    document,
    selectedModuleId,
    // Computed
    selectedModule,
    // Actions
    setDocument,
    selectModule,
    addModule,
    removeModule,
    moveModule,
    updateModuleStyles,
    updateModuleProps,
    undo,
    redo,
    canUndo,
    canRedo,
    findModuleById
  }
})
```

- [ ] **Step 2: Verify store compiles**

```bash
cd frontend
npx tsc --noEmit
```
Expected: No TypeScript errors

---

### Task 4: Create Basic Module Components

**Files:**
- Create: `frontend/src/components/modules/TextModule.vue`
- Create: `frontend/src/components/modules/ImageModule.vue`
- Create: `frontend/src/components/modules/DividerModule.vue`
- Create: `frontend/src/components/modules/ButtonModule.vue`
- Create: `frontend/src/components/modules/ContainerModule.vue`
- Create: `frontend/src/components/ModuleRenderer.vue`

- [ ] **Step 1: Create TextModule.vue**

```vue
<template>
  <div :style="componentStyles">
    {{ (module.props as TextModuleProps).content }}
  </div>
</template>

<script setup lang="ts">
import type { Module } from '@/types/document'
import type { TextModuleProps } from '@/types/document'
import { computed } from 'vue'

const props = defineProps<{
  module: Module
}>()

const componentStyles = computed(() => ({
  ...props.module.styles
}))
</script>
```

- [ ] **Step 2: Create ImageModule.vue**

```vue
<template>
  <div :style="componentStyles" class="image-module">
    <img
      v-if="imageProps.src"
      :src="imageProps.src"
      :alt="imageProps.alt"
      :style="imageStyle"
      class="max-w-full h-auto"
    />
    <div v-else class="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-8 text-center text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p>点击上传图片</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Module, ImageModuleProps } from '@/types/document'
import { computed } from 'vue'

const props = defineProps<{
  module: Module
}>()

const imageProps = computed(() => props.module.props as ImageModuleProps)

const componentStyles = computed(() => ({
  ...props.module.styles
}))

const imageStyle = computed(() => ({
  width: imageProps.value.width || '100%',
  height: imageProps.value.height || 'auto'
}))
</script>
```

- [ ] **Step 3: Create DividerModule.vue**

```vue
<template>
  <div :style="componentStyles" class="divider-module">
    <hr :style="hrStyle" class="border-none" />
  </div>
</template>

<script setup lang="ts">
import type { Module, DividerModuleProps } from '@/types/document'
import { computed } from 'vue'

const props = defineProps<{
  module: Module
}>()

const dividerProps = computed(() => props.module.props as DividerModuleProps)

const componentStyles = computed(() => ({
  ...props.module.styles
}))

const hrStyle = computed(() => ({
  borderTop: `1px ${dividerProps.value.style} ${dividerProps.value.color}`,
  margin: 0
}))
</script>
```

- [ ] **Step 4: Create ButtonModule.vue**

```vue
<template>
  <div :style="componentStyles" class="button-module">
    <a
      :href="buttonProps.link || '#'"
      :style="buttonStyle"
      class="inline-block no-underline cursor-pointer"
      @click.prevent
    >
      {{ buttonProps.text }}
    </a>
  </div>
</template>

<script setup lang="ts">
import type { Module, ButtonModuleProps } from '@/types/document'
import { computed } from 'vue'

const props = defineProps<{
  module: Module
}>()

const buttonProps = computed(() => props.module.props as ButtonModuleProps)

const componentStyles = computed(() => ({
  ...props.module.styles
}))

const buttonSizeStyles = computed(() => {
  const sizes = {
    small: { padding: '6px 16px', fontSize: '14px' },
    medium: { padding: '10px 24px', fontSize: '16px' },
    large: { padding: '14px 32px', fontSize: '18px' }
  }
  return sizes[buttonProps.value.size]
})

const buttonStyle = computed(() => ({
  ...buttonSizeStyles.value,
  backgroundColor: '#07c160',
  color: 'white',
  borderRadius: '4px',
  fontWeight: 500
}))
</script>
```

- [ ] **Step 5: Create ContainerModule.vue**

```vue
<template>
  <div :style="componentStyles" class="container-module">
    <div :style="gridStyle" class="module-grid">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Module, ContainerModuleProps } from '@/types/document'
import { computed } from 'vue'

const props = defineProps<{
  module: Module
}>()

const containerProps = computed(() => props.module.props as ContainerModuleProps)

const componentStyles = computed(() => ({
  ...props.module.styles
}))

const gridStyle = computed(() => {
  const layouts = {
    'single': 'grid-template-columns: 1fr;',
    'two-column': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;',
    'three-column': 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;'
  }
  return layouts[containerProps.value.layout]
})
</script>
```

- [ ] **Step 6: Create ModuleRenderer.vue**

```vue
<template>
  <component :is="getComponent(module.type)" :module="module">
    <template v-if="module.type === 'container' && module.children">
      <ModuleRenderer
        v-for="child in module.children"
        :key="child.id"
        :module="child"
      />
    </template>
  </component>
</template>

<script setup lang="ts">
import type { Module, ModuleType } from '@/types/document'
import TextModule from './modules/TextModule.vue'
import ImageModule from './modules/ImageModule.vue'
import DividerModule from './modules/DividerModule.vue'
import ButtonModule from './modules/ButtonModule.vue'
import ContainerModule from './modules/ContainerModule.vue'

const props = defineProps<{
  module: Module
}>()

const componentMap: Record<ModuleType, any> = {
  text: TextModule,
  image: ImageModule,
  divider: DividerModule,
  button: ButtonModule,
  container: ContainerModule
}

function getComponent(type: ModuleType) {
  return componentMap[type] || TextModule
}
</script>
```

- [ ] **Step 7: Test components in App.vue**

Update App.vue to render test content:

```vue
<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 class="text-xl font-bold mb-6 text-gray-800">模块预览</h2>
      <ModuleRenderer v-for="module in testModules" :key="module.id" :module="module" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ModuleRenderer from '@/components/ModuleRenderer.vue'
import { createModule, type Module } from '@/types/document'

const testModules = ref<Module[]>([
  createModule('text'),
  createModule('image'),
  createModule('divider'),
  createModule('button')
])
</script>
```

- [ ] **Step 8: Verify components compile and render**

```bash
cd frontend
npm run dev
```
Expected: All 4 module types render correctly on the page

---

## Phase 2: Core Editor Functionality

### Task 5: Module Library Component

**Files:**
- Create: `frontend/src/components/ModuleLibrary.vue`

- [ ] **Step 1: Create ModuleLibrary component**

```vue
<template>
  <div class="module-library bg-white border-r h-full overflow-y-auto">
    <div class="p-4 border-b">
      <h3 class="font-semibold text-gray-700">模块库</h3>
    </div>
    <div class="p-4">
      <p class="text-sm text-gray-500 mb-3">拖拽模块到画布</p>

      <div
        v-for="item in moduleItems"
        :key="item.type"
        class="module-item mb-3 p-4 border border-gray-200 rounded-lg cursor-grab hover:border-blue-400 hover:bg-blue-50 transition-colors"
        draggable="true"
        @dragstart="handleDragStart($event, item.type)"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
            <span class="text-xl">{{ item.icon }}</span>
          </div>
          <div>
            <div class="font-medium text-gray-800">{{ item.name }}</div>
            <div class="text-xs text-gray-500">{{ item.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModuleType } from '@/types/document'

interface ModuleItem {
  type: ModuleType
  name: string
  icon: string
  description: string
}

const moduleItems: ModuleItem[] = [
  { type: 'text', name: '文字', icon: '📝', description: '富文本段落' },
  { type: 'image', name: '图片', icon: '🖼️', description: '单张图片' },
  { type: 'divider', name: '分割线', icon: '➖', description: '内容分隔' },
  { type: 'button', name: '按钮', icon: '🔘', description: '链接按钮' },
  { type: 'container', name: '容器', icon: '📦', description: '多列布局' }
]

const emit = defineEmits<{
  (e: 'drag-module', type: ModuleType): void
}>()

function handleDragStart(event: DragEvent, type: ModuleType) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('moduleType', type)
    event.dataTransfer.effectAllowed = 'copy'
  }
  emit('drag-module', type)
}
</script>

<style scoped>
.module-item:active {
  cursor: grabbing;
}
</style>
```

---

### Task 6: Module Wrapper with Selection and Drag Handles

**Files:**
- Create: `frontend/src/components/ModuleWrapper.vue`

- [ ] **Step 1: Create ModuleWrapper component**

```vue
<template>
  <div
    class="module-wrapper relative"
    :class="{ 'is-selected': isSelected, 'is-hovered': isHovered }"
    @click.stop="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Selection Border -->
    <div
      v-if="isSelected"
      class="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none z-10"
    ></div>

    <!-- Toolbar -->
    <div
      v-if="isSelected || isHovered"
      class="absolute -top-8 right-0 flex gap-1 z-20"
    >
      <button
        @click.stop="handleDelete"
        class="w-6 h-6 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center"
        title="删除"
      >
        ✕
      </button>
      <button
        class="w-6 h-6 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 flex items-center justify-center cursor-grab"
        draggable="true"
        @dragstart.stop="handleDragStart"
        title="拖动移动"
      >
        ⋮⋮
      </button>
    </div>

    <!-- Module Content -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDocumentStore } from '@/stores/document'

const props = defineProps<{
  moduleId: string
}>()

const emit = defineEmits<{
  (e: 'drag-start', moduleId: string): void
  (e: 'delete', moduleId: string): void
}>()

const isHovered = ref(false)

const documentStore = useDocumentStore()

const isSelected = computed(() => documentStore.selectedModuleId === props.moduleId)

function handleClick() {
  documentStore.selectModule(props.moduleId)
}

function handleDelete() {
  emit('delete', props.moduleId)
}

function handleDragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('moduleId', props.moduleId)
    event.dataTransfer.effectAllowed = 'move'
  }
  emit('drag-start', props.moduleId)
}
</script>

<style scoped>
.module-wrapper {
  transition: all 0.15s ease;
}

.module-wrapper:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.is-selected {
  background-color: rgba(59, 130, 246, 0.1);
}
</style>
```

---

### Task 7: Editor Canvas with Drop Zones

**Files:**
- Create: `frontend/src/components/EditorCanvas.vue`

- [ ] **Step 1: Create EditorCanvas component**

```vue
<template>
  <div class="editor-canvas bg-gray-100 h-full overflow-y-auto p-8">
    <div class="max-w-xl mx-auto bg-white rounded-lg shadow-lg min-h-[600px] p-6">

      <!-- Document Title -->
      <input
        v-model="title"
        type="text"
        class="w-full text-2xl font-bold text-center border-none outline-none mb-6 text-gray-800 placeholder-gray-300"
        placeholder="输入标题..."
        @change="updateTitle"
      />

      <!-- Root Container Drop Zone -->
      <div
        class="drop-area"
        @dragover.prevent="handleDragOver($event, null, -1)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, null, 0)"
      >
        <ModuleWrapper
          v-for="(child, index) in rootChildren"
          :key="child.id"
          :module-id="child.id"
          @delete="handleDeleteModule"
          @drag-start="handleModuleDragStart"
        >
          <!-- Drop zone before -->
          <div
            class="drop-zone-insert h-1 -mx-6"
            :class="{ 'drop-active': activeDropZone === `root-${index}` }"
            @dragover.prevent="handleDragOver($event, null, index)"
            @dragleave="handleDragLeave"
            @drop="handleDrop($event, null, index)"
          ></div>

          <ModuleRenderer :module="child" />
        </ModuleWrapper>

        <!-- Final drop zone -->
        <div
          class="drop-zone-insert h-12 -mx-6 flex items-center justify-center"
          :class="{ 'drop-active': activeDropZone === 'root-end' }"
          @dragover.prevent="handleDragOver($event, null, rootChildren.length)"
          @dragleave="handleDragLeave"
          @drop="handleDrop($event, null, rootChildren.length)"
        >
          <span v-if="activeDropZone === 'root-end'" class="text-blue-500 text-sm">拖放到此处</span>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="rootChildren.length === 0"
        class="text-center py-12 text-gray-400"
      >
        <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <p>从左侧拖拽模块到这里</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { createModule, type ModuleType } from '@/types/document'
import ModuleRenderer from './ModuleRenderer.vue'
import ModuleWrapper from './ModuleWrapper.vue'

const documentStore = useDocumentStore()

const title = computed({
  get: () => documentStore.document.title,
  set: (value: string) => { documentStore.document.title = value }
})

const rootChildren = computed(() => documentStore.document.root.children || [])

const activeDropZone = ref<string | null>(null)
const draggingModuleId = ref<string | null>(null)

function handleDragOver(event: DragEvent, parentId: string | null, index: number) {
  event.dataTransfer!.dropEffect = 'copy'
  const zoneId = parentId ? `${parentId}-${index}` : (index === rootChildren.value.length ? 'root-end' : `root-${index}`)
  activeDropZone.value = zoneId
}

function handleDragLeave() {
  activeDropZone.value = null
}

function handleDrop(event: DragEvent, parentId: string | null, index: number) {
  event.preventDefault()
  activeDropZone.value = null

  const moduleType = event.dataTransfer?.getData('moduleType') as ModuleType
  const existingModuleId = event.dataTransfer?.getData('moduleId')

  if (moduleType) {
    // New module from library
    const newModule = createModule(moduleType)
    documentStore.addModule(newModule, parentId || undefined, index)
  } else if (existingModuleId) {
    // Moving existing module
    documentStore.moveModule(existingModuleId, parentId || null, index)
  }
}

function handleModuleDragStart(moduleId: string) {
  draggingModuleId.value = moduleId
}

function handleDeleteModule(moduleId: string) {
  documentStore.removeModule(moduleId)
}

function updateTitle() {
  documentStore.document.updatedAt = new Date().toISOString()
}
</script>

<style scoped>
.drop-zone-insert {
  transition: all 0.15s ease;
}

.drop-zone-insert.drop-active {
  background-color: rgba(59, 130, 246, 0.3);
  height: 32px;
  border: 2px dashed #3b82f6;
  border-radius: 4px;
  margin: 8px 0;
}
</style>
```

---

### Task 8: Property Panel Component

**Files:**
- Create: `frontend/src/components/PropertyPanel.vue`

- [ ] **Step 1: Create PropertyPanel component**

```vue
<template>
  <div class="property-panel bg-white border-l h-full overflow-y-auto">
    <div class="p-4 border-b">
      <h3 class="font-semibold text-gray-700">属性设置</h3>
    </div>

    <div v-if="!selectedModule" class="p-6 text-center text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
      <p class="text-sm">选中模块以编辑属性</p>
    </div>

    <div v-else class="p-4 space-y-6">
      <!-- Module Type Info -->
      <div class="pb-4 border-b border-gray-100">
        <span class="text-xs font-medium text-gray-500 uppercase">模块类型</span>
        <div class="font-medium text-gray-800 mt-1">{{ getModuleTypeName(selectedModule.type) }}</div>
      </div>

      <!-- Style Controls -->
      <div class="space-y-4">
        <h4 class="text-xs font-medium text-gray-500 uppercase">样式设置</h4>

        <!-- Text Color -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">文字颜色</label>
          <div class="flex gap-2">
            <input
              type="color"
              :value="selectedModule.styles.color || '#333333'"
              @input="updateStyle('color', ($event.target as HTMLInputElement).value)"
              class="w-10 h-10 rounded border cursor-pointer"
            />
            <input
              type="text"
              :value="selectedModule.styles.color || '#333333'"
              @change="updateStyle('color', ($event.target as HTMLInputElement).value)"
              class="flex-1 px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        <!-- Background Color -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">背景颜色</label>
          <div class="flex gap-2">
            <input
              type="color"
              :value="styleBackgroundColor"
              @input="updateStyle('backgroundColor', ($event.target as HTMLInputElement).value)"
              class="w-10 h-10 rounded border cursor-pointer"
            />
            <input
              type="text"
              :value="styleBackgroundColor"
              @change="updateStyle('backgroundColor', ($event.target as HTMLInputElement).value)"
              class="flex-1 px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        <!-- Text Align -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">对齐方式</label>
          <div class="flex gap-2">
            <button
              v-for="align in alignOptions"
              :key="align.value"
              @click="updateStyle('textAlign', align.value)"
              class="flex-1 px-3 py-2 border rounded text-sm hover:bg-gray-50"
              :class="{ 'bg-blue-50 border-blue-400 text-blue-600': selectedModule.styles.textAlign === align.value }"
            >
              {{ align.label }}
            </button>
          </div>
        </div>

        <!-- Font Size -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">字体大小</label>
          <input
            type="text"
            :value="selectedModule.styles.fontSize || '16px'"
            @change="updateStyle('fontSize', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="16px"
          />
        </div>

        <!-- Padding -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">内边距</label>
          <input
            type="text"
            :value="selectedModule.styles.padding || '0'"
            @change="updateStyle('padding', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="16px"
          />
        </div>

        <!-- Margin -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">外边距</label>
          <input
            type="text"
            :value="selectedModule.styles.margin || '0 0 16px 0'"
            @change="updateStyle('margin', ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="0 0 16px 0"
          />
        </div>
      </div>

      <!-- Module Specific Props -->
      <div v-if="selectedModule.type === 'text'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">文字内容</h4>
        <div>
          <textarea
            :value="(selectedModule.props as any).content"
            @change="updateProps({ content: ($event.target as HTMLTextAreaElement).value })"
            class="w-full px-3 py-2 border rounded text-sm min-h-[100px]"
            placeholder="输入文字内容..."
          ></textarea>
        </div>
      </div>

      <div v-if="selectedModule.type === 'button'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">按钮设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">按钮文字</label>
          <input
            type="text"
            :value="(selectedModule.props as any).text"
            @change="updateProps({ text: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">链接地址</label>
          <input
            type="text"
            :value="(selectedModule.props as any).link"
            @change="updateProps({ link: ($event.target as HTMLInputElement).value })"
            class="w-full px-3 py-2 border rounded text-sm"
            placeholder="https://..."
          />
        </div>
      </div>

      <div v-if="selectedModule.type === 'container'" class="space-y-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-500 uppercase">布局设置</h4>
        <div>
          <label class="block text-sm text-gray-600 mb-1">布局方式</label>
          <select
            :value="(selectedModule.props as any).layout"
            @change="updateProps({ layout: ($event.target as HTMLSelectElement).value as any })"
            class="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="single">单列</option>
            <option value="two-column">双列</option>
            <option value="three-column">三列</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores/document'
import type { ModuleType, ModuleStyles, ModuleSpecificProps } from '@/types/document'

const documentStore = useDocumentStore()

const selectedModule = computed(() => documentStore.selectedModule)

const styleBackgroundColor = computed(() => {
  const color = selectedModule.value?.styles.backgroundColor
  return color && color !== 'transparent' ? color : '#ffffff'
})

const alignOptions = [
  { label: '左', value: 'left' as const },
  { label: '中', value: 'center' as const },
  { label: '右', value: 'right' as const }
]

function getModuleTypeName(type: ModuleType): string {
  const names: Record<ModuleType, string> = {
    text: '文字模块',
    image: '图片模块',
    divider: '分割线模块',
    button: '按钮模块',
    container: '容器模块'
  }
  return names[type]
}

function updateStyle(key: keyof ModuleStyles, value: string) {
  if (selectedModule.value) {
    documentStore.updateModuleStyles(selectedModule.value.id, { [key]: value })
  }
}

function updateProps(props: Partial<ModuleSpecificProps>) {
  if (selectedModule.value) {
    documentStore.updateModuleProps(selectedModule.value.id, props)
  }
}
</script>
```

---

### Task 9: Assemble Editor Page

**Files:**
- Modify: `frontend/src/App.vue`

- [ ] **Step 1: Update App.vue with full editor layout**

```vue
<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Header -->
    <header class="bg-white border-b shadow-sm flex-shrink-0">
      <div class="px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-bold text-gray-800">公众号排版系统</h1>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handleUndo"
            :disabled="!canUndo"
            class="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↩ 撤销
          </button>
          <button
            @click="handleRedo"
            :disabled="!canRedo"
            class="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↪ 重做
          </button>
          <button class="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
            💾 保存
          </button>
          <button class="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600">
            📄 导出HTML
          </button>
        </div>
      </div>
    </header>

    <!-- Main Editor Area -->
    <main class="flex-1 flex overflow-hidden">
      <!-- Left: Module Library -->
      <aside class="w-64 flex-shrink-0">
        <ModuleLibrary @drag-module="handleDragModule" />
      </aside>

      <!-- Center: Editor Canvas -->
      <div class="flex-1 overflow-hidden">
        <EditorCanvas ref="editorCanvasRef" />
      </div>

      <!-- Right: Property Panel -->
      <aside class="w-72 flex-shrink-0">
        <PropertyPanel />
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDocumentStore } from '@/stores/document'
import ModuleLibrary from '@/components/ModuleLibrary.vue'
import EditorCanvas from '@/components/EditorCanvas.vue'
import PropertyPanel from '@/components/PropertyPanel.vue'
import type { ModuleType } from '@/types/document'

const documentStore = useDocumentStore()
const editorCanvasRef = ref()

const canUndo = computed(() => documentStore.canUndo())
const canRedo = computed(() => documentStore.canRedo())

function handleDragModule(type: ModuleType) {
  console.log('Dragging module type:', type)
}

function handleUndo() {
  documentStore.undo()
}

function handleRedo() {
  documentStore.redo()
}
</script>
```

- [ ] **Step 2: Test full editor**

```bash
cd frontend
npm run dev
```
Expected: Three-panel layout loads, can drag modules, select modules, edit properties

---

## Phase 3: Backend Foundation

### Task 10: Scaffold Golang Backend

**Files:**
- Create: `backend/go.mod`
- Create: `backend/cmd/api/main.go`
- Create: `backend/internal/model/layout.go`
- Create: `backend/internal/store/sqlite.go`
- Create: `backend/internal/handler/layout.go`
- Create: `backend/internal/service/html_generator.go`

- [ ] **Step 1: Initialize Go module**

```bash
mkdir -p backend && cd backend
go mod init wechat-layout
```

- [ ] **Step 2: Install dependencies**

```bash
go get -u github.com/gin-gonic/gin
go get -u github.com/mattn/go-sqlite3
go get -u github.com/google/uuid
```

- [ ] **Step 3: Verify go.mod**

```go
module wechat-layout

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/google/uuid v1.4.0
	github.com/mattn/go-sqlite3 v1.14.17
)
```

- [ ] **Step 4: Create internal/model/layout.go**

```go
package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type ModuleStyles struct {
	Margin          string `json:"margin,omitempty"`
	Padding         string `json:"padding,omitempty"`
	BackgroundColor string `json:"backgroundColor,omitempty"`
	Border          string `json:"border,omitempty"`
	BorderRadius    string `json:"borderRadius,omitempty"`
	TextAlign       string `json:"textAlign,omitempty"`
	FontSize        string `json:"fontSize,omitempty"`
	Color           string `json:"color,omitempty"`
	FontWeight      string `json:"fontWeight,omitempty"`
	LineHeight      string `json:"lineHeight,omitempty"`
}

type Module struct {
	ID       string          `json:"id"`
	Type     string          `json:"type"`
	Props    json.RawMessage `json:"props"`
	Children []Module        `json:"children,omitempty"`
	Styles   ModuleStyles    `json:"styles"`
}

type Document struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Root      Module    `json:"root"`
}

type Layout struct {
	ID        string    `db:"id" json:"id"`
	Title     string    `db:"title" json:"title"`
	Document  JSONB     `db:"document" json:"document"`
	Thumbnail *string   `db:"thumbnail" json:"thumbnail,omitempty"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

// JSONB type for SQLite JSON support
type JSONB json.RawMessage

func (j *JSONB) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		*j = JSONB(json.RawMessage(`{}`))
		return nil
	}
	*j = JSONB(bytes)
	return nil
}

func (j JSONB) Value() (driver.Value, error) {
	if len(j) == 0 {
		return []byte(`{}`), nil
	}
	return []byte(j), nil
}

func (j JSONB) ToDocument() (Document, error) {
	var doc Document
	err := json.Unmarshal(j, &doc)
	return doc, err
}
```

- [ ] **Step 5: Create internal/store/sqlite.go**

```go
package store

import (
	"database/sql"
	"time"
	"wechat-layout/internal/model"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

type Store struct {
	db *sql.DB
}

func NewSQLiteStore(dbPath string) (*Store, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	// Create tables
	err = createTables(db)
	if err != nil {
		return nil, err
	}

	return &Store{db: db}, nil
}

func createTables(db *sql.DB) error {
	query := `
	CREATE TABLE IF NOT EXISTS layouts (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		document JSON NOT NULL,
		thumbnail TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_layouts_created_at ON layouts(created_at DESC);
	`
	_, err := db.Exec(query)
	return err
}

func (s *Store) Close() error {
	return s.db.Close()
}

// Layout CRUD operations
func (s *Store) ListLayouts() ([]model.Layout, error) {
	rows, err := s.db.Query(`
		SELECT id, title, document, thumbnail, created_at, updated_at
		FROM layouts
		ORDER BY updated_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var layouts []model.Layout
	for rows.Next() {
		var l model.Layout
		err := rows.Scan(&l.ID, &l.Title, &l.Document, &l.Thumbnail, &l.CreatedAt, &l.UpdatedAt)
		if err != nil {
			return nil, err
		}
		layouts = append(layouts, l)
	}
	return layouts, nil
}

func (s *Store) GetLayout(id string) (*model.Layout, error) {
	var l model.Layout
	err := s.db.QueryRow(`
		SELECT id, title, document, thumbnail, created_at, updated_at
		FROM layouts WHERE id = ?
	`, id).Scan(&l.ID, &l.Title, &l.Document, &l.Thumbnail, &l.CreatedAt, &l.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &l, nil
}

func (s *Store) CreateLayout(layout *model.Layout) error {
	layout.ID = uuid.New().String()
	layout.CreatedAt = time.Now()
	layout.UpdatedAt = time.Now()

	_, err := s.db.Exec(`
		INSERT INTO layouts (id, title, document, thumbnail, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, layout.ID, layout.Title, layout.Document, layout.Thumbnail, layout.CreatedAt, layout.UpdatedAt)
	return err
}

func (s *Store) UpdateLayout(id string, layout *model.Layout) error {
	layout.UpdatedAt = time.Now()
	_, err := s.db.Exec(`
		UPDATE layouts
		SET title = ?, document = ?, thumbnail = ?, updated_at = ?
		WHERE id = ?
	`, layout.Title, layout.Document, layout.Thumbnail, layout.UpdatedAt, id)
	return err
}

func (s *Store) DeleteLayout(id string) error {
	_, err := s.db.Exec("DELETE FROM layouts WHERE id = ?", id)
	return err
}
```

- [ ] **Step 6: Create internal/handler/layout.go**

```go
package handler

import (
	"encoding/json"
	"net/http"
	"wechat-layout/internal/model"
	"wechat-layout/internal/service"

	"github.com/gin-gonic/gin"
)

type LayoutStore interface {
	ListLayouts() ([]model.Layout, error)
	GetLayout(id string) (*model.Layout, error)
	CreateLayout(layout *model.Layout) error
	UpdateLayout(id string, layout *model.Layout) error
	DeleteLayout(id string) error
}

type LayoutHandler struct {
	store         LayoutStore
	htmlGenerator *service.HTMLGenerator
}

func NewLayoutHandler(store LayoutStore, htmlGenerator *service.HTMLGenerator) *LayoutHandler {
	return &LayoutHandler{
		store:         store,
		htmlGenerator: htmlGenerator,
	}
}

func (h *LayoutHandler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/layouts", h.ListLayouts)
	r.GET("/layouts/:id", h.GetLayout)
	r.POST("/layouts", h.CreateLayout)
	r.PUT("/layouts/:id", h.UpdateLayout)
	r.DELETE("/layouts/:id", h.DeleteLayout)
	r.POST("/export/html", h.ExportHTML)
}

func (h *LayoutHandler) ListLayouts(c *gin.Context) {
	layouts, err := h.store.ListLayouts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, layouts)
}

func (h *LayoutHandler) GetLayout(c *gin.Context) {
	id := c.Param("id")
	layout, err := h.store.GetLayout(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if layout == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "layout not found"})
		return
	}
	c.JSON(http.StatusOK, layout)
}

func (h *LayoutHandler) CreateLayout(c *gin.Context) {
	var layout model.Layout
	if err := c.ShouldBindJSON(&layout); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.store.CreateLayout(&layout)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, layout)
}

func (h *LayoutHandler) UpdateLayout(c *gin.Context) {
	id := c.Param("id")
	var layout model.Layout
	if err := c.ShouldBindJSON(&layout); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.store.UpdateLayout(id, &layout)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, layout)
}

func (h *LayoutHandler) DeleteLayout(c *gin.Context) {
	id := c.Param("id")
	err := h.store.DeleteLayout(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *LayoutHandler) ExportHTML(c *gin.Context) {
	var doc model.Document
	if err := c.ShouldBindJSON(&doc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	html, err := h.htmlGenerator.GenerateHTML(doc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"html": html})
}
```

- [ ] **Step 7: Create internal/service/html_generator.go**

```go
package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html"
	"wechat-layout/internal/model"
)

type HTMLGenerator struct{}

func NewHTMLGenerator() *HTMLGenerator {
	return &HTMLGenerator{}
}

func (g *HTMLGenerator) GenerateHTML(doc model.Document) (string, error) {
	var buf bytes.Buffer

	buf.WriteString(fmt.Sprintf(`<div style="max-width: 640px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">`))
	buf.WriteString(fmt.Sprintf(`<h1 style="font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 24px; color: #333;">%s</h1>`, html.EscapeString(doc.Title)))

	err := g.renderModule(&buf, doc.Root)
	if err != nil {
		return "", err
	}

	buf.WriteString(`</div>`)

	return buf.String(), nil
}

func (g *HTMLGenerator) renderModule(buf *bytes.Buffer, module model.Module) error {
	styles := g.renderStyles(module.Styles)

	switch module.Type {
	case "text":
		var props struct {
			Content string `json:"content"`
		}
		if err := json.Unmarshal(module.Props, &props); err != nil {
			return err
		}
		buf.WriteString(fmt.Sprintf(`<p style="%s">%s</p>`, styles, props.Content))

	case "image":
		var props struct {
			Src    string `json:"src"`
			Alt    string `json:"alt"`
			Width  string `json:"width"`
			Height string `json:"height"`
		}
		if err := json.Unmarshal(module.Props, &props); err != nil {
			return err
		}
		imgStyle := ""
		if props.Width != "" {
			imgStyle += fmt.Sprintf("width: %s;", props.Width)
		}
		if props.Height != "" {
			imgStyle += fmt.Sprintf("height: %s;", props.Height)
		}
		buf.WriteString(fmt.Sprintf(`<div style="%s"><img src="%s" alt="%s" style="%smax-width: 100%%; height: auto; display: block;" /></div>`,
			styles, html.EscapeString(props.Src), html.EscapeString(props.Alt), imgStyle))

	case "divider":
		var props struct {
			Style string `json:"style"`
			Color string `json:"color"`
		}
		if err := json.Unmarshal(module.Props, &props); err != nil {
			return err
		}
		buf.WriteString(fmt.Sprintf(`<div style="%s"><hr style="border: none; border-top: 1px %s %s; margin: 0;" /></div>`,
			styles, props.Style, props.Color))

	case "button":
		var props struct {
			Text string `json:"text"`
			Link string `json:"link"`
			Size string `json:"size"`
		}
		if err := json.Unmarshal(module.Props, &props); err != nil {
			return err
		}
		sizeStyles := map[string]string{
			"small":  "padding: 6px 16px; font-size: 14px;",
			"medium": "padding: 10px 24px; font-size: 16px;",
			"large":  "padding: 14px 32px; font-size: 18px;",
		}
		btnStyle := sizeStyles[props.Size] + "background-color: #07c160; color: white; border-radius: 4px; font-weight: 500; text-decoration: none; display: inline-block;"
		buf.WriteString(fmt.Sprintf(`<div style="%s"><a href="%s" style="%s">%s</a></div>`,
			styles, html.EscapeString(props.Link), btnStyle, html.EscapeString(props.Text)))

	case "container":
		var props struct {
			Layout string `json:"layout"`
		}
		if err := json.Unmarshal(module.Props, &props); err != nil {
			return err
		}
		layoutStyles := map[string]string{
			"single":       "",
			"two-column":   "display: grid; grid-template-columns: 1fr 1fr; gap: 16px;",
			"three-column": "display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;",
		}
		buf.WriteString(fmt.Sprintf(`<div style="%s%s">`, styles, layoutStyles[props.Layout]))
		for _, child := range module.Children {
			if err := g.renderModule(buf, child); err != nil {
				return err
			}
		}
		buf.WriteString(`</div>`)
	}

	return nil
}

func (g *HTMLGenerator) renderStyles(styles model.ModuleStyles) string {
	var buf bytes.Buffer

	if styles.Margin != "" {
		buf.WriteString(fmt.Sprintf("margin: %s;", styles.Margin))
	}
	if styles.Padding != "" {
		buf.WriteString(fmt.Sprintf("padding: %s;", styles.Padding))
	}
	if styles.BackgroundColor != "" && styles.BackgroundColor != "transparent" {
		buf.WriteString(fmt.Sprintf("background-color: %s;", styles.BackgroundColor))
	}
	if styles.Border != "" && styles.Border != "none" {
		buf.WriteString(fmt.Sprintf("border: %s;", styles.Border))
	}
	if styles.BorderRadius != "" {
		buf.WriteString(fmt.Sprintf("border-radius: %s;", styles.BorderRadius))
	}
	if styles.TextAlign != "" {
		buf.WriteString(fmt.Sprintf("text-align: %s;", styles.TextAlign))
	}
	if styles.FontSize != "" {
		buf.WriteString(fmt.Sprintf("font-size: %s;", styles.FontSize))
	}
	if styles.Color != "" {
		buf.WriteString(fmt.Sprintf("color: %s;", styles.Color))
	}
	if styles.FontWeight != "" {
		buf.WriteString(fmt.Sprintf("font-weight: %s;", styles.FontWeight))
	}
	if styles.LineHeight != "" {
		buf.WriteString(fmt.Sprintf("line-height: %s;", styles.LineHeight))
	}

	return buf.String()
}
```

- [ ] **Step 8: Create cmd/api/main.go**

```go
package main

import (
	"log"
	"wechat-layout/internal/handler"
	"wechat-layout/internal/service"
	"wechat-layout/internal/store"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize store
	s, err := store.NewSQLiteStore("./layouts.db")
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer s.Close()

	// Initialize services
	htmlGenerator := service.NewHTMLGenerator()

	// Initialize handlers
	layoutHandler := handler.NewLayoutHandler(s, htmlGenerator)

	// Setup Gin
	r := gin.Default()

	// CORS middleware for development
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// API routes
	api := r.Group("/api")
	{
		layoutHandler.RegisterRoutes(api)
	}

	log.Println("Server starting on :8080")
	log.Fatal(r.Run(":8080"))
}
```

- [ ] **Step 9: Create .gitignore in backend**

```
*.db
*.exe
*.dll
*.so
*.dylib
bin
vendor
*.test
*.out
```

- [ ] **Step 10: Test backend compiles and runs**

```bash
cd backend
go build -o server ./cmd/api
./server
```
Expected: Server starts on port 8080

```bash
curl http://localhost:8080/api/layouts
```
Expected: Returns empty array `[]`

---

## Phase 4: Backend Integration & Export

### Task 11: Frontend API Service & Save/Load

**Files:**
- Create: `frontend/src/services/api.ts`
- Modify: `frontend/src/App.vue`

- [ ] **Step 1: Create api.ts service**

```typescript
import type { Document } from '@/types/document'

const API_BASE = '/api'

export interface Layout {
  id: string
  title: string
  document: Document
  thumbnail?: string
  created_at: string
  updated_at: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Layouts
  listLayouts: () => request<Layout[]>('/layouts'),
  getLayout: (id: string) => request<Layout>(`/layouts/${id}`),
  createLayout: (data: { title: string; document: Document }) =>
    request<Layout>('/layouts', { method: 'POST', body: JSON.stringify(data) }),
  updateLayout: (id: string, data: { title: string; document: Document }) =>
    request<Layout>(`/layouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLayout: (id: string) => request(`/layouts/${id}`, { method: 'DELETE' }),

  // Export
  exportHTML: (document: Document) =>
    request<{ html: string }>('/export/html', { method: 'POST', body: JSON.stringify(document) })
}
```

- [ ] **Step 2: Update App.vue with save/load functionality**

Add save/load logic to the existing App.vue:

```typescript
// Add these imports
import { api } from '@/services/api'
import { ref } from 'vue'

// Add this state
const currentLayoutId = ref<string | null>(null)

// Add these functions
async function handleSave() {
  try {
    const doc = documentStore.document

    if (currentLayoutId.value) {
      await api.updateLayout(currentLayoutId.value, { title: doc.title, document: doc })
    } else {
      const result = await api.createLayout({ title: doc.title, document: doc })
      currentLayoutId.value = result.id
    }
    alert('保存成功')
  } catch (error) {
    alert('保存失败: ' + (error as Error).message)
  }
}

async function handleExportHTML() {
  try {
    const result = await api.exportHTML(documentStore.document)

    // Create modal to display HTML
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <h3 class="text-lg font-bold mb-4">导出的HTML</h3>
        <textarea class="flex-1 w-full p-3 border rounded font-mono text-sm min-h-[200px]" readonly>${result.html.replace(/"/g, '&quot;')}</textarea>
        <div class="flex justify-end gap-2 mt-4">
          <button class="px-4 py-2 border rounded hover:bg-gray-50" onclick="document.body.removeChild(this.closest('.fixed'))">关闭</button>
          <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onclick="this.previousElementSibling.previousElementSibling.select(); document.execCommand('copy')">复制</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  } catch (error) {
    alert('导出失败: ' + (error as Error).message)
  }
}

// Update the buttons in template to use these functions:
// @click="handleSave"
// @click="handleExportHTML"
```

---

## Phase 5: Testing & Polish

### Task 12: Manual Testing & Bug Fixes

**Files:** Various

- [ ] **Step 1: Test drag and drop**
  - Drag new modules from library to canvas
  - Drag existing modules to reorder
  - Verify drop zones activate correctly

- [ ] **Step 2: Test module selection**
  - Click modules to select
  - Verify property panel updates
  - Edit styles and see changes in real-time

- [ ] **Step 3: Test undo/redo**
  - Perform multiple operations
  - Verify undo reverts changes
  - Verify redo restores them

- [ ] **Step 4: Test save/load/export**
  - Create a layout with multiple modules
  - Save it
  - Export HTML
  - Verify exported HTML renders correctly

- [ ] **Step 5: Test container nesting**
  - Drag a container onto canvas
  - Verify modules can be dropped inside containers
  - Verify nesting depth is limited (MVP: 2 levels)

---

## Final Verification

- [ ] All MVP features working:
  - ✅ Drag and drop modules
  - ✅ Module selection and property editing
  - ✅ Undo/redo
  - ✅ Container nesting (2 levels)
  - ✅ Save to backend
  - ✅ Export clean HTML for WeChat
  - ✅ All 5 module types implemented

---

Plan complete. The implementation should follow this task-by-task order, with each task building on the previous one. Each component is designed to be testable independently before integration.
