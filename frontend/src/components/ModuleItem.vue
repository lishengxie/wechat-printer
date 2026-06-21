<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useDocumentStore } from '@/stores/document'
import type { Module } from '@/types/document'
import ModuleRenderer from './ModuleRenderer.vue'

interface Props {
  module: Module
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'drag-start', moduleId: string): void
  (e: 'drag-end', moduleId: string): void
}>()

const documentStore = useDocumentStore()
const isPreviewMode = inject('isPreviewMode', ref(false))
const isHovered = ref(false)
const isDragging = ref(false)

// 模块背景色：有设置则使用，否则默认白色（编辑器中可见）
const moduleBgStyle = computed(() => ({
  backgroundColor: props.module.styles?.backgroundColor || 'transparent'
}))

// 是否被选中
const isSelected = computed(() => documentStore.selectedModuleId === props.module.id)

// ============================================
// 事件处理
// ============================================

function handleClick(event: MouseEvent) {
  console.log('👆 ModuleItem handleClick, moduleId:', props.module.id, 'target:', (event.target as HTMLElement)?.tagName)
  if (isPreviewMode.value) return
  event.stopPropagation() // 关键：阻止事件冒泡到父级的 deselectAll
  documentStore.selectModule(props.module.id)
}

function handleDelete(event: Event) {
  event.stopPropagation()
  console.log('🗑️ ModuleItem handleDelete called, moduleId:', props.module.id)
  documentStore.removeModule(props.module.id)
}

function handleDragStart(event: DragEvent) {
  console.log('🟦 ModuleItem dragstart', props.module.id)
  if (event.dataTransfer) {
    event.dataTransfer.setData('moduleId', props.module.id)
    event.dataTransfer.effectAllowed = 'move'
  }
  isDragging.value = true
  emit('drag-start', props.module.id)
}

function handleDragEnd() {
  console.log('🟦 ModuleItem dragend', props.module.id)
  isDragging.value = false
  emit('drag-end', props.module.id)
}

function handleMouseEnter() {
  isHovered.value = true
}

function handleMouseLeave() {
  isHovered.value = false
}
</script>

<template>
  <div
    class="module-item"
    :style="moduleBgStyle"
    :class="{
      'is-selected': isSelected && !isPreviewMode,
      'is-hovered': isHovered && !isPreviewMode,
      'is-dragging': isDragging
    }"
    @click.stop="handleClick"
    @mousedown.stop="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 选中高亮边框 -->
    <div v-if="isSelected && !isPreviewMode" class="selection-border"></div>

    <!-- 操作工具栏（仅选中时显示） -->
    <div v-if="isSelected && !isPreviewMode" class="toolbar">
      <button class="btn-copy" @click.stop="documentStore.duplicateModule(module.id)" title="复制模块 (Ctrl+D)">
        <span class="toolbar-icon">⧉</span>
      </button>
      <button class="btn-delete" @click.stop="handleDelete" title="删除模块 (Delete)">
        ✕
      </button>
      <div
        class="drag-handle"
        title="拖动移动"
        draggable="true"
        @dragstart.stop="handleDragStart"
        @dragend="handleDragEnd"
      >
        <span>⋮⋮</span>
      </div>
    </div>

    <!-- 模块内容 -->
    <div class="module-content">
      <ModuleRenderer :module="module" />
    </div>
  </div>
</template>

<style scoped>
.module-item {
  position: relative;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 40px;
  z-index: 10;
  pointer-events: auto;
  outline: none;
}

.module-item:focus,
.module-item:focus-visible,
.module-item *:focus,
.module-item *:focus-visible {
  outline: none;
}

/* 悬停状态 */
.module-item.is-hovered {
  border-color: #dcdfe6;
  background-color: #f5f7fa;
}

.module-item.is-dragging {
  opacity: 0.5;
}

/* 选中状态 - 蓝色边框 */
.module-item.is-selected {
  border-color: #409eff !important;
  background-color: #ecf5ff !important;
}

/* 选中边框效果 */
.selection-border {
  position: absolute;
  inset: 0;
  border: 2px solid #409eff;
  border-radius: 8px;
  pointer-events: none;
}

/* 工具栏 */
.toolbar {
  position: absolute;
  top: -10px;
  right: 12px;
  display: flex;
  gap: 6px;
  z-index: 10;
}

/* 删除按钮 */
.btn-delete {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: #ef4444;
  transform: scale(1.1);
}

.btn-copy {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #909399;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.btn-copy:hover {
  background: #606266;
  transform: scale(1.1);
}

.toolbar-icon {
  line-height: 1;
}

/* 拖拽手柄 */
.drag-handle {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #909399;
  color: white;
  border-radius: 50%;
  cursor: grab;
  font-size: 10px;
  line-height: 1;
  transition: all 0.2s ease;
  user-select: none;
  -webkit-user-select: none;
}

.drag-handle:hover {
  background: #606266;
}

.drag-handle:active {
  cursor: grabbing;
}

/* 内容区域 */
.module-content {
  position: relative;
  z-index: 1;
}
</style>
