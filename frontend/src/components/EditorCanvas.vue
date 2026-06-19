<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

watch(() => document.value.root.children, (newChildren) => {
  if (newChildren) {
    moduleList.value = [...newChildren]
  } else {
    moduleList.value = []
  }
}, { immediate: true })

const isEmpty = computed(() => moduleList.value.length === 0)

// ============================================
// 拖拽处理函数
// ============================================

// 画布区域拖拽经过（来自外部库）
function onCanvasDragOver(event: DragEvent) {
  const types = event.dataTransfer?.types || []
  const hasModuleType = types.some(t => t === 'moduleType')
  if (hasModuleType) {
    event.preventDefault()
    isDragOverCanvas.value = true
  }
}

// 拖拽离开画布
function onCanvasDragLeave() {
  isDragOverCanvas.value = false
}

// 放置到画布（来自外部库）
function onCanvasDrop(event: DragEvent) {
  event.preventDefault()
  isDragOverCanvas.value = false

  const existingModuleId = event.dataTransfer?.getData('moduleId')
  if (existingModuleId) return // 排序由 VueDraggable 处理

  const moduleType = event.dataTransfer?.getData('moduleType') as ModuleType
  if (moduleType) {
    const variant = event.dataTransfer?.getData('moduleVariant')
    const newModule = createModule(moduleType)
    if (variant) {
      (newModule.props as any).variant = variant
    }
    documentStore.addModule(newModule)
  }
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
      <div
        class="drop-canvas"
        :class="{ 'drag-active': isDragOverCanvas }"
      >
        <VueDraggable
          v-model="moduleList"
          ghost-class="drag-ghost"
          @update="onDragUpdate"
          @dragover="onCanvasDragOver"
          @dragleave="onCanvasDragLeave"
          @drop="onCanvasDrop"
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
