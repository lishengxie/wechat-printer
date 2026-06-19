<script setup lang="ts">
import { ref, inject, computed, watch } from 'vue'
import { useDocumentStore } from '@/stores/document'
import type { Module, ContainerModuleProps, ModuleType } from '@/types/document'
import { useDragState } from '@/composables/useDragState'
import { createModule } from '@/types/document'
import ModuleItem from '../ModuleItem.vue'
import { VueDraggable } from 'vue-draggable-plus'

interface Props {
  module: Module & { props: ContainerModuleProps; children: Module[] }
}

const props = defineProps<Props>()
const documentStore = useDocumentStore()
const { getDraggingType } = useDragState()

// 注入预览模式标志
const isPreviewMode = inject('isPreviewMode', ref(false))
const isDragOverContainer = ref(false)

const childModules = ref<Module[]>([])

watch(() => props.module.children, (children) => {
  childModules.value = children || []
}, { immediate: true })

const containerStyle = computed(() => ({
  padding: props.module.styles.padding || '24px 16px 16px',
  backgroundColor: props.module.styles.backgroundColor || '#fafafa',
  borderRadius: props.module.styles.borderRadius || '8px',
  border: props.module.styles.border || '2px dashed #c0c4cc',
  margin: props.module.styles.margin || '8px 0'
}))

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
}

function handleDrop(event: DragEvent) {
  if (isPreviewMode.value) return
  event.preventDefault()
  event.stopPropagation()
  isDragOverContainer.value = false

  const existingModuleId = event.dataTransfer?.getData('moduleId')
  if (existingModuleId) return // 排序由 VueDraggable 处理

  const moduleType = event.dataTransfer?.getData('moduleType') as ModuleType
  if (moduleType) {
    const newModule = createModule(moduleType)
    documentStore.addModule(newModule, props.module.id, childModules.value.length)
  }
}

function onChildDragUpdate() {
  const orderedIds = childModules.value.map(m => m.id)
  const currentIds = (props.module.children || []).map(m => m.id)
  if (JSON.stringify(orderedIds) !== JSON.stringify(currentIds)) {
    documentStore.reorderChildModules(props.module.id, orderedIds)
  }
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
      :style="containerStyle"
      @dragover.prevent.stop="handleDragOver"
      @dragleave.stop="handleDragLeave"
      @drop.prevent.stop="handleDrop"
    >
      <!-- 渲染子模块 -->
      <template v-if="!isPreviewMode">
        <VueDraggable
          v-model="childModules"
          ghost-class="child-drag-ghost"
          @update="onChildDragUpdate"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          :animation="200"
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

      <!-- 预览模式：直接渲染 -->
      <template v-else>
        <ModuleItem v-for="child in (module.children || [])" :key="child.id" :module="child" />
      </template>
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
  transition: all 0.2s ease;
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
  border-color: #409eff !important;
  background-color: rgba(64, 158, 255, 0.05) !important;
}

/* VueDraggable 拖拽幽灵样式 */
.child-drag-ghost {
  opacity: 0.4;
  border: 2px dashed #67c23a;
  background-color: rgba(103, 194, 58, 0.05);
  border-radius: 4px;
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
