<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDocumentStore } from '@/stores/document'
import { createModule } from '@/types/document'
import type { ModuleType } from '@/types/document'
import { useDragState } from '@/composables/useDragState'
import ModuleItem from './ModuleItem.vue'

const documentStore = useDocumentStore()
const { document } = storeToRefs(documentStore)
const { getDraggingType, endDrag } = useDragState()

// 拖拽状态
const isDragOverCanvas = ref(false)
const activeDropIndex = ref<number | null>(null)
const draggingModuleId = ref<string | null>(null)

// 根级别子模块
const rootChildren = computed(() => document.value.root.children || [])
const isEmpty = computed(() => rootChildren.value.length === 0)

// ============================================
// 拖拽处理函数
// ============================================

// 现有模块开始拖拽
function onModuleDragStart(moduleId: string) {
  draggingModuleId.value = moduleId
}

function onModuleDragEnd() {
  draggingModuleId.value = null
  activeDropIndex.value = null
}

// 画布区域拖拽经过
function onCanvasDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = draggingModuleId.value ? 'move' : 'copy'
  isDragOverCanvas.value = true
}

// 拖拽离开画布
function onCanvasDragLeave() {
  isDragOverCanvas.value = false
}

// 放置到画布空白区域（末尾）
function onCanvasDrop(event: DragEvent) {
  event.preventDefault()
  console.log('🔴 onCanvasDrop called - event.target:', event.target)

  // 如果 activeDropIndex 有值，说明已经在 drop-line 上处理了，不应该到这里
  if (activeDropIndex.value !== null) {
    console.log('  ⚠️  activeDropIndex was set:', activeDropIndex.value, '- ignoring canvas drop')
    activeDropIndex.value = null
    isDragOverCanvas.value = false
    return
  }

  isDragOverCanvas.value = false
  activeDropIndex.value = null

  const existingModuleId = event.dataTransfer?.getData('moduleId')

  if (existingModuleId && draggingModuleId.value) {
    // 现有模块：移动到末尾（优先处理）
    console.log('  ✅ Moving existing module to end')
    documentStore.moveModule(draggingModuleId.value, null, rootChildren.value.length)
    draggingModuleId.value = null
  } else {
    const moduleType = getModuleTypeFromEvent(event)
    if (moduleType) {
      // 新模块：添加到末尾
      const variant = event.dataTransfer?.getData('moduleVariant')
      const newModule = createModule(moduleType)
      if (variant) {
        (newModule.props as any).variant = variant
      }
      documentStore.addModule(newModule, undefined, rootChildren.value.length)
      endDrag()
    }
  }
}

// 放置线拖拽经过
function onDropLineDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  event.stopPropagation()
  event.dataTransfer!.dropEffect = draggingModuleId.value ? 'move' : 'copy'
  activeDropIndex.value = index
  console.log('🟢 onDropLineDragOver index:', index, 'dropEffect:', draggingModuleId.value ? 'move' : 'copy')
}

// 放置到指定位置
function onDropAtIndex(event: DragEvent, index: number) {
  event.preventDefault()
  event.stopPropagation()
  console.log('🟢 onDropAtIndex called, index:', index)

  // 立即重置拖拽状态
  activeDropIndex.value = null
  isDragOverCanvas.value = false

  const existingModuleId = event.dataTransfer?.getData('moduleId')

  console.log('  - existingModuleId:', existingModuleId)
  console.log('  - draggingModuleId:', draggingModuleId.value)

  if (existingModuleId && draggingModuleId.value) {
    // 现有模块移动（优先处理，避免被 getDraggingType() 残留值干扰）
    console.log('  ✅ Moving existing module to index:', index)
    documentStore.moveModule(draggingModuleId.value, null, index)
    draggingModuleId.value = null
  } else {
    const moduleType = event.dataTransfer?.getData('moduleType') as ModuleType
    console.log('  - moduleType from dataTransfer:', moduleType)
    console.log('  - moduleType from global state:', getDraggingType())

    if (moduleType || getDraggingType()) {
      // 新模块插入
      const type = moduleType || getDraggingType()
      const variant = event.dataTransfer?.getData('moduleVariant')
      const newModule = createModule(type!)
      if (variant) {
        (newModule.props as any).variant = variant
      }
      console.log('  ✅ Inserting new module at index:', index, 'variant:', variant)
      documentStore.addModule(newModule, undefined, index)
      endDrag()
    } else {
      console.log('  ❌ No module type found, drop failed!')
    }
  }
}

// 取消选中
function deselectAll() {
  console.log('❌ deselectAll called')
  documentStore.selectModule(null)
}

// ============================================
// 辅助函数
// ============================================


function getModuleTypeFromEvent(event: DragEvent): ModuleType | null {
  return (event.dataTransfer?.getData('moduleType') as ModuleType) || getDraggingType()
}
</script>

<template>
  <div class="editor-canvas">
    <!-- 标题输入框 -->
    <div class="title-bar" @click="deselectAll">
      <input
        v-model="documentStore.document.title"
        type="text"
        class="title-input"
        placeholder="输入文章标题..."
        @click.stop
      />
    </div>

    <!-- 编辑画布区域 -->
    <div class="canvas-area" @click="deselectAll">
      <div
        class="drop-canvas"
        @dragover.prevent="onCanvasDragOver"
        @dragleave="onCanvasDragLeave"
        @drop.prevent="onCanvasDrop"
        :class="{ 'drag-active': isDragOverCanvas }"
      >
        <!-- 空状态提示 -->
        <div v-if="isEmpty" class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-text">还没有任何内容</div>
          <div class="empty-hint">从左侧拖拽模块到这里开始排版</div>
        </div>

        <!-- 渲染所有模块 -->
        <div v-for="(child, index) in rootChildren" :key="child.id" class="module-slot">
          <!-- 顶部放置线 -->
          <div
            class="drop-line"
            :class="{ active: activeDropIndex === index }"
            @dragover.prevent.stop="onDropLineDragOver($event, index)"
            @drop.prevent.stop="onDropAtIndex($event, index)"
          ></div>

          <!-- 模块内容 -->
          <ModuleItem
            :module="child"
            @drag-start="onModuleDragStart"
            @drag-end="onModuleDragEnd"
          />

          <!-- 最后一个模块后的放置线 -->
          <div
            v-if="index === rootChildren.length - 1"
            class="drop-line"
            :class="{ active: activeDropIndex === index + 1 }"
            @dragover.prevent.stop="onDropLineDragOver($event, index + 1)"
            @drop.prevent.stop="onDropAtIndex($event, index + 1)"
          ></div>
        </div>
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

/* 模块插槽 */
.module-slot {
  position: relative;
  margin-bottom: 8px;
}

/* 放置线 */
.drop-line {
  height: 16px;
  margin: -8px 0;
  cursor: copy;
  position: relative;
  z-index: 1000;
  background-color: transparent;
  pointer-events: auto;
}

.drop-line[data-moving='true'] {
  cursor: move;
}

.drop-line::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 4px;
  background-color: transparent;
  transform: translateY(-50%);
  transition: all 0.15s ease;
  border-radius: 2px;
  pointer-events: none;
}

.drop-line.active::before {
  background-color: #409eff;
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.6);
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
