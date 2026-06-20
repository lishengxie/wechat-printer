<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useDocumentStore } from '@/stores/document'
import { createModule } from '@/types/document'
import type { Module, ModuleType } from '@/types/document'
import { VueDraggable } from 'vue-draggable-plus'
import ModuleItem from './ModuleItem.vue'

const documentStore = useDocumentStore()
const { document } = storeToRefs(documentStore)

// 拖拽状态
const isDragOverCanvas = ref(false)

// 本地模块列表，同步到 document
const moduleList = ref<Module[]>([])

// VueDraggable 渲染出的真实 DOM 引用
const draggableRef = ref<any>(null)

watch(() => document.value.root.children, (newChildren) => {
  if (newChildren) {
    moduleList.value = [...newChildren]
  } else {
    moduleList.value = []
  }
}, { immediate: true })

const isEmpty = computed(() => moduleList.value.length === 0)

// ============================================
// 拖拽处理函数（直接挂在 VueDraggable 渲染出的真实 DOM 上，
// 因为 vue-draggable-plus 不会把 dragover/drop 转发到 Vue listener）
// ============================================

function onCanvasDragOver(event: DragEvent) {
  const types = event.dataTransfer?.types || []
  // dragover 阶段 types 在部分浏览器会被小写化，做大小写不敏感比较
  const hasModuleType = Array.from(types).some(t => t.toLowerCase() === 'moduletype')
  if (!hasModuleType) return
  event.preventDefault()
  isDragOverCanvas.value = true
}

function onCanvasDragLeave() {
  isDragOverCanvas.value = false
}

function onCanvasDrop(event: DragEvent) {
  const existingModuleId = event.dataTransfer?.getData('moduleId')
  if (existingModuleId) return // 已有模块的排序由 VueDraggable 处理

  const moduleType = event.dataTransfer?.getData('moduleType') as ModuleType
  if (!moduleType) return

  event.preventDefault()
  isDragOverCanvas.value = false

  const variant = event.dataTransfer?.getData('moduleVariant')
  const newModule = createModule(moduleType)
  if (variant) {
    (newModule.props as any).variant = variant
  }

  const insertIndex = computeInsertIndex(event)
  documentStore.addModule(newModule, undefined, insertIndex)
}

// 根据鼠标位置计算应插入的索引（基于各子模块 DOM 中点的 Y 坐标）
function computeInsertIndex(event: DragEvent): number {
  const container = resolveEl()
  if (!container) return moduleList.value.length
  // 直接遍历容器内的 .module-item 子元素，按出现顺序与 moduleList 一一对应
  const items = Array.from(container.querySelectorAll(':scope > .module-item')) as HTMLElement[]
  if (items.length === 0) return 0
  const y = event.clientY
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    if (y < midY) return i
  }
  return items.length
}

// VueDraggable 排序变更处理（仅响应元素位置变更，不响应外部添加）
function onDragUpdate() {
  const orderedIds = moduleList.value.map(m => m.id)
  const currentIds = (document.value.root.children || []).map(m => m.id)
  // 仅在顺序真正改变时同步 store（moduleList 是 document 的独立副本）
  if (JSON.stringify(orderedIds) !== JSON.stringify(currentIds)) {
    documentStore.reorderRootChildren(orderedIds)
  }
}

// 解析 VueDraggable 组件实例对应的真实 DOM
function resolveEl(): HTMLElement | null {
  const r: any = draggableRef.value
  if (!r) return null
  if (r instanceof HTMLElement) return r
  if (r.$el instanceof HTMLElement) return r.$el
  return null
}

let boundEl: HTMLElement | null = null

function bindNativeListeners() {
  const el = resolveEl()
  if (!el || el === boundEl) return
  if (boundEl) {
    boundEl.removeEventListener('dragover', onCanvasDragOver)
    boundEl.removeEventListener('dragleave', onCanvasDragLeave)
    boundEl.removeEventListener('drop', onCanvasDrop)
  }
  el.addEventListener('dragover', onCanvasDragOver)
  el.addEventListener('dragleave', onCanvasDragLeave)
  el.addEventListener('drop', onCanvasDrop)
  boundEl = el
}

onMounted(bindNativeListeners)
watch(draggableRef, bindNativeListeners)

onBeforeUnmount(() => {
  if (boundEl) {
    boundEl.removeEventListener('dragover', onCanvasDragOver)
    boundEl.removeEventListener('dragleave', onCanvasDragLeave)
    boundEl.removeEventListener('drop', onCanvasDrop)
    boundEl = null
  }
})
</script>

<template>
  <div class="editor-canvas">
    <!-- 标题输入框 -->
    <div class="title-bar" @click="documentStore.selectModule(null)">
      <input
        v-model="documentStore.document.title"
        type="text"
        class="title-input"
        placeholder="输入文章标题..."
        @click.stop
      />
    </div>

    <!-- 编辑画布区域 -->
    <div class="canvas-area" @click="documentStore.selectModule(null)">
      <VueDraggable
        ref="draggableRef"
        v-model="moduleList"
        tag="div"
        class="drop-canvas"
        :class="{ 'drag-active': isDragOverCanvas }"
        ghost-class="drag-ghost"
        @update="onDragUpdate"
        :animation="200"
      >
        <!-- 空状态提示 -->
        <div v-if="isEmpty" :key="'empty'" class="empty-state">
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
    </div>
  </div>
</template>

<style scoped>
.editor-canvas {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f7fa;
}

/* 标题栏 */
.title-bar {
  padding: 20px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
}

.title-input {
  width: 100%;
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  border: none;
  outline: none;
  background: transparent;
}

.title-input::placeholder {
  color: #c0c4cc;
}

/* 画布区域 */
.canvas-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.drop-canvas {
  min-height: 500px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.drop-canvas.drag-active {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.05);
}

/* 拖拽幽灵样式 */
.drag-ghost {
  opacity: 0.4;
  border: 2px dashed #409eff;
  background-color: rgba(64, 158, 255, 0.05);
  border-radius: 8px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 24px;
  text-align: center;
  background-color: #f9fafc;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  pointer-events: none;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: #909399;
}
</style>
