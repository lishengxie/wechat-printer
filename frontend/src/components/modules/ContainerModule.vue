<script setup lang="ts">
import { ref, inject } from 'vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, ContainerModuleProps, ModuleType } from '@/types/document'
import { useDragState } from '@/composables/useDragState'
import { createModule } from '@/types/document'
import ModuleItem from '../ModuleItem.vue'

interface Props {
  module: Module & { props: ContainerModuleProps; children: Module[] }
}

const props = defineProps<Props>()
const documentStore = useDocumentStore()
const { getDraggingType } = useDragState()

// 注入预览模式标志
const isPreviewMode = inject('isPreviewMode', ref(false))
const isDragOverContainer = ref(false)
const activeDropIndex = ref<number | null>(null)
const draggingModuleId = ref<string | null>(null)

// ============================================
// 辅助函数
// ============================================

function getLayoutClass(layout: string) {
  switch (layout) {
    case 'single': return 'grid-cols-1'
    case 'two-column': return 'grid-cols-2 gap-4'
    case 'three-column': return 'grid-cols-3 gap-3'
    default: return 'grid-cols-1'
  }
}

function getModuleTypeFromEvent(event: DragEvent): ModuleType | null {
  return (event.dataTransfer?.getData('moduleType') as ModuleType) || getDraggingType()
}

// ============================================
// 拖拽事件处理
// ============================================

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
  activeDropIndex.value = null
}

// 放置到容器（添加到末尾）
function handleDrop(event: DragEvent) {
  if (isPreviewMode.value) return
  event.preventDefault()
  event.stopPropagation()

  console.log('🟢 Container handleDrop called, activeDropIndex:', activeDropIndex.value)

  isDragOverContainer.value = false
  activeDropIndex.value = null

  const moduleType = getModuleTypeFromEvent(event)
  console.log('  - moduleType:', moduleType)

  if (moduleType) {
    const children = props.module.children || []
    const newModule = createModule(moduleType)
    console.log('  ✅ Adding module to container at index:', children.length)
    documentStore.addModule(newModule, props.module.id, children.length)
  } else {
    console.log('  ❌ No module type found!')
  }
}

// 放置线拖拽经过
function handleDropLineDragOver(event: DragEvent, index: number) {
  if (isPreviewMode.value) return
  event.preventDefault()
  event.stopPropagation()
  activeDropIndex.value = index
  console.log('🟢 Container dropLine dragOver, index:', index)
}

// 放置到容器内指定位置
function handleDropAtIndex(event: DragEvent, index: number) {
  if (isPreviewMode.value) return
  event.preventDefault()
  event.stopPropagation()
  console.log('🟢 Container dropAtIndex, index:', index)

  activeDropIndex.value = null
  isDragOverContainer.value = false

  const moduleType = getModuleTypeFromEvent(event)
  console.log('  - moduleType:', moduleType)

  if (moduleType) {
    const newModule = createModule(moduleType)
    console.log('  ✅ Inserting new module into container at index:', index)
    documentStore.addModule(newModule, props.module.id, index)
  } else {
    console.log('  ❌ No module type found!')
  }
}

// 子模块开始拖拽
function handleModuleDragStart(moduleId: string) {
  draggingModuleId.value = moduleId
}
</script>

<template>
  <div class="container-module">
    <!-- 容器内部区域 -->
    <div
      class="container-inner grid"
      :class="[
        getLayoutClass(module.props.layout),
        { 'drag-active': isDragOverContainer && !isPreviewMode }
      ]"
      @dragover.prevent.stop="handleDragOver"
      @dragleave.stop="handleDragLeave"
      @drop.prevent.stop="handleDrop"
    >
      <!-- 渲染子模块 -->
      <template v-if="module.children && module.children.length > 0">
        <template v-if="!isPreviewMode">
          <div v-for="(child, index) in module.children" :key="child.id" class="child-slot">
            <!-- 顶部放置线 -->
            <div
              class="child-drop-line"
              :class="{ active: activeDropIndex === index }"
              @dragover.prevent.stop="handleDropLineDragOver($event, index)"
              @drop.prevent.stop="handleDropAtIndex($event, index)"
            ></div>

            <!-- 子模块 -->
            <ModuleItem
              :module="child"
              @drag-start="handleModuleDragStart"
            />

            <!-- 最后一个模块后的放置线 -->
            <div
              v-if="index === module.children.length - 1"
              class="child-drop-line"
              :class="{ active: activeDropIndex === index + 1 }"
              @dragover.prevent.stop="handleDropLineDragOver($event, index + 1)"
              @drop.prevent.stop="handleDropAtIndex($event, index + 1)"
            ></div>
          </div>
        </template>

        <!-- 预览模式：直接渲染 -->
        <ModuleItem v-for="child in module.children" :key="child.id" :module="child" v-else />
      </template>

      <!-- 空容器提示 -->
      <div v-if="(!module.children || module.children.length === 0) && !isPreviewMode" class="empty-hint">
        <span>📦 拖拽模块到这里</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container-module {
  margin: 8px 0;
  min-height: 50px;
}

.container-inner {
  width: 100%;
  min-height: 50px;
  padding: 24px 16px 16px 16px;
  border: 2px dashed #c0c4cc;
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: #fafafa;
  position: relative;
  z-index: 10;
}

/* 确保容器内部有可拖拽放置的区域 */
.container-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 24px;
  pointer-events: auto;
  z-index: 100;
}

.container-inner::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 16px;
  pointer-events: auto;
  z-index: 100;
}

.container-inner.drag-active {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.05);
}

/* 子模块插槽 */
.child-slot {
  position: relative;
  margin-bottom: 4px;
}

/* 容器内放置线 */
.child-drop-line {
  height: 16px;
  margin: -8px 0;
  cursor: copy;
  position: relative;
  z-index: 500;
  background-color: transparent;
  pointer-events: auto;
}

.child-drop-line::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 3px;
  background-color: transparent;
  transform: translateY(-50%);
  transition: all 0.15s ease;
  border-radius: 1px;
  pointer-events: none;
}

.child-drop-line.active::before {
  background-color: #67c23a;
  box-shadow: 0 0 10px rgba(103, 194, 58, 0.5);
}

/* 空容器提示 */
.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: #909399;
  font-size: 14px;
  pointer-events: none;
  grid-column: 1 / -1;
}
</style>
